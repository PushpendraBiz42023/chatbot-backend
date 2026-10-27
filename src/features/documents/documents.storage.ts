import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { AllowedExtension } from "./documents.constants";

/**
 * `backend/storage/documents/` — resolved once, relative to this file, so it
 * works the same whether running via tsx (src) or the compiled dist build.
 */
export const DOCUMENTS_STORAGE_DIR = path.resolve(__dirname, "../../../storage/documents");

async function ensureStorageDir(): Promise<void> {
  await fs.mkdir(DOCUMENTS_STORAGE_DIR, { recursive: true });
}

/**
 * Generates the on-disk filename for a newly uploaded document. This is the
 * ONLY thing ever used to build a filesystem path for a document's file —
 * `originalFilename` (client-supplied) must never be used here, which is the
 * path-traversal defense the spec calls out. `crypto.randomUUID()` plus the
 * already-validated extension keeps the name unguessable and collision-free.
 */
export function generateStorageKey(extension: AllowedExtension): string {
  return `${randomUUID()}${extension}`;
}

/** Resolves a storage key (never client input) to its absolute on-disk path. */
export function resolveStoragePath(storageKey: string): string {
  return path.join(DOCUMENTS_STORAGE_DIR, storageKey);
}

export async function saveDocumentFile(storageKey: string, buffer: Buffer): Promise<void> {
  await ensureStorageDir();
  await fs.writeFile(resolveStoragePath(storageKey), buffer);
}

export async function readDocumentFile(storageKey: string): Promise<Buffer> {
  return fs.readFile(resolveStoragePath(storageKey));
}

export async function deleteDocumentFile(storageKey: string): Promise<void> {
  try {
    await fs.unlink(resolveStoragePath(storageKey));
  } catch (error) {
    // Missing file on disk shouldn't block the DB row from being deleted.
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
