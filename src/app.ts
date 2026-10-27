import "reflect-metadata";
import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { authRoutes } from "./features/auth/auth.routes";
import { chatRoutes } from "./features/chat/chat.routes";
import { conversationsRoutes } from "./features/conversations/conversations.routes";
import { knowledgeRoutes } from "./features/knowledge/knowledge.routes";
import { documentsRoutes } from "./features/documents/documents.routes";
import { adminRoutes } from "./features/admin/admin.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import { notFoundMiddleware } from "./middleware/notFound.middleware";
import { sendError } from "./utils/apiResponse";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsAllowedOrigins,
      credentials: true,
    })
  );
  // Chat bodies (message up to 8000 chars + up to 40 history turns) can exceed
  // the 10kb default used everywhere else, so give /api/chat its own, larger
  // JSON parser. body-parser skips re-parsing once req._body is set, so the
  // general 10kb parser below is a no-op for requests already parsed here.
  app.use("/api/chat", express.json({ limit: "1mb" }));
  app.use(express.json({ limit: "10kb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.status(200).json({ success: true, message: "OK" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/conversations", conversationsRoutes);
  app.use("/api/admin/knowledge", knowledgeRoutes);
  app.use("/api/admin/documents", documentsRoutes);
  app.use("/api/admin", adminRoutes);

  // Body-parser throws a PayloadTooLargeError (not an AppError/ZodError) when the
  // 1mb chat body limit above is exceeded; map that specifically to the documented
  // 413 AI_CONTEXT_TOO_LARGE before it would otherwise fall through to a generic 500.
  app.use("/api/chat", (err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && typeof err === "object" && "type" in err && (err as { type?: string }).type === "entity.too.large") {
      sendError(res, 413, "Your message and conversation history are too large. Please shorten them.", "AI_CONTEXT_TOO_LARGE");
      return;
    }
    next(err);
  });

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
