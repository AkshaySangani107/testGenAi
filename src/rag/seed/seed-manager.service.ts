import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { KnowledgeBase } from '../entities/knowledge-base.entity';
import { SeedMetadata } from '../entities/seed-metadata.entity';
import { EmbeddingService } from '../embedding.service';
import {
  knowledgeData,
  KNOWLEDGE_PATTERNS_SEED_VERSION,
} from './knowledge.seed';
import { allFewShotSeeds } from './few-shot.seed';
import { SeedDefinition } from './types/seed-definition.type';

@Injectable()
export class SeedManagerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedManagerService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(SeedMetadata)
    private readonly seedMetadataRepo: Repository<SeedMetadata>,
    @InjectRepository(KnowledgeBase)
    private readonly knowledgeRepo: Repository<KnowledgeBase>,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.runManagedSeed();
  }

  /**
   * Evaluates each seed file against its own individual version in seed_metadata.
   * If a file's version has increased, only that specific seed is updated/re-seeded.
   */
  async runManagedSeed(): Promise<void> {
    try {
      // Ensure seed_metadata table exists safely in public schema
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "seed_metadata" (
          "id" SERIAL PRIMARY KEY,
          "key" VARCHAR(100) UNIQUE NOT NULL,
          "version" INTEGER NOT NULL,
          "description" TEXT,
          "appliedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        )
      `);

      let totalUpdated = 0;

      // 1. Check & run general knowledge pattern seed
      const patternSeedRan = await this.syncPatternKnowledgeSeed();
      if (patternSeedRan) totalUpdated++;

      // 2. Check & run each granular few-shot example seed independently
      for (const seedDef of allFewShotSeeds) {
        const ran = await this.syncIndividualSeed(seedDef);
        if (ran) totalUpdated++;
      }

      if (totalUpdated > 0) {
        this.logger.log(
          `Detected ${totalUpdated} updated seed file(s). Running embeddings for missing items...`,
        );
        await this.embeddingService.embedAllKnowledge();
        this.logger.log('✅ Seed synchronization complete');
      } else {
        this.logger.log(
          'All seed files are up to date with their respective versions. Skipping seed.',
        );
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to complete managed seed: ${errMsg}`);
    }
  }

  /**
   * Synchronizes general patterns knowledge seed if KNOWLEDGE_PATTERNS_SEED_VERSION increased
   */
  private async syncPatternKnowledgeSeed(): Promise<boolean> {
    const key = 'SEED_KNOWLEDGE_PATTERNS';
    const targetVersion = KNOWLEDGE_PATTERNS_SEED_VERSION;

    const existingRecord = await this.seedMetadataRepo.findOne({
      where: { key },
    });

    const currentVersion = existingRecord ? existingRecord.version : 0;

    if (currentVersion >= targetVersion) {
      return false;
    }

    this.logger.log(
      `Updating pattern seed [${key}] (version ${currentVersion} -> ${targetVersion})...`,
    );

    for (const item of knowledgeData) {
      const record = await this.knowledgeRepo.findOne({
        where: { title: item.title, category: item.category },
      });

      if (record) {
        record.content = item.content;
        record.tags = item.tags;
        record.language = item.language;
        record.contentType = 'PATTERN';
        record.embedding = null as unknown as string; // Reset embedding to recompute
        await this.knowledgeRepo.save(record);
      } else {
        const entity = this.knowledgeRepo.create({
          ...item,
          contentType: 'PATTERN',
        });
        await this.knowledgeRepo.save(entity);
      }
    }

    await this.recordVersionUpdate(
      key,
      targetVersion,
      `Updated knowledge patterns to v${targetVersion}`,
      existingRecord,
    );

    return true;
  }

  /**
   * Synchronizes an individual spec example seed if its version increased
   */
  private async syncIndividualSeed(seedDef: SeedDefinition): Promise<boolean> {
    const {
      key,
      version: targetVersion,
      title,
      category,
      language,
      contentType,
      tags,
      content,
    } = seedDef;

    const existingRecord = await this.seedMetadataRepo.findOne({
      where: { key },
    });

    const currentVersion = existingRecord ? existingRecord.version : 0;

    if (currentVersion >= targetVersion) {
      return false;
    }

    this.logger.log(
      `Updating individual seed [${key}] (version ${currentVersion} -> ${targetVersion})...`,
    );

    const record = await this.knowledgeRepo.findOne({
      where: { title, contentType },
    });

    if (record) {
      record.content = content;
      record.tags = tags;
      record.category = category;
      record.language = language;
      record.embedding = null as unknown as string; // Reset embedding to recompute
      await this.knowledgeRepo.save(record);
    } else {
      const entity = this.knowledgeRepo.create({
        title,
        category,
        language,
        contentType,
        tags,
        content,
      });
      await this.knowledgeRepo.save(entity);
    }

    await this.recordVersionUpdate(
      key,
      targetVersion,
      `Updated ${title} to v${targetVersion}`,
      existingRecord,
    );

    return true;
  }

  /**
   * Updates or creates record in seed_metadata table
   */
  private async recordVersionUpdate(
    key: string,
    version: number,
    description: string,
    existingRecord: SeedMetadata | null,
  ): Promise<void> {
    if (existingRecord) {
      existingRecord.version = version;
      existingRecord.description = description;
      await this.seedMetadataRepo.save(existingRecord);
    } else {
      const meta = this.seedMetadataRepo.create({
        key,
        version,
        description,
      });
      await this.seedMetadataRepo.save(meta);
    }
  }
}
