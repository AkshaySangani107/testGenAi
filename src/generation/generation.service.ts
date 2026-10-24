/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ParsedClass, parseTypeScriptFile } from 'src/parser/typescript.parser';
import { EmbeddingService } from 'src/rag/embedding.service';
import { KnowledgeBase } from 'src/rag/entities/knowledge-base.entity';
import { Repository } from 'typeorm';
import { EvaluateRequestDto } from './dto/evaluate.request.dto';
import { RetryGenerateDto } from './dto/retry-generate.dto';
import { EvaluationIssue } from './types/evaluation.type';
import * as ts from 'typescript';

@Injectable()
export class TestGenerationService {
  private readonly logger = new Logger(TestGenerationService.name);

  constructor(
    private readonly aiService: AiService,
    @InjectRepository(KnowledgeBase)
    private readonly knowledgeRepo: Repository<KnowledgeBase>,
    @Inject(EmbeddingService)
    private readonly embeddingService: EmbeddingService,
  ) {}

  private cleanOutput(code: string): string {
    const cleaned = code
      .replace(/^```typescript\n?/i, '')
      .replace(/^```ts\n?/i, '')
      .replace(/^```\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();

    // 1. Initial check: check if code parses cleanly with TypeScript compiler
    const initialSf = ts.createSourceFile(
      'spec.tmp.ts',
      cleaned,
      ts.ScriptTarget.Latest,
      true,
    );
    const initialDiagnostics: ts.Diagnostic[] =
      (initialSf as unknown as { parseDiagnostics?: ts.Diagnostic[] })
        .parseDiagnostics || [];
    if (initialDiagnostics.length === 0) {
      return cleaned;
    }

    this.logger.warn(
      `Generated test has ${initialDiagnostics.length} syntactic issues. Applying AST syntax healer...`,
    );

    // 2. Syntax Healer: If code was cut off mid-statement, peel back incomplete statements
    const lines = cleaned.split('\n');
    let maxAttempts = Math.min(lines.length, 60);

    while (maxAttempts > 0 && lines.length > 5) {
      const candidate = lines.join('\n');
      const openBraces = (candidate.match(/\{/g) || []).length;
      const closeBraces = (candidate.match(/\}/g) || []).length;

      // Close open blocks cleanly
      let patched = candidate;
      if (openBraces > closeBraces) {
        patched += '\n' + '});\n'.repeat(openBraces - closeBraces);
      }

      const sf = ts.createSourceFile(
        'spec.tmp.ts',
        patched,
        ts.ScriptTarget.Latest,
        true,
      );
      const sfDiagnostics: ts.Diagnostic[] =
        (sf as unknown as { parseDiagnostics?: ts.Diagnostic[] })
          .parseDiagnostics || [];
      if (sfDiagnostics.length === 0) {
        this.logger.log(
          '✅ AST Syntax Healer successfully repaired spec syntax to 0 errors',
        );
        return patched.trim();
      }

      // Pop last potentially cut-off line and retry
      lines.pop();
      maxAttempts--;
    }

    return cleaned;
  }

  async generateTests(
    fileContent: string,
    dependencyContext?: string,
  ): Promise<string> {
    // Step 1: parse the file
    const parsedFile = parseTypeScriptFile(fileContent);
    this.logger.log(`Generating tests for class: ${parsedFile.className}`);

    // Step 2: build search query from parsed result
    const searchQuery = `NestJS ${parsedFile.className} service 
  with methods: ${parsedFile.methods.map((m) => m.name).join(', ')}
  dependencies: ${parsedFile.injectedDependencies.join(', ')}`;

    // Step 3: search RAG for relevant patterns
    const ragResults = await this.embeddingService.searchSimilar(
      searchQuery,
      'typescript',
      3,
    );
    this.logger.log(
      `Retrieved ${ragResults.length} RAG reference patterns for ${parsedFile.className}`,
    );

    // Step 4: build the prompt (replace {parsedClass} and {ragContext})
    const prompt = this.buildPrompt(
      parsedFile,
      ragResults,
      fileContent,
      dependencyContext,
    );
    // Step 5: call LLM Provider
    const result = await this.aiService.generate(prompt);

    // Step 6: return generated test code as string
    const code = typeof result === 'string' ? result : '';
    this.logger.log(`Test generation completed for ${parsedFile.className}`);
    return this.cleanOutput(code);
  }

  private buildPrompt(
    parsedClass: ParsedClass,
    ragContext: { content: string; title: string }[],
    sourceContent: string,
    dependencyContext?: string,
  ): string {
    const compactClass = this.buildCompactClass(parsedClass, sourceContent);
    const patterns = ragContext
      .map((r) => `- ${r.title}: ${r.content.slice(0, 150)}`)
      .join('\n');

    const serviceFileName = parsedClass.className
      .replace('Service', '')
      .toLowerCase();

    const dependencySection = dependencyContext
      ? `PROJECT LEVEL-1 DEPENDENCY MOCK CONTRACT:
${dependencyContext}

`
      : '';

    return `You are a senior NestJS engineer generating Jest unit tests.

CLASS:
${compactClass}

${dependencySection}PATTERNS:
${patterns}

CRITICAL RULES:
- TYPE SAFETY: NEVER USE 'any' IN GENERATED CODE. Use actual types (e.g. ${parsedClass.className}, entity classes, DTO classes) whenever known. If a type is not known or when casting mock stubs, use 'unknown' (e.g. const item = {} as unknown as TargetType, or as unknown).
- Import service: import { ${parsedClass.className} } from './${serviceFileName}.service'
- Copy ALL imports EXACTLY from ACTUAL IMPORTS above (do not alter paths, e.g. use exact relative or tsconfig paths)
- UNIT TEST BOUNDARY: Mock ONLY direct constructor dependencies of ${parsedClass.className}. DO NOT import or provide nested/transitive dependencies in Test.createTestingModule.
- For ALL DTOs: const dto = {} as unknown as DtoType (use actual imported DTO type name)
- For ALL response types: const res = {} as unknown as ResponseType (use actual imported response type name)
- For ALL mocks: const mock = { ... } as unknown as DependencyType (use actual dependency class name)
- For external libraries like bcrypt:
  - If code calls bcrypt.hashSync: (jest.spyOn(bcrypt, 'hashSync') as unknown as jest.SpyInstance).mockReturnValue('hashed')
  - If code calls bcrypt.hash: (jest.spyOn(bcrypt, 'hash') as unknown as jest.SpyInstance).mockImplementation(() => Promise.resolve('hashed'))
- NEVER invent method names — use ONLY methods called by the service as specified in the DEPENDENCY CONTRACT above
- For AutoMapper: { provide: getMapperToken(), useValue: mockMapper }
  - Import getMapperToken from '@automapper/nestjs'
  - NEVER use Mapper directly as provider token
  - Mock mapper methods used: map: jest.fn().mockImplementation((val: unknown) => val), mapArray: jest.fn().mockImplementation((arr: unknown[]) => arr || []), mapArrayAsync: jest.fn().mockImplementation((arr: unknown[]) => Promise.resolve(arr || []))
- Method names in mocks must match EXACTLY what the service calls:
  - For finder/list methods (allAsync, find, etc.): default to jest.fn().mockResolvedValue([])
  - For existence checks (existAsync, exists): default to jest.fn().mockResolvedValue(false)
  - For fetch-by-id (getWithAsync, getAsync): return array or object as expected by the service: jest.fn().mockResolvedValue([{ id: 1 } as unknown])
  - For create/save/update (createAsync, updateAsync): jest.fn().mockImplementation((val: unknown) => Promise.resolve({ id: 1, ...(typeof val === 'object' && val !== null ? val : {}) }))
- Write concise tests (1-2 tests per method) covering main path and error path so the output is COMPLETE and NEVER cut off mid-file. Ensure all closing brackets, braces, and parentheses are properly closed.

OUTPUT: ONLY valid TypeScript. NO markdown. NO backticks.`;
  }

  private buildCompactClass(
    parsedClass: ParsedClass,
    sourceContent: string,
  ): string {
    const importLines = sourceContent
      .split('\n')
      .filter((line) => line.trim().startsWith('import'))
      .join('\n');

    // const methods = parsedClass.methods
    //   .map(
    //     (m) =>
    //       `  ${m.isAsync ? 'async ' : ''}${m.name}(${m.parameters
    //         .map((p) => `${p.name}: ${p.type}`)
    //         .join(', ')}): ${m.returnType}`,
    //   )
    //   .join('\n');

    return `ACTUAL IMPORTS (use these exact paths):
${importLines}

CLASS: ${parsedClass.className}
DEPENDENCIES: ${parsedClass.injectedDependencies.join(', ')}

FULL SOURCE IMPLEMENTATION (STUDY CAREFULLY TO MOCK EXACT RETURN VALUES AND EXPECT EXACT ARGUMENTS):
${sourceContent}

CRITICAL MOCK RULES:
- NEVER use 'any'! Always use the actual type when known (e.g. Entity, DTO, Repository classes). If a type is unknown, use 'unknown' (e.g. as unknown as TargetType).
- Mock ALL dependencies as: const mockDep = { ... } as unknown as DepType
- NEVER invent method names on mocks
- Set mock methods ONLY when you are 100% certain they exist
- For external libraries like bcrypt: use (jest.spyOn(bcrypt, 'hash') as unknown as jest.SpyInstance).mockImplementation(() => Promise.resolve('hashed'))
- When a service method checks if (res.length > 0) or user.length, return an ARRAY: mock.mockResolvedValue([mockItem])
- When a service method expects an object with email like { email: dto.email }, pass { email: dto.email } in toHaveBeenCalledWith`;
  }

  async evaluateQuality(input: EvaluateRequestDto): Promise<{
    score: number;
    issues: EvaluationIssue[];
  }> {
    this.logger.log('Evaluating test quality using LLM');
    const prompt = this.buildEvaluationPrompt(input);
    const result = await this.aiService.generate(prompt);
    const jsonString = typeof result === 'string' ? result : '';
    try {
      let jsonStr = jsonString;
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonString.slice(firstBrace, lastBrace + 1);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsed = JSON.parse(jsonStr);
      const score = typeof parsed.score === 'number' ? parsed.score : 36;
      const issues = Array.isArray(parsed.issues) ? parsed.issues : [];
      this.logger.log(`LLM evaluation completed. Score: ${score}/45`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return { score, issues };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `LLM quality evaluation returned non-JSON response: ${errMsg}`,
      );
      return {
        score: 35,
        issues: [
          {
            category: 'evaluation',
            severity: 'low',
            message: 'LLM evaluator returned non-standard JSON response format',
          },
        ],
      };
    }
  }

  private buildEvaluationPrompt(input: EvaluateRequestDto): string {
    const { specContent, compactClass } = input;

    return `You are a senior NestJS engineer reviewing a generated test file.

SOURCE CLASS:
${compactClass}

GENERATED SPEC:
${specContent.slice(0, 15000)}

Evaluate the quality of the tests on these criteria:
- Dependency mocking (10pts): Are all direct dependencies properly mocked with appropriate tokens and methods?
- Mock behavior (8pts): Do mocks provide realistic return values (e.g. arrays for finders, objects for single item queries)?
- Assertions (7pts): Are assertions verifying expected outcomes and method calls?
- Async handling (5pts): Are async service methods awaited properly?
- NestJS patterns (5pts): Uses Test.createTestingModule() with providers and useValue?
- Maintainability (5pts): Is code clean, organized, and properly structured in describe/it blocks?
- Pattern adherence (5pts): Follows standard NestJS and Jest testing conventions?

Total: 45 points. Be fair, objective, and award points when the pattern is correctly implemented.

Return ONLY valid JSON, no markdown, no explanation:
{
  "score": <number 0-45>,
  "issues": [
    {
      "category": "mocking|assertion|async|patterns|maintainability",
      "severity": "low|medium|high",
      "message": "<specific actionable issue>"
    }
  ]
}`;
  }

  async retryGenerateTests(dto: RetryGenerateDto): Promise<string> {
    // Step 1: parse file
    const parsedFile = parseTypeScriptFile(dto.fileContent);
    this.logger.log(
      `Retrying test generation for ${parsedFile.className} with ${dto.feedback?.length || 0} feedback items`,
    );
    // Step 2: build search query
    const searchQuery = `NestJS ${parsedFile.className} service
            with methods: ${parsedFile.methods.map((m) => m.name).join(', ')}
            dependencies: ${parsedFile.injectedDependencies.join(', ')}`;
    // Step 3: search RAG
    const ragResults = await this.embeddingService.searchSimilar(
      searchQuery,
      'typescript',
      3,
    );
    // Step 4: build RETRY prompt (different from first gen)
    const prompt = this.buildRetryPrompt(
      parsedFile,
      ragResults,
      dto.previousSpec,
      dto.feedback,
      dto.fileContent,
      dto.dependencyContext,
    );
    // Step 5: call LLM
    const result = await this.aiService.generate(prompt);
    // Step 6: clean and return
    const code = typeof result === 'string' ? result : '';
    this.logger.log(`Retry generation completed for ${parsedFile.className}`);
    return this.cleanOutput(code);
  }

  private buildRetryPrompt(
    parsedClass: ParsedClass,
    ragContext: { content: string; title: string }[],
    previousSpec: string,
    feedback: string[],
    sourceContent: string,
    dependencyContext?: string,
  ): string {
    const serviceFileName = parsedClass.className
      .replace('Service', '')
      .toLowerCase();

    const dependencySection = dependencyContext
      ? `PROJECT LEVEL-1 DEPENDENCY MOCK CONTRACT:
${dependencyContext}

`
      : '';

    return `You are a senior NestJS engineer fixing a generated test file.

CLASS:
${this.buildCompactClass(parsedClass, sourceContent)}

${dependencySection}PREVIOUS TEST (fix this):
${previousSpec.slice(0, 12000)}

ISSUES TO FIX:
${feedback
  .slice(0, 10)
  .map((f, i) => `${i + 1}. ${f}`)
  .join('\n')}

CRITICAL RULES:
- TYPE SAFETY: NEVER USE 'any' IN GENERATED CODE. Use actual types (e.g. ${parsedClass.className}, entity classes, DTO classes) whenever known. If a type is not known or when casting mock stubs, use 'unknown' (e.g. const item = {} as unknown as TargetType, or as unknown).
- Import service: import { ${parsedClass.className} } from './${serviceFileName}.service'
- Copy ALL other imports EXACTLY from CLASS section above (do not alter paths, e.g. use exact relative or tsconfig paths)
- UNIT TEST BOUNDARY: Mock ONLY direct constructor dependencies of ${parsedClass.className}. DO NOT import or provide nested/transitive dependencies in Test.createTestingModule.
- For ALL DTOs: const dto = {} as unknown as DtoType (use actual imported DTO type name)
- For ALL response types: const res = {} as unknown as ResponseType (use actual imported response type name)
- For ALL mocks: const mock = { ... } as unknown as DependencyType (use actual dependency class name)
- For external libraries like bcrypt:
  - If code calls bcrypt.hashSync: (jest.spyOn(bcrypt, 'hashSync') as unknown as jest.SpyInstance).mockReturnValue('hashed')
  - If code calls bcrypt.hash: (jest.spyOn(bcrypt, 'hash') as unknown as jest.SpyInstance).mockImplementation(() => Promise.resolve('hashed'))
- NEVER invent method names — use ONLY methods called by the service as specified in the DEPENDENCY CONTRACT above
- For AutoMapper: { provide: getMapperToken(), useValue: mockMapper }
  - Import getMapperToken from '@automapper/nestjs'
  - NEVER use Mapper directly as provider token
  - Mock mapper methods: map: jest.fn().mockImplementation((val: unknown) => val), mapArray: jest.fn().mockImplementation((arr: unknown[]) => arr || []), mapArrayAsync: jest.fn().mockImplementation((arr: unknown[]) => Promise.resolve(arr || []))
- Method names in mocks must match EXACTLY what service calls:
  - For finder/list methods (allAsync, find, etc.): default to jest.fn().mockResolvedValue([])
  - For existence checks (existAsync, exists): default to jest.fn().mockResolvedValue(false)
  - For fetch-by-id (getWithAsync, getAsync): return array or object as expected by the service: jest.fn().mockResolvedValue([{ id: 1 } as unknown])
  - For create/save/update (createAsync, updateAsync): jest.fn().mockImplementation((val: unknown) => Promise.resolve({ id: 1, ...(typeof val === 'object' && val !== null ? val : {}) }))
- Write concise tests (1-2 tests per method) covering main path and error path so the output is COMPLETE and NEVER cut off mid-file. Ensure all closing brackets, braces, and parentheses are properly closed.

IMPORTANT: Regenerate COMPLETE file. Fix ALL issues.
OUTPUT: ONLY valid TypeScript. NO markdown. NO backticks.`;
  }
}
