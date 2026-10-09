import type { Request, RequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import { adminRepository } from '../modules/auth/auth.repository';
import { AUTH_COOKIE_NAME } from '../modules/auth/cookie';
import { verifyAccessToken, type AccessTokenPayload } from '../modules/auth/token';

/** Aceita o cookie httpOnly (navegador) ou `Authorization: Bearer` (curl, integrações). */
function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length).trim();

  const cookie: unknown = req.cookies?.[AUTH_COOKIE_NAME];
  return typeof cookie === 'string' ? cookie : undefined;
}

/**
 * Valida o JWT e confere no banco se ele ainda vale: o admin precisa existir e a
 * `tokenVersion` do token precisa ser a atual. Logout e troca de senha incrementam
 * essa versão, então um token roubado deixa de funcionar na hora, sem esperar expirar.
 */
export async function resolveSession(req: Request): Promise<AccessTokenPayload> {
  const token = extractToken(req);
  if (!token) throw AppError.unauthorized();

  const payload = verifyAccessToken(token);
  const admin = await adminRepository.findSessionState(payload.sub);

  if (!admin || admin.tokenVersion !== payload.ver) {
    throw AppError.unauthorized('Sessão encerrada. Faça login novamente.', 'SESSION_REVOKED');
  }

  return { ...payload, email: admin.email };
}

export const authenticate: RequestHandler = async (req, _res, next) => {
  req.admin = await resolveSession(req);
  next();
};
