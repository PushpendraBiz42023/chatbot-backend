"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocumentSchema = exports.documentIdParamSchema = void 0;
const zod_1 = require("zod");
exports.documentIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Invalid document id"),
});
/**
 * multipart/form-data text fields arrive as strings on `req.body` (multer
 * populates non-file fields there); both are optional per the contract — no
 * separate "title" field is required in the upload form.
 */
exports.uploadDocumentSchema = zod_1.z.object({
    title: zod_1.z.string().trim().max(255, "Title must be at most 255 characters").optional(),
    description: zod_1.z.string().trim().max(500, "Description must be at most 500 characters").optional(),
});
//# sourceMappingURL=documents.validation.js.map