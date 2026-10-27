import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";
import { EmbeddingProvider } from "./embedding.types";

/**
 * Gemini implementation of EmbeddingProvider, using the same
 * @google/generative-ai SDK as GeminiProvider (ai.provider.ts). Uses
 * `embedContent` against `models/gemini-embedding-001` (verified working
 * against this project's API key — returns 3072-dim vectors), producing
 * plain number[] vectors stored via TypeORM's `simple-json` column and
 * compared with the pure cosine-similarity function in services/rag.
 */
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private readonly client: GoogleGenerativeAI;

  constructor(apiKey: string, private readonly modelName: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async embed(text: string): Promise<number[]> {
    const model = this.client.getGenerativeModel({ model: this.modelName });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }
}

export function createGeminiEmbeddingProvider(): EmbeddingProvider {
  return new GeminiEmbeddingProvider(env.gemini.apiKey, env.gemini.embeddingModel);
}
