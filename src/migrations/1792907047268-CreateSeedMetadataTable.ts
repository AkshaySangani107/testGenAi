import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSeedMetadataTable1792907047268 implements MigrationInterface {
  name = 'CreateSeedMetadataTable1792907047268';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "seed_metadata" (
                "id" SERIAL PRIMARY KEY,
                "key" VARCHAR(100) UNIQUE NOT NULL,
                "version" INTEGER NOT NULL,
                "description" TEXT,
                "appliedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE IF EXISTS "seed_metadata"
        `);
  }
}
