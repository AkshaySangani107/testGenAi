import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { SpecCache } from './spec-cache.entity';

export interface SaveCacheInput {
  sourceContent: string;
  className: string;
  specContent: string;
  score: number;
  attempts: number;
  modelProvider?: string;
}

@Injectable()
export class SpecCacheService {
  private readonly logger = new Logger(SpecCacheService.name);

  constructor(
    @InjectRepository(SpecCache)
    private readonly cacheRepo: Repository<SpecCache>,
  ) {}

  /**
   * Computes deterministic SHA-256 hash of normalized source content
   */
  computeHash(sourceContent: string): string {
    const normalized = sourceContent.replace(/\r\n/g, '\n').trim();
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Looks up cached spec by source content hash.
   * Returns null if no cache hit exists.
   */
  async getCachedSpec(sourceContent: string): Promise<SpecCache | null> {
    const hash = this.computeHash(sourceContent);
    const hit = await this.cacheRepo.findOne({
      where: { contentHash: hash },
    });

    if (hit) {
      this.logger.log(
        `⚡ Spec Cache HIT for ${hit.className} (Hash: ${hash.slice(0, 10)}... | Score: ${hit.score}/80) [0 TOKENS]`,
      );
      return hit;
    }

    return null;
  }

  /**
   * Saves or updates an accepted spec in the cache table
   */
  async saveSpec(input: SaveCacheInput): Promise<void> {
    try {
      const hash = this.computeHash(input.sourceContent);
      const existing = await this.cacheRepo.findOne({
        where: { contentHash: hash },
      });

      if (existing) {
        // Update only if new score is higher or equal
        if (input.score >= existing.score) {
          existing.specContent = input.specContent;
          existing.score = input.score;
          existing.attempts = input.attempts;
          existing.modelProvider = input.modelProvider || 'gemini';
          await this.cacheRepo.save(existing);
          this.logger.log(
            `Updated cached spec for ${input.className} with higher score: ${input.score}`,
          );
        }
      } else {
        const entity = this.cacheRepo.create({
          contentHash: hash,
          className: input.className,
          specContent: input.specContent,
          score: input.score,
          attempts: input.attempts,
          modelProvider: input.modelProvider || 'gemini',
        });
        await this.cacheRepo.save(entity);
        this.logger.log(
          `Cached accepted spec for ${input.className} (Score: ${input.score}/80)`,
        );
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to save spec cache: ${errMsg}`);
    }
  }
}
