"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiEmbeddingProvider = void 0;
exports.createGeminiEmbeddingProvider = createGeminiEmbeddingProvider;
const generative_ai_1 = require("@google/generative-ai");
const env_1 = require("../../config/env");
/**
 * Gemini implementation of EmbeddingProvider, using the same
 * @google/generative-ai SDK as GeminiProvider (ai.provider.ts). Uses
 * `embedContent` against `models/gemini-embedding-001` (verified working
 * against this project's API key — returns 3072-dim vectors), producing
 * plain number[] vectors stored via TypeORM's `simple-json` column and
 * compared with the pure cosine-similarity function in services/rag.
 */
class GeminiEmbeddingProvider {
    constructor(apiKey, modelName) {
        this.modelName = modelName;
        this.client = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    async embed(text) {
        const model = this.client.getGenerativeModel({ model: this.modelName });
        const result = await model.embedContent(text);
        return result.embedding.values;
    }
}
exports.GeminiEmbeddingProvider = GeminiEmbeddingProvider;
function createGeminiEmbeddingProvider() {
    return new GeminiEmbeddingProvider(env_1.env.gemini.apiKey, env_1.env.gemini.embeddingModel);
}
//# sourceMappingURL=gemini-embedding.provider.js.map