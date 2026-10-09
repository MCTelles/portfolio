import type { CookieOptions } from 'express';
import { env } from '../../config/env';
import { ACCESS_TOKEN_TTL_SECONDS } from './token';

export const AUTH_COOKIE_NAME = 'portfolio_token';

/**
 * httpOnly: o JavaScript da página não lê o token (mitiga XSS).
 * sameSite strict: o navegador não envia o cookie em requisições cross-site (mitiga CSRF).
 */
const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'strict',
  path: '/api',
};

export const authCookieOptions: CookieOptions = {
  ...baseOptions,
  maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
};

export const clearAuthCookieOptions = baseOptions;
