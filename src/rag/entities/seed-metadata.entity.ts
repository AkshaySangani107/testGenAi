import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm'

@Entity('seed_metadata')
export class SeedMetadata {
    @PrimaryGeneratedColumn()
    id: number

    @Column('varchar', { length: 100, unique: true })
    key: string

    @Column('int')
    version: number

    @Column('text', { nullable: true })
    description: string

    @CreateDateColumn()
    appliedAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
