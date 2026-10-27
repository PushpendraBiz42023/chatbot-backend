import { createGeminiEmbeddingProvider } from "./gemini-embedding.provider";
import { EmbeddingProvider } from "./embedding.types";

/**
 * Provider factory, mirroring ai.provider.ts's createAIProvider(). Only
 * Gemini exists today; a second embedding provider later means one new file
 * plus one branch here, with no changes required in knowledge.service.ts or
 * the chat retrieval step.
 */
function createEmbeddingProvider(): EmbeddingProvider {
  return createGeminiEmbeddingProvider();
}

export const embeddingProvider: EmbeddingProvider = createEmbeddingProvider();
