import { z } from "zod";

export const adminUserIdParamSchema = z.object({
  userId: z.string().uuid("Invalid user id"),
});

export const adminUserConversationParamSchema = z.object({
  userId: z.string().uuid("Invalid user id"),
  conversationId: z.string().uuid("Invalid conversation id"),
});

export type AdminUserIdParam = z.infer<typeof adminUserIdParamSchema>;
export type AdminUserConversationParam = z.infer<typeof adminUserConversationParamSchema>;
