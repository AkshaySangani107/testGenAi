import { Controller, Post, Body } from '@nestjs/common'
import { TestGenerationService } from './generation.service'

@Controller('generate')
export class GenerationController {
    constructor(private readonly generationService: TestGenerationService) { }

    @Post()
    async generate(@Body() body: { fileContent: string }): Promise<string> {
        return this.generationService.generateTests(body.fileContent)
    }
}