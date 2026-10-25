import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { KnowledgeBase } from './entities/knowledge-base.entity'
import { SeedMetadata } from './entities/seed-metadata.entity'
import { EmbeddingService } from './embedding.service'
import { SeedManagerService } from './seed/seed-manager.service'

@Module({
    imports: [TypeOrmModule.forFeature([KnowledgeBase, SeedMetadata])],
    providers: [EmbeddingService, SeedManagerService],
    exports: [EmbeddingService, SeedManagerService],
})
export class RagModule { }