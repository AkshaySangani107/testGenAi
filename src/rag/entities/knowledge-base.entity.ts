import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm'

@Entity('knowledge_base')
export class KnowledgeBase {
    @PrimaryGeneratedColumn()
    id: number

    @Column('varchar', { length: 255 })
    title: string

    @Column('text', { array: true, default: [] })
    tags: string[]

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

    @UpdateDateColumn()
    updatedAt: Date
}