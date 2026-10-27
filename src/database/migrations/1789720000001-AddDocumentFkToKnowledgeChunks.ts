import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentFkToKnowledgeChunks1789720000001 implements MigrationInterface {
    name = 'AddDocumentFkToKnowledgeChunks1789720000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX \`IDX_knowledge_chunks_document_id\` ON \`knowledge_chunks\` (\`document_id\`)`);
        await queryRunner.query(`ALTER TABLE \`knowledge_chunks\` ADD CONSTRAINT \`FK_knowledge_chunks_document_id\` FOREIGN KEY (\`document_id\`) REFERENCES \`knowledge_documents\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`knowledge_chunks\` DROP FOREIGN KEY \`FK_knowledge_chunks_document_id\``);
        await queryRunner.query(`DROP INDEX \`IDX_knowledge_chunks_document_id\` ON \`knowledge_chunks\``);
    }

}
