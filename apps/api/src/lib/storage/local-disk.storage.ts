import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { StorageService, StoredFile } from './storage';

const SAFE_KEY = /^[a-f0-9-]{36}\.[a-z0-9]{2,5}$/;

export class LocalDiskStorage implements StorageService {
  constructor(
    private readonly directory: string,
    private readonly publicPath: string,
  ) {}

  async save({ buffer, extension }: { buffer: Buffer; extension: string }): Promise<StoredFile> {
    await mkdir(this.directory, { recursive: true });
    const key = `${randomUUID()}${extension}`;
    await writeFile(this.resolve(key), buffer);
    return { key, url: `${this.publicPath}/${key}` };
  }

  async remove(key: string): Promise<void> {
    try {
      await unlink(this.resolve(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  /** Só aceita chaves geradas por `save`, o que impede path traversal. */
  private resolve(key: string): string {
    if (!SAFE_KEY.test(key)) throw new Error(`Chave de arquivo inválida: ${key}`);
    return path.join(this.directory, key);
  }
}
