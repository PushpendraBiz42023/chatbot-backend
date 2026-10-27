"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingleDocument = void 0;
exports.handleUploadError = handleUploadError;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const apiResponse_1 = require("../../utils/apiResponse");
const documents_constants_1 = require("./documents.constants");
/**
 * Memory storage: the upload buffer is held only transiently in the request.
 * We write it to disk ourselves (documents.storage.ts) under a
 * server-generated `storageKey`, never under the client-supplied filename —
 * this is the security boundary the spec calls out, so multer never touches
 * the real filesystem path.
 */
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: documents_constants_1.MAX_FILE_SIZE_BYTES },
    fileFilter: (_req, file, callback) => {
        const extension = path_1.default.extname(file.originalname).toLowerCase();
        if (!documents_constants_1.ALLOWED_EXTENSIONS.includes(extension)) {
            callback(new multer_1.default.MulterError("LIMIT_UNEXPECTED_FILE", "file"));
            return;
        }
        callback(null, true);
    },
});
exports.uploadSingleDocument = upload.single("file");
/**
 * Translates multer's thrown errors into this API's `{success,code,message}`
 * envelope. Must be mounted immediately after `uploadSingleDocument` on the
 * upload route, before the shared `errorMiddleware` (which doesn't know
 * about MulterError).
 */
function handleUploadError(err, _req, res, next) {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            (0, apiResponse_1.sendError)(res, 413, "File exceeds the 15 MB size limit.", "FILE_TOO_LARGE");
            return;
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            (0, apiResponse_1.sendError)(res, 400, "This file type is not supported.", "FILE_TYPE_NOT_SUPPORTED");
            return;
        }
        (0, apiResponse_1.sendError)(res, 400, "Upload failed. Please try again.", "UPLOAD_ERROR");
        return;
    }
    next(err);
}
//# sourceMappingURL=documents.upload.middleware.js.map