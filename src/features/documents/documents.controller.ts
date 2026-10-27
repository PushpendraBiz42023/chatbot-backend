import { Request, Response, NextFunction } from "express";
import { DocumentsService } from "./documents.service";
import { sendSuccess } from "../../utils/apiResponse";
import { AppError } from "../../utils/AppError";
import { documentIdParamSchema, uploadDocumentSchema } from "./documents.validation";

export const DocumentsController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const documents = await DocumentsService.list();
      sendSuccess(res, 200, "OK", { documents });
    } catch (error) {
      next(error);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = documentIdParamSchema.parse(req.params);
      const document = await DocumentsService.getOne(id);
      sendSuccess(res, 200, "OK", { document });
    } catch (error) {
      next(error);
    }
  },

  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError(400, "FILE_REQUIRED", "A file is required.");
      }
      const input = uploadDocumentSchema.parse(req.body);
      const document = await DocumentsService.upload(req.userId as string, req.file, input);
      sendSuccess(res, 201, "Document uploaded", { document });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = documentIdParamSchema.parse(req.params);
      await DocumentsService.remove(id);
      sendSuccess(res, 200, "Document deleted");
    } catch (error) {
      next(error);
    }
  },

  async reprocess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = documentIdParamSchema.parse(req.params);
      const document = await DocumentsService.reprocess(id);
      sendSuccess(res, 200, "Document reprocessed", { document });
    } catch (error) {
      next(error);
    }
  },
};
