import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../../errors/AppError';

const ISSUER = 'portfolio-api';
const AUDIENCE = 'portfolio-admin';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  /** Versão da sessão do admin no momento da emissão; ver `AdminUser.tokenVersion`. */
  ver: number;
}

export const ACCESS_TOKEN_TTL_SECONDS = Math.round(env.JWT_EXPIRES_IN_HOURS * 60 * 60);

export function signAccessToken({ sub, email, ver }: AccessTokenPayload): string {
  return jwt.sign({ email, ver }, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: sub,
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

/** Verifica assinatura, emissor e expiração. A revogação é checada no `authenticate`. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (
      typeof decoded === 'string' ||
      !decoded.sub ||
      typeof decoded.email !== 'string' ||
      typeof decoded.ver !== 'number'
    ) {
      throw new Error('Payload inesperado');
    }

    return { sub: decoded.sub, email: decoded.email, ver: decoded.ver };
  } catch {
    throw AppError.unauthorized('Sessão inválida ou expirada', 'INVALID_TOKEN');
  }
}
