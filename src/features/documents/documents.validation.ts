import { z } from "zod";

export const documentIdParamSchema = z.object({
  id: z.string().uuid("Invalid document id"),
});

/**
 * multipart/form-data text fields arrive as strings on `req.body` (multer
 * populates non-file fields there); both are optional per the contract — no
 * separate "title" field is required in the upload form.
 */
export const uploadDocumentSchema = z.object({
  title: z.string().trim().max(255, "Title must be at most 255 characters").optional(),
  description: z.string().trim().max(500, "Description must be at most 500 characters").optional(),
});

export type DocumentIdParam = z.infer<typeof documentIdParamSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
