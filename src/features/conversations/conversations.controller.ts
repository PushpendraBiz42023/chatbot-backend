import { Request, Response, NextFunction } from "express";
import { ConversationsService } from "./conversations.service";
import { sendSuccess } from "../../utils/apiResponse";
import { conversationIdParamSchema, renameConversationSchema, switchProviderSchema } from "./conversations.validation";

export const ConversationsController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversations = await ConversationsService.list(req.userId as string);
      sendSuccess(res, 200, "OK", { conversations });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conversation = await ConversationsService.create(req.userId as string);
      sendSuccess(res, 201, "Conversation created", { conversation });
    } catch (error) {
      next(error);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = conversationIdParamSchema.parse(req.params);
      const conversation = await ConversationsService.getOne(id, req.userId as string);
      sendSuccess(res, 200, "OK", { conversation });
    } catch (error) {
      next(error);
    }
  },

  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = conversationIdParamSchema.parse(req.params);
      const messages = await ConversationsService.getMessages(id, req.userId as string);
      sendSuccess(res, 200, "OK", { messages });
    } catch (error) {
      next(error);
    }
  },

  async rename(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = conversationIdParamSchema.parse(req.params);
      const { title } = renameConversationSchema.parse(req.body);
      const conversation = await ConversationsService.rename(id, req.userId as string, title);
      sendSuccess(res, 200, "Conversation renamed", { conversation });
    } catch (error) {
      next(error);
    }
  },

  async switchProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = conversationIdParamSchema.parse(req.params);
      const { provider } = switchProviderSchema.parse(req.body);
      const conversation = await ConversationsService.switchProvider(id, req.userId as string, provider);
      sendSuccess(res, 200, "Provider switched", { conversation });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = conversationIdParamSchema.parse(req.params);
      await ConversationsService.remove(id, req.userId as string);
      sendSuccess(res, 200, "Conversation deleted");
    } catch (error) {
      next(error);
    }
  },
};
