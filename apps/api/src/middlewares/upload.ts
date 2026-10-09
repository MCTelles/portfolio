import multer from 'multer';
import { MAX_PROJECT_IMAGES } from '@portfolio/shared';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

/**
 * Upload em memória: o service valida o conteúdo real (magic bytes) antes de
 * persistir pelo StorageService. Assim o mesmo fluxo serve para disco ou S3.
 */
export const uploadProjectImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
    files: MAX_PROJECT_IMAGES,
  },
  fileFilter: (_req, file, callback) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) return callback(null, true);
    callback(
      AppError.badRequest(
        'Formato não suportado. Use JPEG, PNG, WebP ou AVIF.',
        'INVALID_FILE_TYPE',
      ),
    );
  },
}).array('images', MAX_PROJECT_IMAGES);
