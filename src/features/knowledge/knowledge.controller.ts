import { Request, Response, NextFunction } from "express";
import { KnowledgeService } from "./knowledge.service";
import { sendSuccess } from "../../utils/apiResponse";
import { knowledgeIdParamSchema, createKnowledgeSchema, updateKnowledgeSchema } from "./knowledge.validation";

export const KnowledgeController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entries = await KnowledgeService.list();
      sendSuccess(res, 200, "OK", { entries });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createKnowledgeSchema.parse(req.body);
      const entry = await KnowledgeService.create(req.userId as string, input);
      sendSuccess(res, 201, "Knowledge entry created", { entry });
    } catch (error) {
      next(error);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = knowledgeIdParamSchema.parse(req.params);
      const entry = await KnowledgeService.getOne(id);
      sendSuccess(res, 200, "OK", { entry });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = knowledgeIdParamSchema.parse(req.params);
      const input = updateKnowledgeSchema.parse(req.body);
      const entry = await KnowledgeService.update(id, input);
      sendSuccess(res, 200, "Knowledge entry updated", { entry });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = knowledgeIdParamSchema.parse(req.params);
      await KnowledgeService.remove(id);
      sendSuccess(res, 200, "Knowledge entry deleted");
    } catch (error) {
      next(error);
    }
  },
};
