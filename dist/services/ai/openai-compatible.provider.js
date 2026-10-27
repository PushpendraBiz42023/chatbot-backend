"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAICompatibleProvider = void 0;
const provider_error_1 = require("./provider-error");
const retry_1 = require("./retry");
/**
 * Shared adapter for the OpenAI-compatible chat-completions REST APIs (Groq,
 * Mistral, OpenRouter): POST {baseURL}/chat/completions with `stream: true`,
 * parsing SSE-framed `data: {...}\n\n` chunks off `choices[0].delta.content`.
 * `describeImage` is intentionally unsupported — document image processing
 * stays Gemini-only regardless of `activeProvider`.
 */
class OpenAICompatibleProvider {
    constructor(config) {
        this.config = config;
    }
    async *streamResponse(input) {
        const messages = [];
        if (input.systemInstruction) {
            messages.push({ role: "system", content: input.systemInstruction });
        }
        for (const item of input.history) {
            messages.push({ role: item.role, content: item.content });
        }
        messages.push({ role: "user", content: input.message });
        const signal = (0, retry_1.withTimeoutSignal)(input.signal, this.config.timeoutMs);
        let response;
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
        }
        catch (error) {
            // Network-level failure (DNS, ECONNREFUSED, our own AbortSignal firing, ...).
            throw error;
        }
        if (!response.ok || !response.body) {
            const bodyText = await response.text().catch(() => null);
            const retryAfter = response.headers.get("retry-after");
            throw new provider_error_1.ProviderCallError(`${this.config.providerName} responded with HTTP ${response.status}`, response.status, retryAfter, bodyText);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalUsage;
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                let frameBreak = buffer.indexOf("\n\n");
                while (frameBreak !== -1) {
                    const frame = buffer.slice(0, frameBreak);
                    buffer = buffer.slice(frameBreak + 2);
                    frameBreak = buffer.indexOf("\n\n");
                    for (const line of frame.split("\n")) {
                        const trimmed = line.trim();
                        if (!trimmed.startsWith("data:"))
                            continue;
                        const dataStr = trimmed.slice("data:".length).trim();
                        if (dataStr === "[DONE]")
                            continue;
                        let parsed;
                        try {
                            parsed = JSON.parse(dataStr);
                        }
                        catch {
                            throw new provider_error_1.ProviderCallError(`${this.config.providerName} sent a malformed stream frame`, null, null, dataStr);
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
        }
        finally {
            reader.releaseLock();
        }
        if (finalUsage) {
            yield { text: "", usage: finalUsage };
        }
    }
    async describeImage() {
        throw new Error(`${this.config.providerName} does not support image description in this deployment.`);
    }
}
exports.OpenAICompatibleProvider = OpenAICompatibleProvider;
//# sourceMappingURL=openai-compatible.provider.js.map