"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.switchProviderSchema = exports.renameConversationSchema = exports.conversationIdParamSchema = void 0;
const zod_1 = require("zod");
exports.conversationIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Invalid conversation id"),
});
exports.renameConversationSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
});
exports.switchProviderSchema = zod_1.z.object({
    provider: zod_1.z.enum(["gemini", "groq", "mistral", "openrouter"], {
        errorMap: () => ({ message: "provider must be one of: gemini, groq, mistral, openrouter" }),
    }),
});
//# sourceMappingURL=conversations.validation.js.map