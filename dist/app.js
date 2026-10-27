"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const auth_routes_1 = require("./features/auth/auth.routes");
const chat_routes_1 = require("./features/chat/chat.routes");
const conversations_routes_1 = require("./features/conversations/conversations.routes");
const knowledge_routes_1 = require("./features/knowledge/knowledge.routes");
const documents_routes_1 = require("./features/documents/documents.routes");
const admin_routes_1 = require("./features/admin/admin.routes");
const error_middleware_1 = require("./middleware/error.middleware");
const notFound_middleware_1 = require("./middleware/notFound.middleware");
const apiResponse_1 = require("./utils/apiResponse");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: env_1.env.corsAllowedOrigins,
        credentials: true,
    }));
    // Chat bodies (message up to 8000 chars + up to 40 history turns) can exceed
    // the 10kb default used everywhere else, so give /api/chat its own, larger
    // JSON parser. body-parser skips re-parsing once req._body is set, so the
    // general 10kb parser below is a no-op for requests already parsed here.
    app.use("/api/chat", express_1.default.json({ limit: "1mb" }));
    app.use(express_1.default.json({ limit: "10kb" }));
    app.use((0, cookie_parser_1.default)());
    app.get("/health", (_req, res) => {
        res.status(200).json({ success: true, message: "OK" });
    });
    app.use("/api/auth", auth_routes_1.authRoutes);
    app.use("/api/chat", chat_routes_1.chatRoutes);
    app.use("/api/conversations", conversations_routes_1.conversationsRoutes);
    app.use("/api/admin/knowledge", knowledge_routes_1.knowledgeRoutes);
    app.use("/api/admin/documents", documents_routes_1.documentsRoutes);
    app.use("/api/admin", admin_routes_1.adminRoutes);
    // Body-parser throws a PayloadTooLargeError (not an AppError/ZodError) when the
    // 1mb chat body limit above is exceeded; map that specifically to the documented
    // 413 AI_CONTEXT_TOO_LARGE before it would otherwise fall through to a generic 500.
    app.use("/api/chat", (err, _req, res, next) => {
        if (err && typeof err === "object" && "type" in err && err.type === "entity.too.large") {
            (0, apiResponse_1.sendError)(res, 413, "Your message and conversation history are too large. Please shorten them.", "AI_CONTEXT_TOO_LARGE");
            return;
        }
        next(err);
    });
    app.use(notFound_middleware_1.notFoundMiddleware);
    app.use(error_middleware_1.errorMiddleware);
    return app;
}
//# sourceMappingURL=app.js.map