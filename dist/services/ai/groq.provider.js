"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGroqProvider = createGroqProvider;
const env_1 = require("../../config/env");
const openai_compatible_provider_1 = require("./openai-compatible.provider");
function createGroqProvider() {
    return new openai_compatible_provider_1.OpenAICompatibleProvider({
        providerName: "groq",
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: env_1.env.groq.apiKey,
        model: env_1.env.groq.model,
    });
}
//# sourceMappingURL=groq.provider.js.map