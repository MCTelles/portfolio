import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { createTestAdmin } from './helpers';

const app = createApp();
let auth: string;

beforeAll(async () => {
  auth = (await createTestAdmin()).auth;
});

afterAll(() => prisma.$disconnect());

const validProfile = {
  name: 'Perfil de Teste',
  headline: 'Headline de teste',
  bio: 'Primeiro parágrafo da bio.\n\nSegundo parágrafo.',
  location: '',
  avatarUrl: '',
  socials: [
    { label: 'GitHub', url: 'https://github.com/teste' },
    { label: 'E-mail', url: 'mailto:marcelotellesest@gmail.com' },
  ],
};

describe('rotas admin de perfil', () => {
  it('exige autenticação para salvar', async () => {
    const res = await request(app).put('/api/admin/profile').send(validProfile);
    expect(res.status).toBe(401);
  });

  it('aponta o campo exato do link inválido', async () => {
    const res = await request(app)
      .put('/api/admin/profile')
      .set('Authorization', auth)
      .send({ ...validProfile, socials: [{ label: 'X', url: 'javascript:alert(1)' }] });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'socials.0.url' })]),
    );
  });

  it('salva, normaliza campos vazios para null e audita só o que mudou', async () => {
    const saved = await request(app)
      .put('/api/admin/profile')
      .set('Authorization', auth)
      .send(validProfile);

    expect(saved.status).toBe(200);
    expect(saved.body).toMatchObject({ name: 'Perfil de Teste', location: null, avatarUrl: null });
    expect(saved.body.socials).toHaveLength(2);

    const publicProfile = await request(app).get('/api/profile');
    expect(publicProfile.body.name).toBe('Perfil de Teste');

    await request(app)
      .put('/api/admin/profile')
      .set('Authorization', auth)
      .send({ ...validProfile, headline: 'Nova headline' });

    const logs = await prisma.auditLog.findMany({
      where: { entity: 'Profile' },
      orderBy: { createdAt: 'asc' },
    });
    expect(logs.map((log) => log.action)).toEqual(['CREATE', 'UPDATE']);
    expect(logs[1]?.changes).toEqual({
      headline: { from: 'Headline de teste', to: 'Nova headline' },
    });
  });
});
