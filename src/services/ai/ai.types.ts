export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}

export interface AIStreamChunk {
  text: string;
  /** Only present on the final chunk of a stream, when the provider reports it. */
  usage?: AIUsage;
}

export interface AIProvider {
  streamResponse(input: {
    message: string;
    history: ChatMessage[];
    signal?: AbortSignal;
    /** Overrides the provider's default system instruction for this call (e.g. to prepend RAG grounding). */
    systemInstruction?: string;
  }): AsyncIterable<AIStreamChunk>;

  /**
   * Feature 4 (document upload): sends inline image bytes to the model's
   * multimodal input and returns a plain-text description of everything
   * visually meaningful in the image, to be treated as "extracted content"
   * and chunked/embedded exactly like PDF/DOCX/TXT text. Not used by the
   * chat flow.
   */
  describeImage(input: { data: Buffer; mimeType: string }): Promise<string>;
}
