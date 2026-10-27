import { createGeminiProvider } from "./gemini.provider";
import { AIProvider } from "./ai.types";

/**
 * Provider factory, mirroring the EmailProvider pattern in ../../utils/email.ts:
 * one interface, one factory, one instance created at module load. Only Gemini
 * exists today, so there is nothing to switch on yet — adding a second provider
 * later (Groq, OpenRouter, ...) means adding one file plus one branch here, with
 * no changes required in chat.service.ts or anywhere else that consumes AIProvider.
 */
function createAIProvider(): AIProvider {
  return createGeminiProvider();
}

export const aiProvider: AIProvider = createAIProvider();
