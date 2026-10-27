import { z } from "zod";

export const chatRequestSchema = z.object({
  // Syntactically valid UUID only — existence + ownership are re-verified
  // server-side against req.userId before any DB/AI work happens. Omitted or
  // null means: create a brand-new conversation for this user.
  conversationId: z.string().trim().uuid("conversationId must be a valid UUID").optional().nullable(),
  message: z
    .string()
    .trim()
    .min(1, "message is required")
    .max(8000, "message must be at most 8000 characters"),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
