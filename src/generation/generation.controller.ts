import { Controller, Post, Body, Get } from '@nestjs/common';
import { TestGenerationService } from './generation.service';
import { GenerateTestDto } from './dto/generate.dto';
import { EvaluateRequestDto } from './dto/evaluate.request.dto';
import { EvaluationIssue } from './types/evaluation.type';
import { RetryGenerateDto } from './dto/retry-generate.dto';
import { SpecCacheService } from './cache/spec-cache.service';
import { SaveSpecCacheDto } from './dto/save-cache.dto';
import { SpecExpanderService } from './expansion/spec-expander.service';
import { ExpandTestDto } from './dto/expand-test.dto';
import { DatasetService } from '../dataset/dataset.service';
import * as crypto from 'crypto';

@Controller('generate')
export class GenerationController {
  constructor(
    private readonly generationService: TestGenerationService,
    private readonly cacheService: SpecCacheService,
    private readonly expanderService: SpecExpanderService,
    private readonly datasetService: DatasetService,
  ) {}

  @Get('health')
  health(): { status: string; version: string } {
    return { status: 'ok', version: '1.0.0' };
  }

  @Post()
  async generate(@Body() body: GenerateTestDto): Promise<string> {
    return this.generationService.generateTests(
      body.fileContent,
      body.dependencyContext,
    );
  }

  @Post('evaluate/quality')
  async evaluateQuality(
    @Body() body: EvaluateRequestDto,
  ): Promise<{ score: number; issues: EvaluationIssue[] }> {
    return this.generationService.evaluateQuality(body);
  }

  @Post('retry')
  async retryGenerate(@Body() body: RetryGenerateDto): Promise<string> {
    return this.generationService.retryGenerateTests(body);
  }

  @Post('expand')
  async expandSpec(@Body() body: ExpandTestDto): Promise<string> {
    return this.expanderService.expandSpec(body);
  }

  @Post('cache/save')
  async saveCache(
    @Body() body: SaveSpecCacheDto,
  ): Promise<{ success: boolean }> {
    await this.cacheService.saveSpec(body);

    if (body.score >= 65) {
      const hash = crypto
        .createHash('sha256')
        .update(body.sourceContent)
        .digest('hex');
      await this.datasetService.savePair({
        sourceHash: hash,
        serviceName: body.className,
        sourceCode: body.sourceContent,
        systemPrompt:
          'You are an expert NestJS unit test engineer. Generate comprehensive, type-safe Jest unit tests with zero any.',
        userPrompt: `Generate unit test for ${body.className}`,
        generatedSpec: body.specContent,
        evaluationScore: body.score,
        passedOnAttempt: body.attempts,
        modelProvider: body.modelProvider || 'gemini',
      });
    }

    return { success: true };
  }
}
