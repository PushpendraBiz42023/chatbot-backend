/**
 * Abstraction for turning text into a numeric embedding vector, mirroring the
 * AIProvider pattern in ai.types.ts. Only a Gemini implementation exists today
 * (see gemini-embedding.provider.ts); this interface keeps consumers (the
 * knowledge sync hook and the chat retrieval step) decoupled from the SDK.
 */
export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
}
