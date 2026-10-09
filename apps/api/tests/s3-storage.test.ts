import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { describe, expect, it } from 'vitest';
import { S3Storage } from '../src/lib/storage/s3.storage';

/** Cliente falso: guarda os comandos enviados em vez de chamar a rede. */
function fakeClient() {
  const sent: unknown[] = [];
  return { sent, client: { send: async (command: unknown) => (sent.push(command), {}) } as never };
}

describe('S3Storage (R2)', () => {
  it('grava com nome UUID, tipo e cache imutável, e devolve a URL pública', async () => {
    const { sent, client } = fakeClient();
    const storage = new S3Storage(client, 'portfolio', 'https://pub-abc.r2.dev/');

    const file = await storage.save({ buffer: Buffer.from('x'), extension: '.webp' });

    expect(file.key).toMatch(/^covers\/[a-f0-9-]{36}\.webp$/);
    expect(file.url).toBe(`https://pub-abc.r2.dev/${file.key}`);
    const put = sent[0] as PutObjectCommand;
    expect(put).toBeInstanceOf(PutObjectCommand);
    expect(put.input).toMatchObject({
      Bucket: 'portfolio',
      Key: file.key,
      ContentType: 'image/webp',
    });
    expect(put.input.CacheControl).toContain('immutable');
  });

  it('remove só chaves que ele mesmo gerou', async () => {
    const { sent, client } = fakeClient();
    const storage = new S3Storage(client, 'portfolio', 'https://pub-abc.r2.dev');
    const { key } = await storage.save({ buffer: Buffer.from('x'), extension: '.webp' });

    await storage.remove(key);
    expect(sent[1]).toBeInstanceOf(DeleteObjectCommand);

    await expect(storage.remove('../outro-arquivo')).rejects.toThrow(/inválida/);
    await expect(storage.remove('covers/../../segredo.webp')).rejects.toThrow(/inválida/);
  });
});
