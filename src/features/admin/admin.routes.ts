import { Router } from "express";
import { AdminController } from "./admin.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/admin.middleware";

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get("/stats", AdminController.getStats);
router.get("/providers/status", AdminController.getProviderStatus);
router.get("/providers/usage", AdminController.getProviderUsage);
router.get("/users", AdminController.listUsers);
router.get("/users/:userId/conversations", AdminController.listUserConversations);
router.get("/users/:userId/conversations/:conversationId/messages", AdminController.getUserConversationMessages);

export { router as adminRoutes };
