"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUserConversationParamSchema = exports.adminUserIdParamSchema = void 0;
const zod_1 = require("zod");
exports.adminUserIdParamSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid("Invalid user id"),
});
exports.adminUserConversationParamSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid("Invalid user id"),
    conversationId: zod_1.z.string().uuid("Invalid conversation id"),
});
//# sourceMappingURL=admin.validation.js.map