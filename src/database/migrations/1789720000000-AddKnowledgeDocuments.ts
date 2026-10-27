import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKnowledgeDocuments1789720000000 implements MigrationInterface {
    name = 'AddKnowledgeDocuments1789720000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`knowledge_documents\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` varchar(500) NULL, \`source_type\` enum ('pdf', 'doc', 'docx', 'txt', 'image') NOT NULL, \`original_filename\` varchar(255) NOT NULL, \`storage_key\` varchar(255) NOT NULL, \`mime_type\` varchar(100) NOT NULL, \`file_size\` int NOT NULL, \`status\` enum ('processing', 'ready', 'failed', 'disabled') NOT NULL DEFAULT 'processing', \`processing_error\` text NULL, \`created_by\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`knowledge_documents\` ADD CONSTRAINT \`FK_knowledge_documents_created_by\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`knowledge_documents\` DROP FOREIGN KEY \`FK_knowledge_documents_created_by\``);
        await queryRunner.query(`DROP TABLE \`knowledge_documents\``);
    }

}
