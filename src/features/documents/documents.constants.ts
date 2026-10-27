import { DocumentSourceType } from "./knowledge-document.entity";

/** Backend-authoritative allowlist — the frontend's `accept` attribute is a hint only. */
export const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg"] as const;

export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

/** Declared MIME types accepted per extension; multer's reported mimetype must match one of these. */
export const EXTENSION_MIME_TYPES: Record<AllowedExtension, readonly string[]> = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".txt": ["text/plain"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
};

export const EXTENSION_SOURCE_TYPE: Record<AllowedExtension, DocumentSourceType> = {
  ".pdf": DocumentSourceType.PDF,
  ".doc": DocumentSourceType.DOC,
  ".docx": DocumentSourceType.DOCX,
  ".txt": DocumentSourceType.TXT,
  ".png": DocumentSourceType.IMAGE,
  ".jpg": DocumentSourceType.IMAGE,
  ".jpeg": DocumentSourceType.IMAGE,
};

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
