import { DataSource } from 'typeorm'
import { KnowledgeBase } from './rag/entities/knowledge-base.entity'
import * as dotenv from 'dotenv'
dotenv.config()

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: +process.env.DATABASE_PORT!,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [KnowledgeBase],
    migrations: ['src/migrations/*{.ts,.js}'],
})