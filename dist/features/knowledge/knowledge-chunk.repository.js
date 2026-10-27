"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeChunkRepository = void 0;
const data_source_1 = require("../../database/data-source");
const knowledge_chunk_entity_1 = require("./knowledge-chunk.entity");
const knowledgeChunkRepo = () => data_source_1.AppDataSource.getRepository(knowledge_chunk_entity_1.KnowledgeChunk);
exports.KnowledgeChunkRepository = {
    /** All chunks, for the chat retrieval step's in-memory similarity scan (MVP scale, no pagination). */
    async listAll() {
        return knowledgeChunkRepo().find();
    },
    async insertMany(chunks) {
        if (chunks.length === 0) {
            return;
        }
        const entities = chunks.map((chunk) => knowledgeChunkRepo().create({
            entryId: chunk.entryId,
            documentId: null,
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            embedding: chunk.embedding,
            metadata: chunk.metadata,
        }));
        await knowledgeChunkRepo().save(entities);
    },
    /** Feature 4 (document upload): same insert shape as insertMany, but for document-linked chunks. */
    async insertManyForDocument(documentId, chunks) {
        if (chunks.length === 0) {
            return;
        }
        const entities = chunks.map((chunk) => knowledgeChunkRepo().create({
            entryId: null,
            documentId,
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            embedding: chunk.embedding,
            metadata: chunk.metadata,
        }));
        await knowledgeChunkRepo().save(entities);
    },
    async deleteByEntryId(entryId) {
        await knowledgeChunkRepo().delete({ entryId });
    },
    async deleteByDocumentId(documentId) {
        await knowledgeChunkRepo().delete({ documentId });
    },
};
//# sourceMappingURL=knowledge-chunk.repository.js.map