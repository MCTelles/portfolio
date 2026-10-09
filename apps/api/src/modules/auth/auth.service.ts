import type { AdminDTO, LoginInput } from '@portfolio/shared';
import { AppError } from '../../errors/AppError';
import { transaction } from '../../lib/db';
import type { AdminUser } from '../../generated/prisma/client';
import { auditService } from '../audit/audit.service';
import type { Actor, RequestMeta } from '../audit/audit.types';
import { adminRepository } from './auth.repository';
import { TIMING_GUARD_HASH, verifyPassword } from './password';
import { signAccessToken } from './token';

const MAX_LOGGED_EMAIL_LENGTH = 254;

const invalidCredentials = () =>
  AppError.unauthorized('E-mail ou senha inválidos', 'INVALID_CREDENTIALS');

const toAdminDTO = ({ id, email, name }: AdminUser): AdminDTO => ({ id, email, name });

export const authService = {
  async login({ email, password }: LoginInput, meta: RequestMeta) {
    const admin = await adminRepository.findByEmail(email);
    const passwordMatches = await verifyPassword(
      password,
      admin?.passwordHash ?? TIMING_GUARD_HASH,
    );

    if (!admin || !passwordMatches) {
      // Tentativas falhas também vão para a trilha: é o sinal de força bruta.
      await auditService.record(
        { ...meta, adminId: admin?.id ?? null, email: email.slice(0, MAX_LOGGED_EMAIL_LENGTH) },
        {
          action: 'LOGIN_FAILED',
          entity: 'Session',
          entityLabel: email.slice(0, MAX_LOGGED_EMAIL_LENGTH),
        },
      );
      throw invalidCredentials();
    }

    await auditService.record(
      { ...meta, adminId: admin.id, email: admin.email },
      { action: 'LOGIN', entity: 'Session', entityId: admin.id, entityLabel: admin.email },
    );

    return {
      token: signAccessToken({ sub: admin.id, email: admin.email, ver: admin.tokenVersion }),
      admin: toAdminDTO(admin),
    };
  },

  /** Encerra a sessão em todos os dispositivos: tokens emitidos antes deixam de valer. */
  async logout(actor: Actor) {
    await transaction(async (tx) => {
      await adminRepository.incrementTokenVersion(actor.adminId, tx);
      await auditService.record(
        actor,
        { action: 'LOGOUT', entity: 'Session', entityId: actor.adminId, entityLabel: actor.email },
        tx,
      );
    });
  },

  async getAdmin(id: string): Promise<AdminDTO> {
    const admin = await adminRepository.findById(id);
    if (!admin) throw AppError.unauthorized('Sessão inválida', 'INVALID_TOKEN');
    return toAdminDTO(admin);
  },
};
