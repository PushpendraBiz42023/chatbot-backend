"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDocumentPages = extractDocumentPages;
const pdf_parse_1 = require("pdf-parse");
const mammoth_1 = __importDefault(require("mammoth"));
const ai_provider_1 = require("../../../services/ai/ai.provider");
const AppError_1 = require("../../../utils/AppError");
const knowledge_document_entity_1 = require("../knowledge-document.entity");
async function extractPdf(buffer) {
    const parser = new pdf_parse_1.PDFParse({ data: buffer });
    try {
        const result = await parser.getText();
        return result.pages
            .map((page) => ({ text: page.text.trim(), page: page.num }))
            .filter((page) => page.text.length > 0);
    }
    finally {
        await parser.destroy();
    }
}
async function extractDocxLike(buffer, isLegacyDoc) {
    try {
        const { value } = await mammoth_1.default.extractRawText({ buffer });
        const text = value.trim();
        return text.length > 0 ? [{ text }] : [];
    }
    catch (error) {
        if (isLegacyDoc) {
            throw new AppError_1.AppError(422, "LEGACY_DOC_UNREADABLE", "This legacy .doc format could not be read; please re-save as .docx and re-upload.");
        }
        throw error;
    }
}
function extractTxt(buffer) {
    const text = buffer.toString("utf-8").trim();
    return text.length > 0 ? [{ text }] : [];
}
async function extractImage(buffer, mimeType) {
    const description = (await ai_provider_1.aiProvider.describeImage({ data: buffer, mimeType })).trim();
    return description.length > 0 ? [{ text: description }] : [];
}
/**
 * Dispatches to the format-specific extractor. Returns an array of
 * page-like blocks: for PDFs, one entry per source page (so the caller can
 * chunk each page separately and keep page numbers accurate per chunk); for
 * every other format, a single entry with no `page` number.
 */
async function extractDocumentPages(sourceType, buffer, mimeType) {
    switch (sourceType) {
        case knowledge_document_entity_1.DocumentSourceType.PDF:
            return extractPdf(buffer);
        case knowledge_document_entity_1.DocumentSourceType.DOCX:
            return extractDocxLike(buffer, false);
        case knowledge_document_entity_1.DocumentSourceType.DOC:
            return extractDocxLike(buffer, true);
        case knowledge_document_entity_1.DocumentSourceType.TXT:
            return extractTxt(buffer);
        case knowledge_document_entity_1.DocumentSourceType.IMAGE:
            return extractImage(buffer, mimeType);
    }
}
//# sourceMappingURL=text-extractor.js.map