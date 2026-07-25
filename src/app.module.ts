import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RagModule } from './rag/rag.module';
import { EmbeddingService } from './rag/embedding.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: +process.env.DATABASE_PORT!,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: false, // never true in production
    }),
    RagModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private embeddingService: EmbeddingService) { }

  async onModuleInit() {
    // Embed all knowledge on startup
    await this.embeddingService.embedAllKnowledge()


    // Test search
    const results = await this.embeddingService.searchSimilar(
      'how to test when user is not found in NestJS service',
      'typescript',
      3
    )

    console.log('Search results:')
    results.forEach(r => {
      console.log(`[${(r.similarity * 100).toFixed(1)}%] ${r.title}`)
    })
  }
}
