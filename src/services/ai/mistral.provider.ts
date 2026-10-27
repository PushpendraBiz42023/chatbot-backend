import { env } from "../../config/env";
import { AIProvider } from "./ai.types";
import { OpenAICompatibleProvider } from "./openai-compatible.provider";

export function createMistralProvider(): AIProvider {
  return new OpenAICompatibleProvider({
    providerName: "mistral",
    baseURL: "https://api.mistral.ai/v1",
    apiKey: env.mistral.apiKey,
    model: env.mistral.model,
  });
}
