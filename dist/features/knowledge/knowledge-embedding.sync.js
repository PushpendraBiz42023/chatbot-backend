"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncKnowledgeChunks = syncKnowledgeChunks;
const embedding_provider_1 = require("../../services/ai/embedding.provider");
const chunker_1 = require("../../services/rag/chunker");
const knowledge_chunk_repository_1 = require("./knowledge-chunk.repository");
const knowledge_entry_entity_1 = require("./knowledge-entry.entity");
/**
 * Keeps `knowledge_chunks` in sync with a `knowledge_entries` row after a
 * create/update. Always drops any existing chunks for the entry first; if
 * the entry is active, re-chunks + re-embeds its current content and
 * inserts fresh rows. A disabled entry is simply left with zero chunks,
 * which makes it unretrievable without a separate "is active" check at
 * query time.
 *
 * Runs inline/awaited (no job queue) per the MVP scope. Embedding failures
 * are logged and swallowed here rather than thrown, so a slow/broken
 * embedding call never blocks the admin's create/update request — the
 * entry itself always saves; at worst it's left without chunks until the
 * next successful edit.
 */
async function syncKnowledgeChunks(entry) {
    await knowledge_chunk_repository_1.KnowledgeChunkRepository.deleteByEntryId(entry.id);
    if (entry.status !== knowledge_entry_entity_1.KnowledgeStatus.ACTIVE) {
        return;
    }
    try {
        const pieces = (0, chunker_1.chunkText)(entry.content);
        const embedded = await Promise.all(pieces.map(async (content, index) => ({
            entryId: entry.id,
            chunkIndex: index,
            content,
            embedding: await embedding_provider_1.embeddingProvider.embed(content),
            metadata: { title: entry.title },
        })));
        await knowledge_chunk_repository_1.KnowledgeChunkRepository.insertMany(embedded);
    }
    catch (error) {
        console.error(`[KnowledgeEmbeddingSync] Failed to embed entry ${entry.id}:`, error);
    }
}
//# sourceMappingURL=knowledge-embedding.sync.js.map