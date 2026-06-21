export interface StoredFile {
  key: string;
  path: string;
  size: number;
  contentType?: string;
  createdAt: Date;
}

export interface StorageProvider {
  put(key: string, data: Buffer, contentType?: string): Promise<StoredFile>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  getPublicUrl(key: string): string | null;
}

let storageProvider: StorageProvider | null = null;

export async function getStorageProvider(): Promise<StorageProvider> {
  if (!storageProvider) {
    const { localStorageProvider } = await import("./local-storage");
    storageProvider = localStorageProvider;
  }
  return storageProvider;
}
