import { env } from "../../config/env";
import { AIProvider } from "./ai.types";
import { OpenAICompatibleProvider } from "./openai-compatible.provider";

export function createGroqProvider(): AIProvider {
  return new OpenAICompatibleProvider({
    providerName: "groq",
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: env.groq.apiKey,
    model: env.groq.model,
  });
}
