import { embeddingProvider } from "../ai/embedding.provider";
import { KnowledgeChunkRepository } from "../../features/knowledge/knowledge-chunk.repository";
import { cosineSimilarity } from "./similarity";
import { RAG_CONTEXT_END, RAG_CONTEXT_START, RAG_MIN_SIMILARITY, RAG_TOP_K } from "./rag.constants";

export interface RagGroundingResult {
  /** Delimited context block to prepend to the system prompt, or null if nothing cleared the threshold. */
  contextBlock: string | null;
  /** Entries actually used for this turn (by id + title), for logging now and citations later. */
  usedEntries: Array<{ entryId: string; title: string }>;
}

/**
 * Embeds the user's message, scores it against every stored knowledge
 * chunk with plain cosine similarity, and — if any chunk clears
 * RAG_MIN_SIMILARITY — builds the exact delimited context block the chat
 * flow prepends to its system instruction. Returns no block at all when
 * nothing clears the threshold, leaving the existing plain system prompt
 * untouched (the spec's knowledge-found vs. not-found branch).
 *
 * Embedding/DB failures here must never break the chat turn itself: the
 * caller (chat.service.ts) treats this as best-effort and falls back to
 * ungrounded behavior on error.
 */
export async function retrieveGroundingContext(queryText: string): Promise<RagGroundingResult> {
  const queryEmbedding = await embeddingProvider.embed(queryText);
  const chunks = await KnowledgeChunkRepository.listAll();

  const scored = chunks
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .filter(({ score }) => score >= RAG_MIN_SIMILARITY)
    .sort((a, b) => b.score - a.score)
    .slice(0, RAG_TOP_K);

  if (scored.length === 0) {
    return { contextBlock: null, usedEntries: [] };
  }

  const sections = scored.map(({ chunk }) => {
    const title = chunk.metadata?.title ?? "Untitled";
    return `[Source: ${title}]\n${chunk.content}`;
  });

  const contextBlock = `${RAG_CONTEXT_START}\n${sections.join("\n\n")}\n${RAG_CONTEXT_END}`;

  const usedEntries = Array.from(
    new Map(
      scored
        .filter(({ chunk }) => chunk.entryId !== null)
        .map(({ chunk }) => [
          chunk.entryId as string,
          { entryId: chunk.entryId as string, title: chunk.metadata?.title ?? "Untitled" },
        ])
    ).values()
  );

  console.log(
    "[Chat] Grounded in:",
    scored.map(({ chunk, score }) => ({ entryId: chunk.entryId, title: chunk.metadata?.title, score }))
  );

  return { contextBlock, usedEntries };
}
