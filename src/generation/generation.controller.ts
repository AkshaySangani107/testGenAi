import { Controller, Post, Body, Get } from '@nestjs/common'
import { TestGenerationService } from './generation.service'
import { GenerateTestDto } from './dto/generate.dto'
import { EvaluateRequestDto } from './dto/evaluate.request.dto';
import { EvaluationIssue } from './types/evaluation.type';
import { RetryGenerateDto } from './dto/retry-generate.dto';

@Controller('generate')
export class GenerationController {
    constructor(private readonly generationService: TestGenerationService) { }

    @Get('health')
    health(): { status: string; version: string } {
        return { status: 'ok', version: '1.0.0' }
    }

    @Post()
    async generate(@Body() body: GenerateTestDto): Promise<string> {
        return this.generationService.generateTests(body.fileContent)
    }

    @Post('evaluate/quality')
    async evaluateQuality(
        @Body() body: EvaluateRequestDto
    ): Promise<{ score: number; issues: EvaluationIssue[] }> {
        return this.generationService.evaluateQuality(body)
    }

    @Post('retry')
    async retryGenerate(
        @Body() body: RetryGenerateDto
    ): Promise<string> {
        return this.generationService.retryGenerateTests(body)
    }
}
