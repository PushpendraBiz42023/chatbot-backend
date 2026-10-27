import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKnowledgeEntries1789709950000 implements MigrationInterface {
    name = 'AddKnowledgeEntries1789709950000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`knowledge_entries\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(200) NOT NULL, \`category\` varchar(100) NULL, \`tags\` varchar(500) NULL, \`content\` mediumtext NOT NULL, \`status\` enum ('active', 'disabled') NOT NULL DEFAULT 'active', \`created_by\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`knowledge_entries\` ADD CONSTRAINT \`FK_knowledge_entries_created_by\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`knowledge_entries\` DROP FOREIGN KEY \`FK_knowledge_entries_created_by\``);
        await queryRunner.query(`DROP TABLE \`knowledge_entries\``);
    }

}
