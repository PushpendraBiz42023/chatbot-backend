"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embeddingProvider = void 0;
const gemini_embedding_provider_1 = require("./gemini-embedding.provider");
/**
 * Provider factory, mirroring ai.provider.ts's createAIProvider(). Only
 * Gemini exists today; a second embedding provider later means one new file
 * plus one branch here, with no changes required in knowledge.service.ts or
 * the chat retrieval step.
 */
function createEmbeddingProvider() {
    return (0, gemini_embedding_provider_1.createGeminiEmbeddingProvider)();
}
exports.embeddingProvider = createEmbeddingProvider();
//# sourceMappingURL=embedding.provider.js.map