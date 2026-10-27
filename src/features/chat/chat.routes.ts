import { Router } from "express";
import { ChatController } from "./chat.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { chatRateLimiter, providerStatusRateLimiter } from "../../middleware/rateLimit.middleware";

const router = Router();

router.post("/", authMiddleware, chatRateLimiter, ChatController.chat);
router.get("/provider-status", authMiddleware, providerStatusRateLimiter, ChatController.getProviderStatus);

export { router as chatRoutes };
