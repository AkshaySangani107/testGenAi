import { Inject, Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ParsedClass, parseTypeScriptFile } from 'src/parser/typescript.parser';
import { EmbeddingService } from 'src/rag/embedding.service';
import { KnowledgeBase } from 'src/rag/entities/knowledge-base.entity';
import { Repository } from 'typeorm';
import { EvaluateRequestDto } from './dto/evaluate.request.dto';
import { RetryGenerateDto } from './dto/retry-generate.dto';

@Injectable()
export class TestGenerationService {
  private readonly logger = new Logger(TestGenerationService.name);

  constructor(
    private readonly aiService: AiService,
    @InjectRepository(KnowledgeBase)
    private readonly knowledgeRepo: Repository<KnowledgeBase>,
    @Inject(EmbeddingService)
    private readonly embeddingService: EmbeddingService,
  ) { }

  private cleanOutput(code: string): string {
    const cleaned = code
      .replace(/^```typescript\n?/i, '')
      .replace(/^```ts\n?/i, '')
      .replace(/^```\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();

    // ← ADD THIS: check if spec is complete
    // Count opening and closing braces
    const openBraces = (cleaned.match(/\{/g) || []).length;
    const closeBraces = (cleaned.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      // Add missing closing braces
      const missing = openBraces - closeBraces;
      return cleaned + '\n' + '}'.repeat(missing);
    }

    return cleaned;
  }

  async generateTests(fileContent: string, dependencyContext: string): Promise<string> {
    // Step 1: parse the file
    const parsedFile = parseTypeScriptFile(fileContent);

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

    // Step 4: build the prompt (replace {parsedClass} and {ragContext})
    const prompt = this.buildPrompt(parsedFile, ragResults, fileContent, dependencyContext);
    // Step 5: call LLM Provider
    const result = await this.aiService.generate(prompt);

    // Step 6: return generated test code as string
    const code = typeof result === 'string' ? result : '';
    return this.cleanOutput(code);
  }

  private buildPrompt(
    parsedClass: ParsedClass,
    ragContext: { content: string; title: string }[],
    sourceContent: string,
    dependencyContext?: string
  ): string {
    const compactClass = this.buildCompactClass(parsedClass, sourceContent)
    const patterns = ragContext
      .map(r => `- ${r.title}: ${r.content.slice(0, 150)}`)
      .join('\n')

    const serviceFileName = parsedClass.className
      .replace('Service', '')
      .toLowerCase()

    const depSection = dependencyContext
      ? `PROJECT DEPENDENCIES (use for correct imports and method names):
${dependencyContext.slice(0, 4000)}

`
      : ''

    return `You are a senior NestJS engineer generating Jest unit tests.

CLASS:
${compactClass}

${depSection}PATTERNS:
${patterns}

CRITICAL RULES:
- Import service: import { ${parsedClass.className} } from './${serviceFileName}.service'
- Copy ALL other import paths EXACTLY from PROJECT DEPENDENCIES above
- For ALL DTOs: const dto = {} as unknown as DtoType
- For ALL response types: const res = {} as unknown as ResponseType
- For ALL mocks: const mock = {} as any
- NEVER use Partial<ClassName> — always use as any
- NEVER invent method names — use ONLY methods visible in PROJECT DEPENDENCIES
- For AutoMapper: { provide: getMapperToken(), useValue: mockMapper }
- Import getMapperToken from '@automapper/nestjs'
- Mock method names must EXACTLY match what you see in the dependency files

OUTPUT: ONLY valid TypeScript. NO markdown. NO backticks.`
  }
  private buildCompactClass(
    parsedClass: ParsedClass,
    sourceContent: string
  ): string {
    const importLines = sourceContent
      .split('\n')
      .filter(line => line.startsWith('import'))
      .slice(0, 15)
      .join('\n')

    const methods = parsedClass.methods
      .map(m => `  ${m.isAsync ? 'async ' : ''}${m.name}(${m.parameters.map(p => `${p.name}: ${p.type}`).join(', ')
        }): ${m.returnType}`)
      .join('\n')

    return `ACTUAL IMPORTS (use these exact paths):
${importLines}

CLASS: ${parsedClass.className}
DEPENDENCIES: ${parsedClass.injectedDependencies.join(', ')}
METHODS:
${methods}

CRITICAL MOCK RULES:
- Mock ALL dependencies as: const mockDep = {} as any
- NEVER use typed Partial<ClassName> for mocks
- NEVER invent method names on mocks
- Set mock methods ONLY when you are 100% certain they exist
- When uncertain about method names use:
  jest.spyOn(service as any, 'methodName')
  instead of mocking the dependency directly
- For CloudinaryService and similar: mock the entire service as jest.fn()`

  }



  async evaluateQuality(
    input: EvaluateRequestDto,
  ): Promise<{ score: number; issues: any[] }> {
    const prompt = this.buildEvaluationPrompt(input);
    const result = await this.aiService.generate(prompt);
    const jsonString = typeof result === 'string' ? result : '';
    try {
      const cleaned = jsonString
        .replace(/^```json\n?/i, '')
        .replace(/^```\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();

      return JSON.parse(cleaned);
    } catch {
      return {
        score: 22,
        issues: [
          {
            category: 'evaluation',
            severity: 'low',
            message: 'LLM evaluator returned invalid response',
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
${specContent.slice(0, 2000)}

Evaluate on these criteria:
- Dependency mocking (10pts): Are all deps properly mocked?
- Mock behavior (8pts): Do mocks represent real behavior?
- Assertions (7pts): Are assertions meaningful and strong?
- Async handling (5pts): Are async methods tested correctly?
- NestJS patterns (5pts): Uses Test.createTestingModule()?
- Maintainability (5pts): Is code readable and organized?
- Pattern adherence (5pts): Follows NestJS testing conventions?

Total: 45 points.

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
      dto.dependencyContext
    );
    // Step 5: call LLM
    const result = await this.aiService.generate(prompt);
    // Step 6: clean and return
    const code = typeof result === 'string' ? result : '';
    return this.cleanOutput(code);
  }

  private buildRetryPrompt(
    parsedClass: ParsedClass,
    ragContext: any[],
    previousSpec: string,
    feedback: string[],
    dependencyContext?: string  // ← add
  ): string {
    const serviceFileName = parsedClass.className
      .replace('Service', '')
      .toLowerCase()

    const depSection = dependencyContext
      ? `PROJECT DEPENDENCIES (use for correct imports and method names):
${dependencyContext.slice(0, 3000)}

`
      : ''

    return `You are a senior NestJS engineer fixing a generated test file.

CLASS:
${this.buildCompactClass(parsedClass, '')}

${depSection}PREVIOUS TEST (fix this):
${previousSpec.slice(0, 1000)}

ISSUES TO FIX:
${feedback.slice(0, 4).map((f, i) => `${i + 1}. ${f}`).join('\n')}

CRITICAL RULES:
- Import service: import { ${parsedClass.className} } from './${serviceFileName}.service'
- Copy ALL imports EXACTLY from PROJECT DEPENDENCIES above
- For ALL DTOs: const dto = {} as unknown as DtoType
- For ALL response types: const res = {} as unknown as ResponseType
- For ALL mocks: const mock = {} as any
- NEVER use Partial<ClassName>
- NEVER invent method names — only use methods from PROJECT DEPENDENCIES
- For AutoMapper: { provide: getMapperToken(), useValue: mockMapper }
- Mock method names must EXACTLY match dependency files

IMPORTANT: Regenerate COMPLETE file. Fix ALL issues.
OUTPUT: ONLY valid TypeScript. NO markdown. NO backticks.`
  }
}
