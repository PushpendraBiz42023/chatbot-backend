"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const path_1 = __importDefault(require("path"));
const AppError_1 = require("../../utils/AppError");
const chunker_1 = require("../../services/rag/chunker");
const embedding_provider_1 = require("../../services/ai/embedding.provider");
const knowledge_chunk_repository_1 = require("../knowledge/knowledge-chunk.repository");
const documents_repository_1 = require("./documents.repository");
const knowledge_document_entity_1 = require("./knowledge-document.entity");
const documents_constants_1 = require("./documents.constants");
const documents_storage_1 = require("./documents.storage");
const text_extractor_1 = require("./extraction/text-extractor");
function toDto(document) {
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
async function getDocumentOrThrow(id) {
    const document = await documents_repository_1.DocumentsRepository.findById(id);
    if (!document) {
        throw new AppError_1.AppError(404, "NOT_FOUND", "Document not found");
    }
    return document;
}
/** Strips any path separators from a client-supplied filename before it's stored for DISPLAY only. */
function sanitizeDisplayFilename(originalFilename) {
    const base = path_1.default.basename(originalFilename.replace(/\\/g, "/"));
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
function validateUpload(file) {
    const extension = path_1.default.extname(file.originalname).toLowerCase();
    if (!documents_constants_1.ALLOWED_EXTENSIONS.includes(extension)) {
        throw new AppError_1.AppError(400, "FILE_TYPE_NOT_SUPPORTED", "This file type is not supported.");
    }
    if (file.size > documents_constants_1.MAX_FILE_SIZE_BYTES) {
        throw new AppError_1.AppError(413, "FILE_TOO_LARGE", "File exceeds the 15 MB size limit.");
    }
    const allowedMimeTypes = documents_constants_1.EXTENSION_MIME_TYPES[extension];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new AppError_1.AppError(400, "FILE_TYPE_NOT_SUPPORTED", "This file type is not supported.");
    }
    return { extension: extension };
}
/**
 * Runs extraction -> chunking -> embedding -> chunk insertion for an
 * already-stored, already-row-created document, and updates its status at
 * the end. Never throws: any failure here is caught and turned into
 * `status: "failed"` + a clean `processingError`, per the contract — the
 * caller (upload/reprocess) always gets a normal success response back.
 * Shared between initial upload and the reprocess endpoint.
 */
async function runProcessingPipeline(document) {
    try {
        const buffer = await (0, documents_storage_1.readDocumentFile)(document.storageKey);
        const pages = await (0, text_extractor_1.extractDocumentPages)(document.sourceType, buffer, document.mimeType);
        if (pages.length === 0) {
            throw new AppError_1.AppError(422, "NO_EXTRACTABLE_TEXT", "No readable text content was found in this file.");
        }
        const chunksToInsert = [];
        let chunkIndex = 0;
        for (const pageBlock of pages) {
            const pieces = (0, chunker_1.chunkText)(pageBlock.text);
            for (const content of pieces) {
                const metadata = pageBlock.page !== undefined ? { title: document.title, page: pageBlock.page } : { title: document.title };
                chunksToInsert.push({
                    chunkIndex: chunkIndex++,
                    content,
                    embedding: await embedding_provider_1.embeddingProvider.embed(content),
                    metadata,
                });
            }
        }
        if (chunksToInsert.length === 0) {
            throw new AppError_1.AppError(422, "NO_EXTRACTABLE_TEXT", "No readable text content was found in this file.");
        }
        await knowledge_chunk_repository_1.KnowledgeChunkRepository.insertManyForDocument(document.id, chunksToInsert);
        await documents_repository_1.DocumentsRepository.setStatus(document.id, knowledge_document_entity_1.DocumentStatus.READY, null);
    }
    catch (error) {
        const message = error instanceof AppError_1.AppError
            ? error.message
            : "Processing failed unexpectedly. Please try reprocessing this document.";
        console.error(`[DocumentsService] Failed to process document ${document.id}:`, error);
        await documents_repository_1.DocumentsRepository.setStatus(document.id, knowledge_document_entity_1.DocumentStatus.FAILED, message);
    }
    return getDocumentOrThrow(document.id);
}
exports.DocumentsService = {
    async list() {
        const documents = await documents_repository_1.DocumentsRepository.listAll();
        return documents.map(toDto);
    },
    async getOne(id) {
        const document = await getDocumentOrThrow(id);
        return toDto(document);
    },
    async upload(createdBy, file, input) {
        const { extension } = validateUpload(file);
        const storageKey = (0, documents_storage_1.generateStorageKey)(extension);
        await (0, documents_storage_1.saveDocumentFile)(storageKey, file.buffer);
        const displayFilename = sanitizeDisplayFilename(file.originalname);
        const title = input.title && input.title.length > 0 ? input.title : displayFilename;
        let document = await documents_repository_1.DocumentsRepository.create({
            title,
            description: input.description && input.description.length > 0 ? input.description : null,
            sourceType: documents_constants_1.EXTENSION_SOURCE_TYPE[extension],
            originalFilename: displayFilename,
            storageKey,
            mimeType: file.mimetype,
            fileSize: file.size,
            createdBy,
        });
        document = await runProcessingPipeline(document);
        return toDto(document);
    },
    async remove(id) {
        const document = await getDocumentOrThrow(id);
        await (0, documents_storage_1.deleteDocumentFile)(document.storageKey);
        // knowledge_chunks rows cascade-delete via the document_id FK.
        await documents_repository_1.DocumentsRepository.delete(id);
    },
    async reprocess(id) {
        let document = await getDocumentOrThrow(id);
        await knowledge_chunk_repository_1.KnowledgeChunkRepository.deleteByDocumentId(id);
        await documents_repository_1.DocumentsRepository.setStatus(id, knowledge_document_entity_1.DocumentStatus.PROCESSING, null);
        document = await getDocumentOrThrow(id);
        document = await runProcessingPipeline(document);
        return toDto(document);
    },
};
//# sourceMappingURL=documents.service.js.map