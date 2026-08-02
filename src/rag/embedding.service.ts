import { Injectable, Logger } from '@nestjs/common'
import { AiService } from '../ai/ai.service'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Repository } from 'typeorm'
import { KnowledgeBase } from './entities/knowledge-base.entity'

@Injectable()
export class EmbeddingService {
    private readonly logger = new Logger(EmbeddingService.name)

    constructor(
        private readonly aiService: AiService,
        @InjectRepository(KnowledgeBase)
        private readonly knowledgeRepo: Repository<KnowledgeBase>
    ) {}

    // ── Convert text → vector numbers ──
    async generateEmbedding(text: string): Promise<number[]> {
        return await this.aiService.embed(text);
    }

    // ── Embed all seeded knowledge items ──
    async embedAllKnowledge(): Promise<void> {
        const items = await this.knowledgeRepo.find({
            where: { embedding: IsNull() }
        })
        if (items.length === 0) {
            this.logger.log('All items already embedded — skipping')
            return  // ← exits early, saves quota
        }

        this.logger.log(`Found ${items.length} items to embed`)

        for (const item of items) {
            const textToEmbed = `${item.title} ${item.content} ${item.tags.join(' ')}`
            const embedding = await this.generateEmbedding(textToEmbed)

            await this.knowledgeRepo.query(
                `UPDATE knowledge_base 
         SET embedding = $1 
         WHERE id = $2`,
                [JSON.stringify(embedding), item.id]
            )

            this.logger.log(`Embedded: ${item.title}`)
        }

        this.logger.log('✅ All knowledge items embedded')
    }

    // ── Search similar knowledge by query ──
    async searchSimilar(
        query: string,
        language: string,
        limit: number = 5
    ): Promise<{ content: string; title: string; tags: string[]; category: string; similarity: number }[]> {
        const queryEmbedding = await this.generateEmbedding(query)

        const results = await this.knowledgeRepo.query(
            `SELECT 
        title,
        content,
        tags,
        category,
        1 - (embedding::vector <=> $1::vector) as similarity
       FROM knowledge_base
       WHERE language = $2
         AND embedding IS NOT NULL
       ORDER BY embedding::vector <=> $1::vector
       LIMIT $3`,
            [JSON.stringify(queryEmbedding), language, limit]
        )

        return results
    }
}