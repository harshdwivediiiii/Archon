import fs from "fs/promises";
import path from "path";
import type { StorageProvider } from "./provider";

const DEFAULT_STORAGE_DIR = "storage/uploads";

function getStorageRoot(): string {
  const configured = process.env.STORAGE_PATH?.trim();
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), DEFAULT_STORAGE_DIR);
}

function resolveKey(key: string): string {
  const normalized = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
  if (normalized.includes("..")) {
    throw new Error("Invalid storage key");
  }
  return path.join(getStorageRoot(), normalized);
}

async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export const localStorageProvider: StorageProvider = {
  async put(key, data, contentType) {
    const filePath = resolveKey(key);
    await ensureDir(filePath);
    await fs.writeFile(filePath, data);

    return {
      key,
      path: filePath,
      size: data.byteLength,
      contentType,
      createdAt: new Date(),
    };
  },

  async get(key) {
    const filePath = resolveKey(key);
    try {
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  },

  async delete(key) {
    const filePath = resolveKey(key);
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  },

  async exists(key) {
    const filePath = resolveKey(key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  },

  getPublicUrl(key) {
    return `/api/storage/${encodeURIComponent(key)}`;
  },
};
