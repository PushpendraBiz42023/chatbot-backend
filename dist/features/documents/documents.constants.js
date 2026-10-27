"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_FILE_SIZE_BYTES = exports.EXTENSION_SOURCE_TYPE = exports.EXTENSION_MIME_TYPES = exports.ALLOWED_EXTENSIONS = void 0;
const knowledge_document_entity_1 = require("./knowledge-document.entity");
/** Backend-authoritative allowlist — the frontend's `accept` attribute is a hint only. */
exports.ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg"];
/** Declared MIME types accepted per extension; multer's reported mimetype must match one of these. */
exports.EXTENSION_MIME_TYPES = {
    ".pdf": ["application/pdf"],
    ".doc": ["application/msword"],
    ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ".txt": ["text/plain"],
    ".png": ["image/png"],
    ".jpg": ["image/jpeg"],
    ".jpeg": ["image/jpeg"],
};
exports.EXTENSION_SOURCE_TYPE = {
    ".pdf": knowledge_document_entity_1.DocumentSourceType.PDF,
    ".doc": knowledge_document_entity_1.DocumentSourceType.DOC,
    ".docx": knowledge_document_entity_1.DocumentSourceType.DOCX,
    ".txt": knowledge_document_entity_1.DocumentSourceType.TXT,
    ".png": knowledge_document_entity_1.DocumentSourceType.IMAGE,
    ".jpg": knowledge_document_entity_1.DocumentSourceType.IMAGE,
    ".jpeg": knowledge_document_entity_1.DocumentSourceType.IMAGE,
};
exports.MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
//# sourceMappingURL=documents.constants.js.map