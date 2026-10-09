import sharp from 'sharp';
import { AppError } from '../errors/AppError';

/** Lado máximo da imagem servida: suficiente para telas retina sem desperdiçar banda. */
const MAX_DIMENSION = 2400;
/** ~40 megapixels: recusa "decompression bombs" (arquivo pequeno que explode em memória). */
const MAX_INPUT_PIXELS = 40_000_000;
const WEBP_QUALITY = 82;

export interface ProcessedImage {
  buffer: Buffer;
  extension: '.webp';
  width: number;
  height: number;
}

/**
 * Decodifica e re-encoda a imagem do zero:
 * - aplica a orientação EXIF nos pixels e só então descarta os metadados (EXIF, GPS, XMP, ICC);
 * - qualquer conteúdo extra anexado ao arquivo (polyglots, scripts) não sobrevive, porque só os pixels são gravados;
 * - limita a resolução e padroniza em WebP.
 */
export async function reencodeImage(input: Buffer): Promise<ProcessedImage> {
  try {
    const { data, info } = await sharp(input, {
      limitInputPixels: MAX_INPUT_PIXELS,
      failOn: 'error',
    })
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true });

    return { buffer: data, extension: '.webp', width: info.width, height: info.height };
  } catch {
    throw AppError.badRequest(
      'Não foi possível processar a imagem (arquivo corrompido ou resolução grande demais)',
      'INVALID_IMAGE',
    );
  }
}
