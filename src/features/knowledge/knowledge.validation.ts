import { z } from "zod";
import { KnowledgeStatus } from "./knowledge-entry.entity";

export const knowledgeIdParamSchema = z.object({
  id: z.string().uuid("Invalid knowledge entry id"),
});

export const createKnowledgeSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  category: z.string().trim().max(100, "Category must be at most 100 characters").optional().nullable(),
  tags: z.string().trim().max(500, "Tags must be at most 500 characters").optional().nullable(),
  content: z.string().trim().min(1, "Content is required").max(50000, "Content must be at most 50000 characters"),
  status: z.nativeEnum(KnowledgeStatus).optional(),
});

export const updateKnowledgeSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200, "Title must be at most 200 characters").optional(),
    category: z.string().trim().max(100, "Category must be at most 100 characters").optional().nullable(),
    tags: z.string().trim().max(500, "Tags must be at most 500 characters").optional().nullable(),
    content: z
      .string()
      .trim()
      .min(1, "Content is required")
      .max(50000, "Content must be at most 50000 characters")
      .optional(),
    status: z.nativeEnum(KnowledgeStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type KnowledgeIdParam = z.infer<typeof knowledgeIdParamSchema>;
export type CreateKnowledgeInput = z.infer<typeof createKnowledgeSchema>;
export type UpdateKnowledgeInput = z.infer<typeof updateKnowledgeSchema>;
