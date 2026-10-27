import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAiProviderUsage1789730000001 implements MigrationInterface {
    name = 'AddAiProviderUsage1789730000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`ai_provider_usage\` (\`id\` varchar(36) NOT NULL, \`provider\` varchar(50) NOT NULL, \`model\` varchar(100) NOT NULL, \`conversation_id\` varchar(36) NULL, \`user_id\` varchar(36) NULL, \`status\` enum ('success', 'error') NOT NULL, \`error_type\` varchar(50) NULL, \`input_tokens\` int NULL, \`output_tokens\` int NULL, \`total_tokens\` int NULL, \`latency_ms\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_ai_provider_usage_provider_model\` (\`provider\`, \`model\`), INDEX \`IDX_ai_provider_usage_created_at\` (\`created_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`ai_provider_usage\``);
    }

}
