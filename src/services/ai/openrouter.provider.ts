import { env } from "../../config/env";
import { AIProvider } from "./ai.types";
import { OpenAICompatibleProvider } from "./openai-compatible.provider";

export function createOpenRouterProvider(): AIProvider {
  return new OpenAICompatibleProvider({
    providerName: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: env.openrouter.apiKey,
    model: env.openrouter.model,
    // OpenRouter requests these per its docs; values are informational only,
    // not a real production domain since none exists for this app.
    extraHeaders: {
      "HTTP-Referer": "https://github.com/biz4group/chatbot",
      "X-Title": "Biz4Group Chatbot",
    },
  });
}
