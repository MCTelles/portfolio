import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { uploadsDirectory } from '../src/lib/storage';
import { createTestAdmin, jpegWithExif, TINY_PNG, type TestAdmin } from './helpers';

const app = createApp();
let admin: TestAdmin;

beforeAll(async () => {
  admin = await createTestAdmin();
});

afterAll(() => prisma.$disconnect());

const validProject = {
  title: 'Projeto de Teste',
  summary: 'Resumo com tamanho suficiente.',
  description: 'Descrição com tamanho suficiente para passar.',
  stack: ['React', 'Node'],
  repoUrl: 'https://github.com/exemplo/repo',
  deployUrl: '',
};

const createProject = async (overrides: Partial<typeof validProject> = {}) => {
  const res = await request(app)
    .post('/api/admin/projects')
    .set('Authorization', admin.auth)
    .send({ ...validProject, ...overrides });
  expect(res.status).toBe(201);
  return res.body as { id: string; slug: string };
};

describe('autorização', () => {
  it('exige autenticação', async () => {
    expect((await request(app).get('/api/admin/projects')).status).toBe(401);
  });

  it('rejeita token adulterado', async () => {
    const res = await request(app)
      .get('/api/admin/projects')
      .set('Authorization', `${admin.auth}x`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });
});

describe('CRUD de projetos', () => {
  it('valida o payload de criação', async () => {
    const res = await request(app)
      .post('/api/admin/projects')
      .set('Authorization', admin.auth)
      .send({ title: 'X', stack: [], repoUrl: 'javascript:alert(1)' });

    expect(res.status).toBe(400);
    const paths = res.body.error.details.map((detail: { path: string }) => detail.path);
    expect(paths).toEqual(expect.arrayContaining(['title', 'summary', 'stack', 'repoUrl']));
  });

  it('registra criação, alteração e exclusão na trilha de auditoria', async () => {
    const { id, slug } = await createProject({ title: 'Projeto Auditado' });
    expect(slug).toBe('projeto-auditado');

    // Rascunho não aparece na API pública
    expect((await request(app).get(`/api/projects/${slug}`)).status).toBe(404);

    await request(app)
      .patch(`/api/admin/projects/${id}`)
      .set('Authorization', admin.auth)
      .send({ published: true, title: 'Projeto Auditado' });
    expect((await request(app).get(`/api/projects/${slug}`)).status).toBe(200);

    // PATCH sem mudança real não gera ruído na trilha
    await request(app)
      .patch(`/api/admin/projects/${id}`)
      .set('Authorization', admin.auth)
      .send({ published: true });

    await request(app).delete(`/api/admin/projects/${id}`).set('Authorization', admin.auth);

    const logs = await prisma.auditLog.findMany({
      where: { entity: 'Project', entityId: id },
      orderBy: { createdAt: 'asc' },
    });
    expect(logs.map((log) => log.action)).toEqual(['CREATE', 'UPDATE', 'DELETE']);
    expect(logs[1]?.changes).toEqual({ published: { from: false, to: true } });
    expect(logs.every((log) => log.adminId === admin.id && log.actorEmail === admin.email)).toBe(
      true,
    );
    // O nome continua legível na trilha mesmo depois do projeto ser apagado
    expect(logs.every((log) => log.entityLabel === 'Projeto Auditado')).toBe(true);
  });
});

describe('upload de imagens', () => {
  it('rejeita mimetype não permitido', async () => {
    const res = await request(app)
      .post('/api/admin/projects/00000000-0000-4000-8000-000000000000/images')
      .set('Authorization', admin.auth)
      .attach('images', Buffer.from('texto'), { filename: 'a.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
  });

  it('rejeita conteúdo que não é imagem e imagem corrompida', async () => {
    const { id } = await createProject({ title: 'Projeto Upload Inválido' });
    const send = (buffer: Buffer) =>
      request(app)
        .post(`/api/admin/projects/${id}/images`)
        .set('Authorization', admin.auth)
        .attach('images', buffer, { filename: 'x.png', contentType: 'image/png' });

    const spoofed = await send(Buffer.from('<?php echo 1; ?> padding padding'));
    expect(spoofed.status).toBe(400);
    expect(spoofed.body.error.code).toBe('INVALID_FILE_TYPE');

    // Assinatura de PNG válida, mas o arquivo está truncado
    const corrupted = await send(TINY_PNG.subarray(0, 40));
    expect(corrupted.status).toBe(400);
    expect(corrupted.body.error.code).toBe('INVALID_IMAGE');
  });

  it('re-encoda em WebP sem metadados, limita a resolução e audita', async () => {
    const { id } = await createProject({ title: 'Projeto Upload' });
    const original = await jpegWithExif(3000, 1500);
    expect((await sharp(original).metadata()).exif).toBeDefined();

    const uploaded = await request(app)
      .post(`/api/admin/projects/${id}/images`)
      .set('Authorization', admin.auth)
      .attach('images', original, { filename: 'foto.jpg', contentType: 'image/jpeg' });

    expect(uploaded.status).toBe(201);
    const [image] = uploaded.body.images;
    expect(image.url).toMatch(/\.webp$/);
    expect(image).toMatchObject({ width: 2400, height: 1200 });

    const filePath = path.join(uploadsDirectory, path.basename(image.url));
    const stored = await sharp(filePath).metadata();
    expect(stored.format).toBe('webp');
    expect(stored.exif).toBeUndefined();
    expect((await request(app).get(image.url)).status).toBe(200);

    expect(
      await prisma.auditLog.count({
        where: { entity: 'ProjectImage', entityId: image.id, action: 'CREATE' },
      }),
    ).toBe(1);

    const deleted = await request(app)
      .delete(`/api/admin/projects/${id}`)
      .set('Authorization', admin.auth);
    expect(deleted.status).toBe(204);
    expect(existsSync(filePath)).toBe(false);
  });
});
