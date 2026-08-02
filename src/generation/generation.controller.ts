import { Controller, Post, Body } from '@nestjs/common'
import { TestGenerationService } from './generation.service'
import { GenerateTestDto } from './dto/generate.dto'

@Controller('generate')
export class GenerationController {
    constructor(private readonly generationService: TestGenerationService) { }

    @Post()
    async generate(@Body() body: GenerateTestDto): Promise<string> {
        return this.generationService.generateTests(body.fileContent)
    }
}
