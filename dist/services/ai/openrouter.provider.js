"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpenRouterProvider = createOpenRouterProvider;
const env_1 = require("../../config/env");
const openai_compatible_provider_1 = require("./openai-compatible.provider");
function createOpenRouterProvider() {
    return new openai_compatible_provider_1.OpenAICompatibleProvider({
        providerName: "openrouter",
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: env_1.env.openrouter.apiKey,
        model: env_1.env.openrouter.model,
        // OpenRouter requests these per its docs; values are informational only,
        // not a real production domain since none exists for this app.
        extraHeaders: {
            "HTTP-Referer": "https://github.com/biz4group/chatbot",
            "X-Title": "Biz4Group Chatbot",
        },
    });
}
//# sourceMappingURL=openrouter.provider.js.map