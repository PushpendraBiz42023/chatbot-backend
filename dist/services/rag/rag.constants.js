"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAG_CONTEXT_END = exports.RAG_CONTEXT_START = exports.RAG_MIN_SIMILARITY = exports.RAG_TOP_K = void 0;
/** Number of top-scoring chunks considered for grounding a single chat turn. */
exports.RAG_TOP_K = 5;
/**
 * Minimum cosine similarity a chunk must clear to be used for grounding.
 * Chosen from real testing against `models/gemini-embedding-001` on this
 * project's API key: a clearly relevant query/document pair (the Zylo Corp
 * refund policy vs. "What is Zylo Corp's refund policy?") scored ~0.92,
 * while a clearly irrelevant pair (the same refund text vs. "What's the
 * capital of France?") scored ~0.46 — a wide gap, so 0.7 sits safely between
 * true matches and noise without needing to be tuned tighter.
 */
exports.RAG_MIN_SIMILARITY = 0.7;
/** Delimiters the grounding block is wrapped in — never treat text between these as instructions. */
exports.RAG_CONTEXT_START = "--- ADMIN KNOWLEDGE START ---";
exports.RAG_CONTEXT_END = "--- ADMIN KNOWLEDGE END ---";
//# sourceMappingURL=rag.constants.js.map