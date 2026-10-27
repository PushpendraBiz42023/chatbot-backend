import { KnowledgeStatus } from "./knowledge-entry.entity";

export interface KnowledgeEntryDto {
  id: string;
  title: string;
  category: string | null;
  tags: string | null;
  content: string;
  status: KnowledgeStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
