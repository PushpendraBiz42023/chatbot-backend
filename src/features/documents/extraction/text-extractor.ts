import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { aiProvider } from "../../../services/ai/ai.provider";
import { AppError } from "../../../utils/AppError";
import { DocumentSourceType } from "../knowledge-document.entity";

/** One page (or page-less block, for formats with no pagination) of extracted text. */
export interface ExtractedPage {
  text: string;
  /** 1-based source page number; only ever set for PDFs. */
  page?: number;
}

async function extractPdf(buffer: Buffer): Promise<ExtractedPage[]> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.pages
      .map((page) => ({ text: page.text.trim(), page: page.num }))
      .filter((page) => page.text.length > 0);
  } finally {
    await parser.destroy();
  }
}

async function extractDocxLike(buffer: Buffer, isLegacyDoc: boolean): Promise<ExtractedPage[]> {
  try {
    const { value } = await mammoth.extractRawText({ buffer });
    const text = value.trim();
    return text.length > 0 ? [{ text }] : [];
  } catch (error) {
    if (isLegacyDoc) {
      throw new AppError(
        422,
        "LEGACY_DOC_UNREADABLE",
        "This legacy .doc format could not be read; please re-save as .docx and re-upload."
      );
    }
    throw error;
  }
}

function extractTxt(buffer: Buffer): ExtractedPage[] {
  const text = buffer.toString("utf-8").trim();
  return text.length > 0 ? [{ text }] : [];
}

async function extractImage(buffer: Buffer, mimeType: string): Promise<ExtractedPage[]> {
  const description = (await aiProvider.describeImage({ data: buffer, mimeType })).trim();
  return description.length > 0 ? [{ text: description }] : [];
}

/**
 * Dispatches to the format-specific extractor. Returns an array of
 * page-like blocks: for PDFs, one entry per source page (so the caller can
 * chunk each page separately and keep page numbers accurate per chunk); for
 * every other format, a single entry with no `page` number.
 */
export async function extractDocumentPages(
  sourceType: DocumentSourceType,
  buffer: Buffer,
  mimeType: string
): Promise<ExtractedPage[]> {
  switch (sourceType) {
    case DocumentSourceType.PDF:
      return extractPdf(buffer);
    case DocumentSourceType.DOCX:
      return extractDocxLike(buffer, false);
    case DocumentSourceType.DOC:
      return extractDocxLike(buffer, true);
    case DocumentSourceType.TXT:
      return extractTxt(buffer);
    case DocumentSourceType.IMAGE:
      return extractImage(buffer, mimeType);
  }
}
