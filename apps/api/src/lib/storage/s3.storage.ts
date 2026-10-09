import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import type { StorageService, StoredFile } from './storage';

const KEY_PREFIX = 'covers/';
const SAFE_KEY = /^covers\/[a-f0-9-]{36}\.[a-z0-9]{2,5}$/;

const CONTENT_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.avif': 'image/avif',
};

/** Só os comandos usados aqui: permite testar com um cliente falso, sem rede. */
type ObjectClient = Pick<S3Client, 'send'>;

/**
 * Armazenamento em bucket compatível com S3 (Cloudflare R2, AWS S3, MinIO). As imagens
 * ficam fora do servidor, então sobrevivem a deploys e reinícios: no plano gratuito do
 * Render o disco local é apagado a cada um deles.
 */
export class S3Storage implements StorageService {
  constructor(
    private readonly client: ObjectClient,
    private readonly bucket: string,
    /** URL pública do bucket (ex.: https://pub-xxxx.r2.dev ou um domínio próprio). */
    private readonly publicUrl: string,
  ) {}

  async save({ buffer, extension }: { buffer: Buffer; extension: string }): Promise<StoredFile> {
    const key = `${KEY_PREFIX}${randomUUID()}${extension}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: CONTENT_TYPES[extension] ?? 'application/octet-stream',
        // Nome é UUID: o conteúdo de uma URL nunca muda, pode ser cacheado para sempre
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return { key, url: `${this.publicUrl.replace(/\/$/, '')}/${key}` };
  }

  async remove(key: string): Promise<void> {
    // Só remove chaves geradas por `save`: nunca apaga outro objeto do bucket
    if (!SAFE_KEY.test(key)) throw new Error(`Chave de arquivo inválida: ${key}`);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
