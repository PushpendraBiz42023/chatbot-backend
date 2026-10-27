import { AppDataSource } from "../../database/data-source";
import { DocumentStatus, KnowledgeDocument } from "./knowledge-document.entity";

const documentRepo = () => AppDataSource.getRepository(KnowledgeDocument);

export const DocumentsRepository = {
  async listAll(): Promise<KnowledgeDocument[]> {
    return documentRepo().find({ order: { updatedAt: "DESC" } });
  },

  async findById(id: string): Promise<KnowledgeDocument | null> {
    return documentRepo().findOne({ where: { id } });
  },

  async create(data: {
    title: string;
    description: string | null;
    sourceType: KnowledgeDocument["sourceType"];
    originalFilename: string;
    storageKey: string;
    mimeType: string;
    fileSize: number;
    createdBy: string;
  }): Promise<KnowledgeDocument> {
    const document = documentRepo().create({ ...data, status: DocumentStatus.PROCESSING, processingError: null });
    return documentRepo().save(document);
  },

  async setStatus(id: string, status: DocumentStatus, processingError: string | null = null): Promise<void> {
    await documentRepo().update({ id }, { status, processingError });
  },

  async delete(id: string): Promise<boolean> {
    const result = await documentRepo().delete({ id });
    return (result.affected ?? 0) > 0;
  },
};
