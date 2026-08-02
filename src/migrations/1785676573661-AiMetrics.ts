import { MigrationInterface, QueryRunner } from "typeorm";

export class AiMetrics1785676573661 implements MigrationInterface {
    name = 'AiMetrics1785676573661'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ai_metrics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" character varying NOT NULL, "operation" character varying NOT NULL, "promptTokens" integer NOT NULL DEFAULT '0', "completionTokens" integer NOT NULL DEFAULT '0', "totalTokens" integer NOT NULL DEFAULT '0', "costEstimate" double precision NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee8884e61f111fe4309c024492d" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "ai_metrics"`);
    }

}
