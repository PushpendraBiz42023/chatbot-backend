import { AppError } from "../../utils/AppError";
import { KnowledgeRepository } from "./knowledge.repository";
import { KnowledgeEntry, KnowledgeStatus } from "./knowledge-entry.entity";
import { KnowledgeEntryDto } from "./knowledge.types";
import { CreateKnowledgeInput, UpdateKnowledgeInput } from "./knowledge.validation";
import { syncKnowledgeChunks } from "./knowledge-embedding.sync";

function toDto(entry: KnowledgeEntry): KnowledgeEntryDto {
  return {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    tags: entry.tags,
    content: entry.content,
    status: entry.status,
    createdBy: entry.createdBy,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

async function getEntryOrThrow(id: string): Promise<KnowledgeEntry> {
  const entry = await KnowledgeRepository.findById(id);
  if (!entry) {
    throw new AppError(404, "NOT_FOUND", "Knowledge entry not found");
  }
  return entry;
}

export const KnowledgeService = {
  async list(): Promise<KnowledgeEntryDto[]> {
    const entries = await KnowledgeRepository.listAll();
    return entries.map(toDto);
  },

  async create(createdBy: string, input: CreateKnowledgeInput): Promise<KnowledgeEntryDto> {
    const entry = await KnowledgeRepository.create({
      title: input.title,
      category: input.category ?? null,
      tags: input.tags ?? null,
      content: input.content,
      status: input.status ?? KnowledgeStatus.ACTIVE,
      createdBy,
    });
    // Inline/awaited per MVP scope; failures are logged, not thrown, so a
    // broken embedding call never blocks the entry from saving.
    await syncKnowledgeChunks(entry);
    return toDto(entry);
  },

  async getOne(id: string): Promise<KnowledgeEntryDto> {
    const entry = await getEntryOrThrow(id);
    return toDto(entry);
  },

  async update(id: string, input: UpdateKnowledgeInput): Promise<KnowledgeEntryDto> {
    await getEntryOrThrow(id);
    const updated = await KnowledgeRepository.update(id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    });
    if (!updated) {
      throw new AppError(404, "NOT_FOUND", "Knowledge entry not found");
    }
    // Only re-sync chunks when content or status actually changed — a
    // title/category/tags-only edit doesn't affect what's embedded.
    if (input.content !== undefined || input.status !== undefined) {
      await syncKnowledgeChunks(updated);
    }
    return toDto(updated);
  },

  async remove(id: string): Promise<void> {
    const deleted = await KnowledgeRepository.delete(id);
    if (!deleted) {
      throw new AppError(404, "NOT_FOUND", "Knowledge entry not found");
    }
  },
};
