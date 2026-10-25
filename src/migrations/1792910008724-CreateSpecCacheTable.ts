import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSpecCacheTable1792910008724 implements MigrationInterface {
  name = 'CreateSpecCacheTable1792910008724';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "spec_cache" (
                "id" SERIAL PRIMARY KEY,
                "contentHash" VARCHAR(64) UNIQUE NOT NULL,
                "className" VARCHAR(255) NOT NULL,
                "specContent" TEXT NOT NULL,
                "score" INTEGER NOT NULL,
                "attempts" INTEGER NOT NULL,
                "modelProvider" VARCHAR(50) NOT NULL DEFAULT 'gemini',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

    await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_spec_cache_contentHash" 
            ON "spec_cache" ("contentHash")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE IF EXISTS "spec_cache"
        `);
  }
}
