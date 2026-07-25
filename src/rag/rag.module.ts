import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { KnowledgeBase } from './entities/knowledge-base.entity'
import { EmbeddingService } from './embedding.service'

@Module({
    imports: [TypeOrmModule.forFeature([KnowledgeBase])],
    providers: [EmbeddingService],
    exports: [EmbeddingService],
})
export class RagModule { }