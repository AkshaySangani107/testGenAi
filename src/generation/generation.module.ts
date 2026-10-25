import { Module } from '@nestjs/common';
import { TestGenerationService } from './generation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeBase } from 'src/rag/entities/knowledge-base.entity';
import { RagModule } from 'src/rag/rag.module';
import { GenerationController } from './generation.controller';
import { SpecCache } from './cache/spec-cache.entity';
import { SpecCacheService } from './cache/spec-cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeBase, SpecCache]), RagModule],
  controllers: [GenerationController],
  providers: [TestGenerationService, SpecCacheService],
  exports: [TestGenerationService, SpecCacheService],
})
export class TestGenerationModule {}
