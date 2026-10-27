import { Request, Response, NextFunction } from "express";
import { AdminService } from "./admin.service";
import { sendSuccess } from "../../utils/apiResponse";
import { adminUserConversationParamSchema, adminUserIdParamSchema } from "./admin.validation";

export const AdminController = {
  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await AdminService.getStats();
      sendSuccess(res, 200, "OK", stats);
    } catch (error) {
      next(error);
    }
  },

  async listUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await AdminService.listUsers();
      sendSuccess(res, 200, "OK", { users });
    } catch (error) {
      next(error);
    }
  },

  async listUserConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = adminUserIdParamSchema.parse(req.params);
      const conversations = await AdminService.listUserConversations(userId);
      sendSuccess(res, 200, "OK", { conversations });
    } catch (error) {
      next(error);
    }
  },

  async getProviderStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providers = await AdminService.getProviderStatus();
      sendSuccess(res, 200, "OK", { providers });
    } catch (error) {
      next(error);
    }
  },

  async getProviderUsage(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usage = await AdminService.getProviderUsage();
      sendSuccess(res, 200, "OK", { usage });
    } catch (error) {
      next(error);
    }
  },

  async getUserConversationMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, conversationId } = adminUserConversationParamSchema.parse(req.params);
      const messages = await AdminService.getUserConversationMessages(
        req.userId as string,
        userId,
        conversationId
      );
      sendSuccess(res, 200, "OK", { messages });
    } catch (error) {
      next(error);
    }
  },
};
