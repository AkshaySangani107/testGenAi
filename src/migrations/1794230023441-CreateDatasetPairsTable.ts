import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDatasetPairsTable1794230023441 implements MigrationInterface {
  name = 'CreateDatasetPairsTable1794230023441';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dataset_pairs" (
        "id" SERIAL PRIMARY KEY,
        "sourceHash" VARCHAR(64) NOT NULL,
        "serviceName" VARCHAR(255) NOT NULL,
        "sourceCode" TEXT NOT NULL,
        "dependencyContract" TEXT,
        "systemPrompt" TEXT NOT NULL,
        "userPrompt" TEXT NOT NULL,
        "generatedSpec" TEXT NOT NULL,
        "evaluationScore" INTEGER NOT NULL,
        "passedOnAttempt" INTEGER NOT NULL DEFAULT 1,
        "methodCoverage" INTEGER NOT NULL DEFAULT 0,
        "branchCoverage" INTEGER NOT NULL DEFAULT 0,
        "split" VARCHAR(20) NOT NULL DEFAULT 'train',
        "modelProvider" VARCHAR(50) NOT NULL DEFAULT 'gemini',
        "isCurated" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_dataset_pairs_sourceHash" 
      ON "dataset_pairs" ("sourceHash")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_dataset_pairs_split" 
      ON "dataset_pairs" ("split")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_dataset_pairs_score" 
      ON "dataset_pairs" ("evaluationScore")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "dataset_pairs"
    `);
  }
}
