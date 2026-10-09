import type { Request, Response } from 'express';
import { resolveSession } from '../../middlewares/authenticate';
import { getActor, getRequestMeta } from '../audit/audit.types';
import { AUTH_COOKIE_NAME, authCookieOptions, clearAuthCookieOptions } from './cookie';
import { authService } from './auth.service';

export const authController = {
  async login(req: Request, res: Response) {
    const { token, admin } = await authService.login(req.body, getRequestMeta(req));
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions).json({ admin });
  },

  /** Sempre limpa o cookie; se a sessão ainda for válida, também a revoga no servidor. */
  async logout(req: Request, res: Response) {
    const session = await resolveSession(req).catch(() => null);
    if (session) {
      req.admin = session;
      await authService.logout(getActor(req));
    }
    res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions).status(204).end();
  },

  async me(req: Request, res: Response) {
    res.json({ admin: await authService.getAdmin(getActor(req).adminId) });
  },
};
