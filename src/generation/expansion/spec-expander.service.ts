import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../../ai/ai.service';
import { parseTypeScriptFile } from '../../parser/typescript.parser';
import { ExpandTestDto } from '../dto/expand-test.dto';

@Injectable()
export class SpecExpanderService {
  private readonly logger = new Logger(SpecExpanderService.name);

  constructor(private readonly aiService: AiService) {}

  private cleanOutput(code: string): string {
    return code
      .replace(/^```typescript\n?/i, '')
      .replace(/^```ts\n?/i, '')
      .replace(/^```\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();
  }

  async expandSpec(dto: ExpandTestDto): Promise<string> {
    const parsedFile = parseTypeScriptFile(dto.sourceContent);
    this.logger.log(
      `Expanding spec for ${parsedFile.className}: ${dto.uncoveredMethods.length} missing methods, ${dto.uncoveredBranches.length} missing branches`,
    );

    const prompt = this.buildExpansionPrompt(dto, parsedFile.className);
    const result = await this.aiService.generate(prompt);
    const raw = typeof result === 'string' ? result : '';
    const cleaned = this.cleanOutput(raw);

    this.logger.log(
      `Successfully generated expansion test blocks for ${parsedFile.className}`,
    );
    return cleaned;
  }

  private buildExpansionPrompt(dto: ExpandTestDto, className: string): string {
    const methodsList =
      dto.uncoveredMethods.length > 0
        ? dto.uncoveredMethods.map((m) => `- Method: ${m}`).join('\n')
        : '- None';

    const branchesList =
      dto.uncoveredBranches.length > 0
        ? dto.uncoveredBranches.map((b) => `- Branch/Guard: ${b}`).join('\n')
        : '- None';

    const depSection = dto.dependencyContext
      ? `PROJECT LEVEL-1 DEPENDENCY MOCK CONTRACT:
${dto.dependencyContext}

`
      : '';

    return `You are a senior NestJS engineer writing Jest unit tests to close specific code coverage gaps.

SOURCE SERVICE CLASS (${className}):
${dto.sourceContent}

${depSection}EXISTING WORKING TEST SPEC (already compiles and passes Jest):
${dto.existingSpec.slice(0, 10000)}

IDENTIFIED COVERAGE GAPS TO TEST:
Missing / Untested Methods:
${methodsList}

Missing / Untested Branches & Error Guards:
${branchesList}

TASK:
Write ONLY the additional test blocks (e.g. describe('<methodName>', () => { ... }) or it(...) blocks) needed to test the missing methods and branches.

CRITICAL RULES:
1. DO NOT rewrite or redefine the entire test file, beforeAll, beforeEach, or Test.createTestingModule.
2. Rely directly on the existing service and mock variables defined in the existing spec (e.g. 'service', 'repository', 'mockMapper').
3. NEVER USE 'any' IN CODE. Use actual types whenever known. When casting or stubbing mocks, use 'unknown' (e.g. const res = {} as unknown as TargetType).
4. For error branches (e.g. NotFoundException, BadRequestException), mock the dependencies to trigger the guard and assert: await expect(service.method(...)).rejects.toThrow(ExpectedException).
5. Ensure all brackets, braces, and parentheses are properly closed.
6. Output ONLY valid TypeScript test blocks (nested describe or it blocks). NO markdown. NO backticks. NO explanations.`;
  }
}
