"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMistralProvider = createMistralProvider;
const env_1 = require("../../config/env");
const openai_compatible_provider_1 = require("./openai-compatible.provider");
function createMistralProvider() {
    return new openai_compatible_provider_1.OpenAICompatibleProvider({
        providerName: "mistral",
        baseURL: "https://api.mistral.ai/v1",
        apiKey: env_1.env.mistral.apiKey,
        model: env_1.env.mistral.model,
    });
}
//# sourceMappingURL=mistral.provider.js.map