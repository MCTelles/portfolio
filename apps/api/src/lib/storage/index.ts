import path from 'node:path';
import { S3Client } from '@aws-sdk/client-s3';
import { env } from '../../config/env';
import { LocalDiskStorage } from './local-disk.storage';
import { S3Storage } from './s3.storage';
import type { StorageService } from './storage';

export const UPLOADS_PUBLIC_PATH = '/uploads';
export const uploadsDirectory = path.resolve(env.UPLOAD_DIR);

/** Disco local em desenvolvimento; bucket S3/R2 em produção (STORAGE_DRIVER=s3). */
function createStorage(): StorageService {
  if (env.STORAGE_DRIVER === 's3') {
    const client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID ?? '',
        secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? '',
      },
    });
    return new S3Storage(client, env.S3_BUCKET ?? '', env.S3_PUBLIC_URL ?? '');
  }
  return new LocalDiskStorage(uploadsDirectory, UPLOADS_PUBLIC_PATH);
}

export const storage = createStorage();

export type { StorageService, StoredFile } from './storage';
