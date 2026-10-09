import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/modules/auth/password';
import { signAccessToken } from '../src/modules/auth/token';

export interface TestAdmin {
  id: string;
  email: string;
  password: string;
  /** Valor pronto para o header Authorization. */
  auth: string;
}

/** Cria um admin real: o `authenticate` confere o admin e a tokenVersion no banco. */
export async function createTestAdmin(): Promise<TestAdmin> {
  const email = `admin-${randomUUID()}@test.local`;
  const password = 'senha-de-teste-123';
  const admin = await prisma.adminUser.create({
    data: { email, name: 'Admin de Teste', passwordHash: await hashPassword(password) },
  });

  const token = signAccessToken({ sub: admin.id, email, ver: admin.tokenVersion });
  return { id: admin.id, email, password, auth: `Bearer ${token}` };
}

/** PNG 1x1 real, para passar na validação de assinatura de arquivo. */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

/** JPEG com metadados EXIF, para provar que o re-encoding os remove. */
export const jpegWithExif = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#8b7cff' } })
    .jpeg()
    .withExifMerge({ IFD0: { Artist: 'Fulano', Copyright: 'metadado-sensivel' } })
    .toBuffer();
