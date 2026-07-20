import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
} from 'typeorm'

@Entity('knowledge_base')
export class KnowledgeBase {
    @PrimaryGeneratedColumn()
    id: number

    @Column('text')
    content: string

    @Column('text', { nullable: true })
    embedding: string

    @Column({ length: 50 })
    category: string

    @Column({ length: 20 })
    language: string

    @CreateDateColumn()
    createdAt: Date
}