import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContentTypeToKnowledgeBase1792907047234 implements MigrationInterface {
  name = 'AddContentTypeToKnowledgeBase1792907047234';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "knowledge_base"
            ADD COLUMN IF NOT EXISTS "contentType" VARCHAR(10) NOT NULL DEFAULT 'PATTERN'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "knowledge_base"
            DROP COLUMN IF EXISTS "contentType"
        `);
  }
}
