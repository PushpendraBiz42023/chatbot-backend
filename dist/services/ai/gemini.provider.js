"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
exports.createGeminiProvider = createGeminiProvider;
const generative_ai_1 = require("@google/generative-ai");
const env_1 = require("../../config/env");
const chat_constants_1 = require("../../features/chat/chat.constants");
/**
 * Prompt used for Feature 4's image documents: treated as an OCR/description
 * substitute so the model's multimodal input can serve as "extracted text"
 * for chunking/embedding, without building a custom OCR engine.
 */
const IMAGE_DESCRIPTION_PROMPT = "Describe all text, diagrams, and visually meaningful information in this image in plain text, " +
    "as if writing a knowledge-base article. Be factual and thorough. Do not add commentary about the " +
    "image itself, just its content.";
/**
 * Gemini implementation of AIProvider, using Google's official streaming SDK.
 * Any SDK/network failure is left to the caller (chat.service.ts) to catch and
 * translate into the documented AI_PROVIDER_ERROR SSE event — this class only
 * wraps the raw Gemini call and never swallows errors itself.
 */
class GeminiProvider {
    constructor(apiKey, modelName) {
        this.modelName = modelName;
        this.client = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    async *streamResponse(input) {
        const model = this.client.getGenerativeModel({
            model: this.modelName,
            systemInstruction: input.systemInstruction ?? chat_constants_1.CHAT_SYSTEM_PROMPT,
        });
        const chat = model.startChat({
            history: input.history.map((message) => ({
                role: message.role === "assistant" ? "model" : "user",
                parts: [{ text: message.content }],
            })),
        });
        const result = await chat.sendMessageStream(input.message, {
            signal: input.signal,
        });
        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
                yield { text };
            }
        }
        // Final usage metadata is only available once the full stream resolves.
        try {
            const finalResponse = await result.response;
            const usage = finalResponse.usageMetadata;
            if (usage) {
                yield {
                    text: "",
                    usage: {
                        inputTokens: usage.promptTokenCount ?? null,
                        outputTokens: usage.candidatesTokenCount ?? null,
                        totalTokens: usage.totalTokenCount ?? null,
                    },
                };
            }
        }
        catch {
            // Usage metadata is a nice-to-have; never fail the turn over it.
        }
    }
    async describeImage(input) {
        const model = this.client.getGenerativeModel({ model: this.modelName });
        const result = await model.generateContent([
            { inlineData: { data: input.data.toString("base64"), mimeType: input.mimeType } },
            { text: IMAGE_DESCRIPTION_PROMPT },
        ]);
        return result.response.text();
    }
}
exports.GeminiProvider = GeminiProvider;
function createGeminiProvider() {
    return new GeminiProvider(env_1.env.gemini.apiKey, env_1.env.gemini.model);
}
//# sourceMappingURL=gemini.provider.js.map