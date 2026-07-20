import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateKnowledgeBase1784555484415 implements MigrationInterface {
    name = 'CreateKnowledgeBase1784555484415'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "knowledge_base" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "tags" text array NOT NULL DEFAULT '{}', "content" text NOT NULL, "embedding" text, "category" character varying(50) NOT NULL, "language" character varying(20) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_19d3f52f6da1501b7e235f1da5c" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "knowledge_base"`);
    }

}
