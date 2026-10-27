import { AppDataSource } from "../../database/data-source";
import { KnowledgeChunk, KnowledgeChunkMetadata } from "./knowledge-chunk.entity";

const knowledgeChunkRepo = () => AppDataSource.getRepository(KnowledgeChunk);

export const KnowledgeChunkRepository = {
  /** All chunks, for the chat retrieval step's in-memory similarity scan (MVP scale, no pagination). */
  async listAll(): Promise<KnowledgeChunk[]> {
    return knowledgeChunkRepo().find();
  },

  async insertMany(
    chunks: Array<{
      entryId: string;
      chunkIndex: number;
      content: string;
      embedding: number[];
      metadata: KnowledgeChunkMetadata;
    }>
  ): Promise<void> {
    if (chunks.length === 0) {
      return;
    }
    const entities = chunks.map((chunk) =>
      knowledgeChunkRepo().create({
        entryId: chunk.entryId,
        documentId: null,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embedding: chunk.embedding,
        metadata: chunk.metadata,
      })
    );
    await knowledgeChunkRepo().save(entities);
  },

  /** Feature 4 (document upload): same insert shape as insertMany, but for document-linked chunks. */
  async insertManyForDocument(
    documentId: string,
    chunks: Array<{
      chunkIndex: number;
      content: string;
      embedding: number[];
      metadata: KnowledgeChunkMetadata;
    }>
  ): Promise<void> {
    if (chunks.length === 0) {
      return;
    }
    const entities = chunks.map((chunk) =>
      knowledgeChunkRepo().create({
        entryId: null,
        documentId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        embedding: chunk.embedding,
        metadata: chunk.metadata,
      })
    );
    await knowledgeChunkRepo().save(entities);
  },

  async deleteByEntryId(entryId: string): Promise<void> {
    await knowledgeChunkRepo().delete({ entryId });
  },

  async deleteByDocumentId(documentId: string): Promise<void> {
    await knowledgeChunkRepo().delete({ documentId });
  },
};
