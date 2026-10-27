import { DocumentSourceType, DocumentStatus } from "./knowledge-document.entity";

export interface KnowledgeDocumentDto {
  id: string;
  title: string;
  description: string | null;
  sourceType: DocumentSourceType;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  status: DocumentStatus;
  processingError: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
