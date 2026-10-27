"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateKnowledgeSchema = exports.createKnowledgeSchema = exports.knowledgeIdParamSchema = void 0;
const zod_1 = require("zod");
const knowledge_entry_entity_1 = require("./knowledge-entry.entity");
exports.knowledgeIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Invalid knowledge entry id"),
});
exports.createKnowledgeSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
    category: zod_1.z.string().trim().max(100, "Category must be at most 100 characters").optional().nullable(),
    tags: zod_1.z.string().trim().max(500, "Tags must be at most 500 characters").optional().nullable(),
    content: zod_1.z.string().trim().min(1, "Content is required").max(50000, "Content must be at most 50000 characters"),
    status: zod_1.z.nativeEnum(knowledge_entry_entity_1.KnowledgeStatus).optional(),
});
exports.updateKnowledgeSchema = zod_1.z
    .object({
    title: zod_1.z.string().trim().min(1, "Title is required").max(200, "Title must be at most 200 characters").optional(),
    category: zod_1.z.string().trim().max(100, "Category must be at most 100 characters").optional().nullable(),
    tags: zod_1.z.string().trim().max(500, "Tags must be at most 500 characters").optional().nullable(),
    content: zod_1.z
        .string()
        .trim()
        .min(1, "Content is required")
        .max(50000, "Content must be at most 50000 characters")
        .optional(),
    status: zod_1.z.nativeEnum(knowledge_entry_entity_1.KnowledgeStatus).optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
});
//# sourceMappingURL=knowledge.validation.js.map