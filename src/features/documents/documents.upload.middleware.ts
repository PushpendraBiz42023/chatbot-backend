import multer from "multer";
import { NextFunction, Request, Response } from "express";
import path from "path";
import { sendError } from "../../utils/apiResponse";
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES } from "./documents.constants";

/**
 * Memory storage: the upload buffer is held only transiently in the request.
 * We write it to disk ourselves (documents.storage.ts) under a
 * server-generated `storageKey`, never under the client-supplied filename —
 * this is the security boundary the spec calls out, so multer never touches
 * the real filesystem path.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
      callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "file"));
      return;
    }
    callback(null, true);
  },
});

export const uploadSingleDocument = upload.single("file");

/**
 * Translates multer's thrown errors into this API's `{success,code,message}`
 * envelope. Must be mounted immediately after `uploadSingleDocument` on the
 * upload route, before the shared `errorMiddleware` (which doesn't know
 * about MulterError).
 */
export function handleUploadError(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      sendError(res, 413, "File exceeds the 15 MB size limit.", "FILE_TOO_LARGE");
      return;
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      sendError(res, 400, "This file type is not supported.", "FILE_TYPE_NOT_SUPPORTED");
      return;
    }
    sendError(res, 400, "Upload failed. Please try again.", "UPLOAD_ERROR");
    return;
  }
  next(err);
}
