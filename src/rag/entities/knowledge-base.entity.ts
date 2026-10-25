import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * PATTERN — short text tip injected as bullet-point context
 * EXAMPLE — full working TypeScript spec code injected as a few-shot reference
 */
export type KnowledgeContentType = 'PATTERN' | 'EXAMPLE';

@Entity('knowledge_base')
export class KnowledgeBase {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column('varchar', { length: 255 })
  public title: string;

  @Column('text', { array: true, default: [] })
  public tags: string[];

  @Column('text')
  public content: string;

  @Column('text', { nullable: true })
  public embedding: string;

  @Column({ length: 50 })
  public category: string;

  @Column({ length: 20 })
  public language: string;

  /**
   * Distinguishes short text patterns from full code examples.
   * Defaults to 'PATTERN' so all existing seeded data remains valid.
   */
  @Column({ length: 10, default: 'PATTERN' })
  public contentType: KnowledgeContentType;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
