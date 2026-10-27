"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiProvider = void 0;
const gemini_provider_1 = require("./gemini.provider");
/**
 * Provider factory, mirroring the EmailProvider pattern in ../../utils/email.ts:
 * one interface, one factory, one instance created at module load. Only Gemini
 * exists today, so there is nothing to switch on yet — adding a second provider
 * later (Groq, OpenRouter, ...) means adding one file plus one branch here, with
 * no changes required in chat.service.ts or anywhere else that consumes AIProvider.
 */
function createAIProvider() {
    return (0, gemini_provider_1.createGeminiProvider)();
}
exports.aiProvider = createAIProvider();
//# sourceMappingURL=ai.provider.js.map