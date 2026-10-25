import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('spec_cache')
export class SpecCache {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column('varchar', { length: 64 })
  contentHash: string;

  @Column('varchar', { length: 255 })
  className: string;

  @Column('text')
  specContent: string;

  @Column('int')
  score: number;

  @Column('int')
  attempts: number;

  @Column('varchar', { length: 50, default: 'gemini' })
  modelProvider: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
