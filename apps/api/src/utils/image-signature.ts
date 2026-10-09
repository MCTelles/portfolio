export type ImageType = 'jpeg' | 'png' | 'webp' | 'avif';

/**
 * Triagem rápida pelos "magic bytes", antes de gastar CPU decodificando. O mimetype enviado pelo
 * cliente é só um palpite e pode ser forjado; o conteúdo é a fonte da verdade.
 */
export function detectImageType(buffer: Buffer): ImageType | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';

  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'png';
  }

  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }

  const brand = buffer.toString('ascii', 4, 12);
  if (brand === 'ftypavif' || brand === 'ftypavis') return 'avif';

  return null;
}
