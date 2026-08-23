import { Controller, Post, Body } from '@nestjs/common'
import { TestGenerationService } from './generation.service'
import { GenerateTestDto } from './dto/generate.dto'
import { EvaluateRequestDto } from './dto/evaluate.request.dto';
import { EvaluationIssue } from './types/evaluation.type';

@Controller('generate')
export class GenerationController {
    constructor(private readonly generationService: TestGenerationService) { }

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
}
