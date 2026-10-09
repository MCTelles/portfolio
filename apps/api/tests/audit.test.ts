import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { createTestAdmin, type TestAdmin } from './helpers';

const app = createApp();
let admin: TestAdmin;

beforeAll(async () => {
  admin = await createTestAdmin();
  for (const name of ['Audit A', 'Audit B', 'Audit C']) {
    await request(app)
      .post('/api/admin/skills')
      .set('Authorization', admin.auth)
      .send({ name, category: 'TOOLS' });
  }
});

afterAll(() => prisma.$disconnect());

describe('GET /api/admin/audit-logs', () => {
  it('exige autenticação', async () => {
    expect((await request(app).get('/api/admin/audit-logs')).status).toBe(401);
  });

  it('pagina do mais recente para o mais antigo, com filtro por entidade', async () => {
    type Item = {
      id: string;
      action: string;
      entity: string;
      createdAt: string;
      changes: { after?: { name: string } };
    };
    const items: Item[] = [];
    let cursor: string | null = null;
    let pages = 0;

    do {
      const res: request.Response = await request(app)
        .get(`/api/admin/audit-logs?entity=Skill&limit=2${cursor ? `&cursor=${cursor}` : ''}`)
        .set('Authorization', admin.auth);
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeLessThanOrEqual(2);
      items.push(...res.body.items);
      cursor = res.body.nextCursor;
      pages++;
    } while (cursor);

    expect(pages).toBeGreaterThan(1);
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    expect(items.every((item) => item.entity === 'Skill')).toBe(true);

    const timestamps = items.map((item) => item.createdAt);
    expect(timestamps).toEqual([...timestamps].sort().reverse());

    const created = items
      .filter((item) => item.action === 'CREATE' && item.changes.after?.name.startsWith('Audit '))
      .map((item) => item.changes.after?.name);
    expect(created).toEqual(['Audit C', 'Audit B', 'Audit A']);
  });

  it('valida os parâmetros de consulta', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs?limit=500')
      .set('Authorization', admin.auth);
    expect(res.status).toBe(400);
  });
});

describe('integridade da trilha', () => {
  it('o banco recusa alterar ou apagar registros', async () => {
    const log = await prisma.auditLog.findFirstOrThrow();
    await expect(
      prisma.auditLog.update({ where: { id: log.id }, data: { entity: 'X' } }),
    ).rejects.toThrow(/append-only/);
    await expect(prisma.auditLog.delete({ where: { id: log.id } })).rejects.toThrow(/append-only/);
  });
});
