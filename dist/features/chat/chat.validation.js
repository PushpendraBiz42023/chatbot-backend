"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRequestSchema = void 0;
const zod_1 = require("zod");
exports.chatRequestSchema = zod_1.z.object({
    // Syntactically valid UUID only — existence + ownership are re-verified
    // server-side against req.userId before any DB/AI work happens. Omitted or
    // null means: create a brand-new conversation for this user.
    conversationId: zod_1.z.string().trim().uuid("conversationId must be a valid UUID").optional().nullable(),
    message: zod_1.z
        .string()
        .trim()
        .min(1, "message is required")
        .max(8000, "message must be at most 8000 characters"),
});
//# sourceMappingURL=chat.validation.js.map