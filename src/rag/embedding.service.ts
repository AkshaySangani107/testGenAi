import { Injectable, Logger } from '@nestjs/common'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Repository } from 'typeorm'
import { KnowledgeBase } from './entities/knowledge-base.entity'

@Injectable()
export class EmbeddingService {
    private readonly logger = new Logger(EmbeddingService.name)
    private genAI: GoogleGenerativeAI

    constructor(
        @InjectRepository(KnowledgeBase)
        private readonly knowledgeRepo: Repository<KnowledgeBase>
    ) {
        this.genAI = new GoogleGenerativeAI(String(process.env.GEMINI_API_KEY))
    }

    // ── Convert text → vector numbers ──
    async generateEmbedding(text: string): Promise<number[]> {
        const model = this.genAI.getGenerativeModel({
            model: 'gemini-embedding-001'
        })
        const result = await model.embedContent(text)
        return result.embedding.values
    }

    // ── Embed all seeded knowledge items ──
    async embedAllKnowledge(): Promise<void> {
        const items = await this.knowledgeRepo.find({
            where: { embedding: IsNull() }
        })

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
    ): Promise<{ content: string; title: string; similarity: number }[]> {
        const queryEmbedding = await this.generateEmbedding(query)

        const results = await this.knowledgeRepo.query(
            `SELECT 
        title,
        content,
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