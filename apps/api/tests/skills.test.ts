import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { createTestAdmin } from './helpers';

const app = createApp();
let auth: string;
const name = 'Skill de Teste';

beforeAll(async () => {
  auth = (await createTestAdmin()).auth;
});

afterAll(() => prisma.$disconnect());

describe('rotas admin de habilidades', () => {
  it('valida categoria e nível', async () => {
    const res = await request(app)
      .post('/api/admin/skills')
      .set('Authorization', auth)
      .send({ name, category: 'OUTRA', level: 9 });

    expect(res.status).toBe(400);
    const paths = res.body.error.details.map((detail: { path: string }) => detail.path);
    expect(paths).toEqual(expect.arrayContaining(['category', 'level']));
  });

  it('cria, recusa duplicata, edita e remove', async () => {
    const created = await request(app)
      .post('/api/admin/skills')
      .set('Authorization', auth)
      .send({ name, category: 'BACKEND', level: 3 });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name, category: 'BACKEND', level: 3, order: 0 });

    const duplicate = await request(app)
      .post('/api/admin/skills')
      .set('Authorization', auth)
      .send({ name, category: 'FRONTEND' });
    expect(duplicate.status).toBe(409);

    const updated = await request(app)
      .patch(`/api/admin/skills/${created.body.id}`)
      .set('Authorization', auth)
      .send({ category: 'MOBILE', level: null });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ name, category: 'MOBILE', level: null });

    const publicList = await request(app).get('/api/skills');
    expect(publicList.body.map((skill: { id: string }) => skill.id)).toContain(created.body.id);

    const deleted = await request(app)
      .delete(`/api/admin/skills/${created.body.id}`)
      .set('Authorization', auth);
    expect(deleted.status).toBe(204);

    const deletedAgain = await request(app)
      .delete(`/api/admin/skills/${created.body.id}`)
      .set('Authorization', auth);
    expect(deletedAgain.status).toBe(404);
  });
});
