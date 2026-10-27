"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCUMENTS_STORAGE_DIR = void 0;
exports.generateStorageKey = generateStorageKey;
exports.resolveStoragePath = resolveStoragePath;
exports.saveDocumentFile = saveDocumentFile;
exports.readDocumentFile = readDocumentFile;
exports.deleteDocumentFile = deleteDocumentFile;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
/**
 * `backend/storage/documents/` — resolved once, relative to this file, so it
 * works the same whether running via tsx (src) or the compiled dist build.
 */
exports.DOCUMENTS_STORAGE_DIR = path_1.default.resolve(__dirname, "../../../storage/documents");
async function ensureStorageDir() {
    await fs_1.promises.mkdir(exports.DOCUMENTS_STORAGE_DIR, { recursive: true });
}
/**
 * Generates the on-disk filename for a newly uploaded document. This is the
 * ONLY thing ever used to build a filesystem path for a document's file —
 * `originalFilename` (client-supplied) must never be used here, which is the
 * path-traversal defense the spec calls out. `crypto.randomUUID()` plus the
 * already-validated extension keeps the name unguessable and collision-free.
 */
function generateStorageKey(extension) {
    return `${(0, crypto_1.randomUUID)()}${extension}`;
}
/** Resolves a storage key (never client input) to its absolute on-disk path. */
function resolveStoragePath(storageKey) {
    return path_1.default.join(exports.DOCUMENTS_STORAGE_DIR, storageKey);
}
async function saveDocumentFile(storageKey, buffer) {
    await ensureStorageDir();
    await fs_1.promises.writeFile(resolveStoragePath(storageKey), buffer);
}
async function readDocumentFile(storageKey) {
    return fs_1.promises.readFile(resolveStoragePath(storageKey));
}
async function deleteDocumentFile(storageKey) {
    try {
        await fs_1.promises.unlink(resolveStoragePath(storageKey));
    }
    catch (error) {
        // Missing file on disk shouldn't block the DB row from being deleted.
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
}
//# sourceMappingURL=documents.storage.js.map