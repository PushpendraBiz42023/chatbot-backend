import { z } from "zod";

export const conversationIdParamSchema = z.object({
  id: z.string().uuid("Invalid conversation id"),
});

export const renameConversationSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
});

export const switchProviderSchema = z.object({
  provider: z.enum(["gemini", "groq", "mistral", "openrouter"], {
    errorMap: () => ({ message: "provider must be one of: gemini, groq, mistral, openrouter" }),
  }),
});

export type ConversationIdParam = z.infer<typeof conversationIdParamSchema>;
export type RenameConversationInput = z.infer<typeof renameConversationSchema>;
export type SwitchProviderInput = z.infer<typeof switchProviderSchema>;
