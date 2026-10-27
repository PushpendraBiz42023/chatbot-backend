import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../auth/user.entity";

export enum DocumentSourceType {
  PDF = "pdf",
  DOC = "doc",
  DOCX = "docx",
  TXT = "txt",
  IMAGE = "image",
}

export enum DocumentStatus {
  PROCESSING = "processing",
  READY = "ready",
  FAILED = "failed",
  DISABLED = "disabled",
}

/**
 * A single uploaded, admin-managed source document (Feature 4). Once
 * successfully processed, its extracted text is split into
 * `knowledge_chunks` rows (via `documentId`) exactly like manual
 * `knowledge_entries` are, so it grounds chat responses through the same
 * unmodified retrieval path built in Feature 3.
 *
 * `storageKey` — NOT `originalFilename` — is the only thing ever used to
 * build the on-disk path (see documents.storage.ts); `originalFilename` is
 * sanitized for DISPLAY ONLY and must never reach the filesystem layer.
 */
@Entity({ name: "knowledge_documents" })
export class KnowledgeDocument {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  description!: string | null;

  @Column({ type: "enum", enum: DocumentSourceType, name: "source_type" })
  sourceType!: DocumentSourceType;

  @Column({ type: "varchar", length: 255, name: "original_filename" })
  originalFilename!: string;

  @Column({ type: "varchar", length: 255, name: "storage_key" })
  storageKey!: string;

  @Column({ type: "varchar", length: 100, name: "mime_type" })
  mimeType!: string;

  @Column({ type: "int", name: "file_size" })
  fileSize!: number;

  @Column({ type: "enum", enum: DocumentStatus, default: DocumentStatus.PROCESSING })
  status!: DocumentStatus;

  @Column({ type: "text", name: "processing_error", nullable: true })
  processingError!: string | null;

  @Column({ type: "varchar", length: 36, name: "created_by" })
  createdBy!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "created_by" })
  createdByUser!: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
