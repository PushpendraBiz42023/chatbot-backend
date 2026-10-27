"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveGroundingContext = retrieveGroundingContext;
const embedding_provider_1 = require("../ai/embedding.provider");
const knowledge_chunk_repository_1 = require("../../features/knowledge/knowledge-chunk.repository");
const similarity_1 = require("./similarity");
const rag_constants_1 = require("./rag.constants");
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
async function retrieveGroundingContext(queryText) {
    const queryEmbedding = await embedding_provider_1.embeddingProvider.embed(queryText);
    const chunks = await knowledge_chunk_repository_1.KnowledgeChunkRepository.listAll();
    const scored = chunks
        .map((chunk) => ({ chunk, score: (0, similarity_1.cosineSimilarity)(queryEmbedding, chunk.embedding) }))
        .filter(({ score }) => score >= rag_constants_1.RAG_MIN_SIMILARITY)
        .sort((a, b) => b.score - a.score)
        .slice(0, rag_constants_1.RAG_TOP_K);
    if (scored.length === 0) {
        return { contextBlock: null, usedEntries: [] };
    }
    const sections = scored.map(({ chunk }) => {
        const title = chunk.metadata?.title ?? "Untitled";
        return `[Source: ${title}]\n${chunk.content}`;
    });
    const contextBlock = `${rag_constants_1.RAG_CONTEXT_START}\n${sections.join("\n\n")}\n${rag_constants_1.RAG_CONTEXT_END}`;
    const usedEntries = Array.from(new Map(scored
        .filter(({ chunk }) => chunk.entryId !== null)
        .map(({ chunk }) => [
        chunk.entryId,
        { entryId: chunk.entryId, title: chunk.metadata?.title ?? "Untitled" },
    ])).values());
    console.log("[Chat] Grounded in:", scored.map(({ chunk, score }) => ({ entryId: chunk.entryId, title: chunk.metadata?.title, score })));
    return { contextBlock, usedEntries };
}
//# sourceMappingURL=retrieval.js.map