import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConversationProviderColumns1789730000000 implements MigrationInterface {
    name = 'AddConversationProviderColumns1789730000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`conversations\` ADD \`active_provider\` varchar(50) NOT NULL DEFAULT 'gemini'`);
        await queryRunner.query(`ALTER TABLE \`conversations\` ADD \`active_model\` varchar(100) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`conversations\` DROP COLUMN \`active_model\``);
        await queryRunner.query(`ALTER TABLE \`conversations\` DROP COLUMN \`active_provider\``);
    }

}
