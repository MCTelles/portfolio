import path from 'node:path';
import { env } from '../../config/env';
import { LocalDiskStorage } from './local-disk.storage';

export const UPLOADS_PUBLIC_PATH = '/uploads';
export const uploadsDirectory = path.resolve(env.UPLOAD_DIR);

export const storage = new LocalDiskStorage(uploadsDirectory, UPLOADS_PUBLIC_PATH);

export type { StorageService, StoredFile } from './storage';
