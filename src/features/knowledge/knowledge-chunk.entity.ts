import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { KnowledgeEntry } from "./knowledge-entry.entity";
import { KnowledgeDocument } from "../documents/knowledge-document.entity";

export interface KnowledgeChunkMetadata {
  title: string;
  /** PDF-only: the 1-based source page this chunk's text came from, for future citation display. */
  page?: number;
}

/**
 * Retrieval unit for grounding chat responses in admin knowledge. Populated
 * from `knowledge_entries` (`entryId`) or from Feature 4's uploaded
 * `knowledge_documents` (`documentId`) — exactly one of the two is set per
 * row. Both FKs cascade-delete, so removing an entry or a document cleans up
 * its chunks automatically.
 *
 * `embedding` is stored via `simple-json` (a plain number[]) rather than a
 * native vector column: MySQL/MariaDB here has no vector type, and the spec
 * explicitly rules out adding a separate vector database, so similarity is
 * computed in application code (see services/rag/similarity.ts).
 */
@Entity({ name: "knowledge_chunks" })
export class KnowledgeChunk {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", length: 36, name: "entry_id", nullable: true })
  entryId!: string | null;

  @ManyToOne(() => KnowledgeEntry, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "entry_id" })
  entry!: KnowledgeEntry | null;

  /** Feature 4 (document upload): the source document, for chunks not tied to a manual entry. */
  @Index()
  @Column({ type: "varchar", length: 36, name: "document_id", nullable: true })
  documentId!: string | null;

  @ManyToOne(() => KnowledgeDocument, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "document_id" })
  document!: KnowledgeDocument | null;

  @Column({ type: "int", name: "chunk_index", default: 0 })
  chunkIndex!: number;

  @Column({ type: "mediumtext" })
  content!: string;

  @Column({ type: "simple-json" })
  embedding!: number[];

  @Column({ type: "simple-json", nullable: true })
  metadata!: KnowledgeChunkMetadata | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
