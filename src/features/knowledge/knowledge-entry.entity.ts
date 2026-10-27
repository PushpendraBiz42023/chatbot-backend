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

export enum KnowledgeStatus {
  ACTIVE = "active",
  DISABLED = "disabled",
}

@Entity({ name: "knowledge_entries" })
export class KnowledgeEntry {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  category!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  tags!: string | null;

  @Column({ type: "mediumtext" })
  content!: string;

  @Column({ type: "enum", enum: KnowledgeStatus, default: KnowledgeStatus.ACTIVE })
  status!: KnowledgeStatus;

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
