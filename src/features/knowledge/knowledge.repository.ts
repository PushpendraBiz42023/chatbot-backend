import { AppDataSource } from "../../database/data-source";
import { KnowledgeEntry, KnowledgeStatus } from "./knowledge-entry.entity";

const knowledgeRepo = () => AppDataSource.getRepository(KnowledgeEntry);

export const KnowledgeRepository = {
  async listAll(): Promise<KnowledgeEntry[]> {
    return knowledgeRepo().find({
      order: { updatedAt: "DESC" },
    });
  },

  async findById(id: string): Promise<KnowledgeEntry | null> {
    return knowledgeRepo().findOne({ where: { id } });
  },

  async create(data: {
    title: string;
    category: string | null;
    tags: string | null;
    content: string;
    status: KnowledgeStatus;
    createdBy: string;
  }): Promise<KnowledgeEntry> {
    const entry = knowledgeRepo().create(data);
    return knowledgeRepo().save(entry);
  },

  async update(
    id: string,
    changes: Partial<Pick<KnowledgeEntry, "title" | "category" | "tags" | "content" | "status">>
  ): Promise<KnowledgeEntry | null> {
    await knowledgeRepo().update({ id }, changes);
    return knowledgeRepo().findOne({ where: { id } });
  },

  async delete(id: string): Promise<boolean> {
    const result = await knowledgeRepo().delete({ id });
    return (result.affected ?? 0) > 0;
  },
};
