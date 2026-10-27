import { embeddingProvider } from "../../services/ai/embedding.provider";
import { chunkText } from "../../services/rag/chunker";
import { KnowledgeChunkRepository } from "./knowledge-chunk.repository";
import { KnowledgeEntry, KnowledgeStatus } from "./knowledge-entry.entity";

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
export async function syncKnowledgeChunks(entry: KnowledgeEntry): Promise<void> {
  await KnowledgeChunkRepository.deleteByEntryId(entry.id);

  if (entry.status !== KnowledgeStatus.ACTIVE) {
    return;
  }

  try {
    const pieces = chunkText(entry.content);
    const embedded = await Promise.all(
      pieces.map(async (content, index) => ({
        entryId: entry.id,
        chunkIndex: index,
        content,
        embedding: await embeddingProvider.embed(content),
        metadata: { title: entry.title },
      }))
    );
    await KnowledgeChunkRepository.insertMany(embedded);
  } catch (error) {
    console.error(`[KnowledgeEmbeddingSync] Failed to embed entry ${entry.id}:`, error);
  }
}
