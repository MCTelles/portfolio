import type { AuditEntity } from '@portfolio/shared';
import type { Request } from 'express';
import { AppError } from '../../errors/AppError';
import type { AuditAction, Prisma } from '../../generated/prisma/client';

/** De onde veio a requisição. Existe mesmo sem login (ex.: tentativa de login falha). */
export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
  requestId: string;
}

/** Quem executou a ação; anônimo apenas em eventos como login falho. */
export interface AuditActor extends RequestMeta {
  adminId: string | null;
  email: string | null;
}

/** Admin autenticado executando a ação. */
export interface Actor extends AuditActor {
  adminId: string;
  email: string;
}

export interface AuditEntry {
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  /** Nome legível (título, nome, e-mail) congelado no momento da ação. */
  entityLabel?: string | null;
  changes?: Prisma.InputJsonValue;
}

const MAX_USER_AGENT_LENGTH = 300;

export function getRequestMeta(req: Request): RequestMeta {
  return {
    ip: req.ip ?? null,
    userAgent: req.get('user-agent')?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
    requestId: req.requestId,
  };
}

/** Ator autenticado; use em rotas montadas depois de `authenticate`. */
export function getActor(req: Request): Actor {
  if (!req.admin) throw AppError.unauthorized();
  return { ...getRequestMeta(req), adminId: req.admin.sub, email: req.admin.email };
}
