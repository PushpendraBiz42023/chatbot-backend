import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKnowledgeChunks1789711191459 implements MigrationInterface {
    name = 'AddKnowledgeChunks1789711191459'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`knowledge_chunks\` (\`id\` varchar(36) NOT NULL, \`entry_id\` varchar(36) NULL, \`document_id\` varchar(36) NULL, \`chunk_index\` int NOT NULL DEFAULT '0', \`content\` mediumtext NOT NULL, \`embedding\` text NOT NULL, \`metadata\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_97e5adab3fb52e1e7b1a5748e2\` (\`entry_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`knowledge_chunks\` ADD CONSTRAINT \`FK_97e5adab3fb52e1e7b1a5748e22\` FOREIGN KEY (\`entry_id\`) REFERENCES \`knowledge_entries\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`knowledge_chunks\` DROP FOREIGN KEY \`FK_97e5adab3fb52e1e7b1a5748e22\``);
        await queryRunner.query(`DROP INDEX \`IDX_97e5adab3fb52e1e7b1a5748e2\` ON \`knowledge_chunks\``);
        await queryRunner.query(`DROP TABLE \`knowledge_chunks\``);
    }

}
