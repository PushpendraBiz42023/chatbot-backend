import { AIProvider, AIStreamChunk, AIUsage, ChatMessage } from "./ai.types";
import { ProviderCallError } from "./provider-error";
import { withTimeoutSignal } from "./retry";

export interface OpenAICompatibleConfig {
  providerName: string;
  baseURL: string;
  apiKey: string;
  model: string;
  /** Extra headers some providers require (e.g. OpenRouter's HTTP-Referer/X-Title). */
  extraHeaders?: Record<string, string>;
  timeoutMs?: number;
}

interface OpenAIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIStreamChoiceDelta {
  content?: string;
}

interface OpenAIStreamChunkPayload {
  choices?: Array<{ delta?: OpenAIStreamChoiceDelta }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * Shared adapter for the OpenAI-compatible chat-completions REST APIs (Groq,
 * Mistral, OpenRouter): POST {baseURL}/chat/completions with `stream: true`,
 * parsing SSE-framed `data: {...}\n\n` chunks off `choices[0].delta.content`.
 * `describeImage` is intentionally unsupported — document image processing
 * stays Gemini-only regardless of `activeProvider`.
 */
export class OpenAICompatibleProvider implements AIProvider {
  constructor(private readonly config: OpenAICompatibleConfig) {}

  async *streamResponse(input: {
    message: string;
    history: ChatMessage[];
    signal?: AbortSignal;
    systemInstruction?: string;
  }): AsyncIterable<AIStreamChunk> {
    const messages: OpenAIChatMessage[] = [];
    if (input.systemInstruction) {
      messages.push({ role: "system", content: input.systemInstruction });
    }
    for (const item of input.history) {
      messages.push({ role: item.role, content: item.content });
    }
    messages.push({ role: "user", content: input.message });

    const signal = withTimeoutSignal(input.signal, this.config.timeoutMs);

    let response: Response;
    try {
      response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          ...this.config.extraHeaders,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          stream: true,
          stream_options: { include_usage: true },
        }),
        signal,
      });
    } catch (error) {
      // Network-level failure (DNS, ECONNREFUSED, our own AbortSignal firing, ...).
      throw error;
    }

    if (!response.ok || !response.body) {
      const bodyText = await response.text().catch(() => null);
      const retryAfter = response.headers.get("retry-after");
      throw new ProviderCallError(
        `${this.config.providerName} responded with HTTP ${response.status}`,
        response.status,
        retryAfter,
        bodyText
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalUsage: AIUsage | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let frameBreak = buffer.indexOf("\n\n");
        while (frameBreak !== -1) {
          const frame = buffer.slice(0, frameBreak);
          buffer = buffer.slice(frameBreak + 2);
          frameBreak = buffer.indexOf("\n\n");

          for (const line of frame.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const dataStr = trimmed.slice("data:".length).trim();
            if (dataStr === "[DONE]") continue;

            let parsed: OpenAIStreamChunkPayload;
            try {
              parsed = JSON.parse(dataStr) as OpenAIStreamChunkPayload;
            } catch {
              throw new ProviderCallError(
                `${this.config.providerName} sent a malformed stream frame`,
                null,
                null,
                dataStr
              );
            }

            const text = parsed.choices?.[0]?.delta?.content;
            if (parsed.usage) {
              finalUsage = {
                inputTokens: parsed.usage.prompt_tokens ?? null,
                outputTokens: parsed.usage.completion_tokens ?? null,
                totalTokens: parsed.usage.total_tokens ?? null,
              };
            }
            if (text) {
              yield { text };
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (finalUsage) {
      yield { text: "", usage: finalUsage };
    }
  }

  async describeImage(): Promise<string> {
    throw new Error(`${this.config.providerName} does not support image description in this deployment.`);
  }
}
