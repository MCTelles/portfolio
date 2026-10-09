import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { signAccessToken } from '../src/modules/auth/token';
import { createTestAdmin, type TestAdmin } from './helpers';

const app = createApp();
let admin: TestAdmin;

beforeAll(async () => {
  admin = await createTestAdmin();
});

afterAll(() => prisma.$disconnect());

const credentials = () => ({ email: admin.email, password: admin.password });
const sessionCookie = (res: request.Response) =>
  res.headers['set-cookie']?.[0]?.split(';')[0] ?? '';

describe('login', () => {
  it('rejeita payload inválido com 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nao-e-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejeita senha errada com mensagem genérica e registra a tentativa', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', 'teste-forca-bruta')
      .send({ ...credentials(), password: 'senha-errada' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');

    const attempt = await prisma.auditLog.findFirst({
      where: { action: 'LOGIN_FAILED', actorEmail: admin.email },
    });
    expect(attempt).toMatchObject({ adminId: admin.id, userAgent: 'teste-forca-bruta' });
    expect(attempt?.requestId).toBe(res.headers['x-request-id']);
  });

  it('autentica com cookie httpOnly e registra o login', async () => {
    const login = await request(app).post('/api/auth/login').send(credentials());

    expect(login.status).toBe(200);
    expect(login.body.token).toBeUndefined();
    expect(login.headers['set-cookie']?.[0]).toMatch(
      /HttpOnly.*SameSite=Strict|SameSite=Strict.*HttpOnly/i,
    );

    const me = await request(app).get('/api/auth/me').set('Cookie', sessionCookie(login));
    expect(me.status).toBe(200);
    expect(me.body.admin.email).toBe(admin.email);

    expect(await prisma.auditLog.count({ where: { action: 'LOGIN', adminId: admin.id } })).toBe(1);
  });
});

describe('revogação de sessão', () => {
  it('logout invalida no servidor o token já emitido (não só apaga o cookie)', async () => {
    const other = await createTestAdmin();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: other.email, password: other.password });
    const stolenCookie = sessionCookie(login);

    const logout = await request(app).post('/api/auth/logout').set('Cookie', stolenCookie);
    expect(logout.status).toBe(204);

    // Quem guardou uma cópia do cookie não consegue mais usá-lo
    const reuse = await request(app).get('/api/auth/me').set('Cookie', stolenCookie);
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('SESSION_REVOKED');

    // Tokens emitidos antes do logout também caem, inclusive os de outros dispositivos
    const oldBearer = await request(app)
      .get('/api/admin/projects')
      .set('Authorization', other.auth);
    expect(oldBearer.status).toBe(401);

    expect(await prisma.auditLog.count({ where: { action: 'LOGOUT', adminId: other.id } })).toBe(1);
  });

  it('logout sem sessão válida apenas limpa o cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(204);
  });

  it('recusa token com versão desatualizada', async () => {
    const token = signAccessToken({ sub: admin.id, email: admin.email, ver: 99 });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('SESSION_REVOKED');
  });
});
