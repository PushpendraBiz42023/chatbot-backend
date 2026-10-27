import path from "path";
import { AppError } from "../../utils/AppError";
import { chunkText } from "../../services/rag/chunker";
import { embeddingProvider } from "../../services/ai/embedding.provider";
import { KnowledgeChunkRepository } from "../knowledge/knowledge-chunk.repository";
import { KnowledgeChunkMetadata } from "../knowledge/knowledge-chunk.entity";
import { DocumentsRepository } from "./documents.repository";
import { DocumentStatus, KnowledgeDocument } from "./knowledge-document.entity";
import { KnowledgeDocumentDto } from "./documents.types";
import { UploadDocumentInput } from "./documents.validation";
import {
  ALLOWED_EXTENSIONS,
  AllowedExtension,
  EXTENSION_MIME_TYPES,
  EXTENSION_SOURCE_TYPE,
  MAX_FILE_SIZE_BYTES,
} from "./documents.constants";
import { deleteDocumentFile, generateStorageKey, readDocumentFile, saveDocumentFile } from "./documents.storage";
import { extractDocumentPages } from "./extraction/text-extractor";

function toDto(document: KnowledgeDocument): KnowledgeDocumentDto {
  return {
    id: document.id,
    title: document.title,
    description: document.description,
    sourceType: document.sourceType,
    originalFilename: document.originalFilename,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    status: document.status,
    processingError: document.processingError,
    createdBy: document.createdBy,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

async function getDocumentOrThrow(id: string): Promise<KnowledgeDocument> {
  const document = await DocumentsRepository.findById(id);
  if (!document) {
    throw new AppError(404, "NOT_FOUND", "Document not found");
  }
  return document;
}

/** Strips any path separators from a client-supplied filename before it's stored for DISPLAY only. */
function sanitizeDisplayFilename(originalFilename: string): string {
  const base = path.basename(originalFilename.replace(/\\/g, "/"));
  return base.length > 0 ? base : "upload";
}

/**
 * Validates the uploaded file against the extension allowlist, the declared
 * MIME type, and the size limit. Runs BEFORE anything is saved to disk or
 * the database, per the contract — a validation failure is a real 4xx, not
 * a "failed" document row. `multer`'s fileFilter/limits already reject some
 * of this earlier, but the extension<->MIME cross-check has to happen here,
 * after the file is fully in memory.
 */
function validateUpload(file: Express.Multer.File): { extension: AllowedExtension } {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
    throw new AppError(400, "FILE_TYPE_NOT_SUPPORTED", "This file type is not supported.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new AppError(413, "FILE_TOO_LARGE", "File exceeds the 15 MB size limit.");
  }
  const allowedMimeTypes = EXTENSION_MIME_TYPES[extension as AllowedExtension];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new AppError(400, "FILE_TYPE_NOT_SUPPORTED", "This file type is not supported.");
  }
  return { extension: extension as AllowedExtension };
}

/**
 * Runs extraction -> chunking -> embedding -> chunk insertion for an
 * already-stored, already-row-created document, and updates its status at
 * the end. Never throws: any failure here is caught and turned into
 * `status: "failed"` + a clean `processingError`, per the contract — the
 * caller (upload/reprocess) always gets a normal success response back.
 * Shared between initial upload and the reprocess endpoint.
 */
async function runProcessingPipeline(document: KnowledgeDocument): Promise<KnowledgeDocument> {
  try {
    const buffer = await readDocumentFile(document.storageKey);
    const pages = await extractDocumentPages(document.sourceType, buffer, document.mimeType);

    if (pages.length === 0) {
      throw new AppError(422, "NO_EXTRACTABLE_TEXT", "No readable text content was found in this file.");
    }

    const chunksToInsert: Array<{
      chunkIndex: number;
      content: string;
      embedding: number[];
      metadata: KnowledgeChunkMetadata;
    }> = [];

    let chunkIndex = 0;
    for (const pageBlock of pages) {
      const pieces = chunkText(pageBlock.text);
      for (const content of pieces) {
        const metadata: KnowledgeChunkMetadata =
          pageBlock.page !== undefined ? { title: document.title, page: pageBlock.page } : { title: document.title };
        chunksToInsert.push({
          chunkIndex: chunkIndex++,
          content,
          embedding: await embeddingProvider.embed(content),
          metadata,
        });
      }
    }

    if (chunksToInsert.length === 0) {
      throw new AppError(422, "NO_EXTRACTABLE_TEXT", "No readable text content was found in this file.");
    }

    await KnowledgeChunkRepository.insertManyForDocument(document.id, chunksToInsert);
    await DocumentsRepository.setStatus(document.id, DocumentStatus.READY, null);
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : "Processing failed unexpectedly. Please try reprocessing this document.";
    console.error(`[DocumentsService] Failed to process document ${document.id}:`, error);
    await DocumentsRepository.setStatus(document.id, DocumentStatus.FAILED, message);
  }

  return getDocumentOrThrow(document.id);
}

export const DocumentsService = {
  async list(): Promise<KnowledgeDocumentDto[]> {
    const documents = await DocumentsRepository.listAll();
    return documents.map(toDto);
  },

  async getOne(id: string): Promise<KnowledgeDocumentDto> {
    const document = await getDocumentOrThrow(id);
    return toDto(document);
  },

  async upload(
    createdBy: string,
    file: Express.Multer.File,
    input: UploadDocumentInput
  ): Promise<KnowledgeDocumentDto> {
    const { extension } = validateUpload(file);
    const storageKey = generateStorageKey(extension);

    await saveDocumentFile(storageKey, file.buffer);

    const displayFilename = sanitizeDisplayFilename(file.originalname);
    const title = input.title && input.title.length > 0 ? input.title : displayFilename;

    let document = await DocumentsRepository.create({
      title,
      description: input.description && input.description.length > 0 ? input.description : null,
      sourceType: EXTENSION_SOURCE_TYPE[extension],
      originalFilename: displayFilename,
      storageKey,
      mimeType: file.mimetype,
      fileSize: file.size,
      createdBy,
    });

    document = await runProcessingPipeline(document);
    return toDto(document);
  },

  async remove(id: string): Promise<void> {
    const document = await getDocumentOrThrow(id);
    await deleteDocumentFile(document.storageKey);
    // knowledge_chunks rows cascade-delete via the document_id FK.
    await DocumentsRepository.delete(id);
  },

  async reprocess(id: string): Promise<KnowledgeDocumentDto> {
    let document = await getDocumentOrThrow(id);
    await KnowledgeChunkRepository.deleteByDocumentId(id);
    await DocumentsRepository.setStatus(id, DocumentStatus.PROCESSING, null);
    document = await getDocumentOrThrow(id);
    document = await runProcessingPipeline(document);
    return toDto(document);
  },
};
