import { Module } from "@nestjs/common";
import { TestGenerationService } from "./generation.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { KnowledgeBase } from "src/rag/entities/knowledge-base.entity";
import { RagModule } from "src/rag/rag.module";
import { GenerationController } from "./generation.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([KnowledgeBase]),
        RagModule
    ],
    controllers: [GenerationController],
    providers: [TestGenerationService],
    exports: [TestGenerationService],
})
export class TestGenerationModule {

}
