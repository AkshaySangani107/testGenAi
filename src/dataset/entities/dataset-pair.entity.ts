import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type DatasetSplit = 'train' | 'val' | 'test';

@Entity('dataset_pairs')
export class DatasetPair {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column('varchar', { length: 64 })
  sourceHash: string;

  @Column('varchar', { length: 255 })
  serviceName: string;

  @Column('text')
  sourceCode: string;

  @Column('text', { nullable: true })
  dependencyContract: string | null;

  @Column('text')
  systemPrompt: string;

  @Column('text')
  userPrompt: string;

  @Column('text')
  generatedSpec: string;

  @Index()
  @Column('int')
  evaluationScore: number;

  @Column('int', { default: 1 })
  passedOnAttempt: number;

  @Column('int', { default: 0 })
  methodCoverage: number;

  @Column('int', { default: 0 })
  branchCoverage: number;

  @Index()
  @Column('varchar', { length: 20, default: 'train' })
  split: DatasetSplit;

  @Column('varchar', { length: 50, default: 'gemini' })
  modelProvider: string;

  @Column('boolean', { default: false })
  isCurated: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
