/** Chunks under this size are left whole; longer paragraphs are split further. */
const MAX_CHUNK_LENGTH = 1500;

/**
 * Simple paragraph/length-based splitter for manual knowledge-entry text
 * (this pass only — Feature 4's document pipeline will need smarter,
 * format-aware splitting for PDFs/DOCX/etc., this is intentionally minimal).
 *
 * Rule: split on blank-line paragraph boundaries; if a paragraph still
 * exceeds MAX_CHUNK_LENGTH, further split it on sentence boundaries into
 * pieces under that size. Most manual entries are short enough to produce a
 * single chunk.
 */
export function chunkText(content: string): string[] {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return [];
  }

  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  const chunks: string[] = [];
  for (const paragraph of paragraphs) {
    if (paragraph.length <= MAX_CHUNK_LENGTH) {
      chunks.push(paragraph);
      continue;
    }
    chunks.push(...splitBySentence(paragraph));
  }

  return chunks;
}

/** Splits an over-long paragraph on sentence boundaries, packing sentences into <= MAX_CHUNK_LENGTH pieces. */
function splitBySentence(paragraph: string): string[] {
  const sentences = paragraph.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) ?? [paragraph];

  const pieces: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const candidate = current.length > 0 ? `${current} ${sentence.trim()}` : sentence.trim();
    if (candidate.length > MAX_CHUNK_LENGTH && current.length > 0) {
      pieces.push(current);
      current = sentence.trim();
    } else {
      current = candidate;
    }
  }

  if (current.length > 0) {
    pieces.push(current);
  }

  return pieces;
}
