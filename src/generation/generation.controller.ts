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

@Controller('generate')
export class GenerationController {
  constructor(
    private readonly generationService: TestGenerationService,
    private readonly cacheService: SpecCacheService,
    private readonly expanderService: SpecExpanderService,
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
    return { success: true };
  }
}
