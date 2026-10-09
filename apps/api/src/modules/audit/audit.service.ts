import type { AuditLogDTO, Paginated } from '@portfolio/shared';
import { db as defaultDb, type DbClient } from '../../lib/db';
import type { AuditLog } from '../../generated/prisma/client';
import { auditRepository, type AuditListFilter } from './audit.repository';
import type { AuditActor, AuditEntry } from './audit.types';

const toAuditLogDTO = (log: AuditLog): AuditLogDTO => ({
  id: log.id,
  action: log.action,
  entity: log.entity,
  entityId: log.entityId,
  entityLabel: log.entityLabel,
  changes: log.changes,
  actorEmail: log.actorEmail,
  ip: log.ip,
  userAgent: log.userAgent,
  requestId: log.requestId,
  createdAt: log.createdAt.toISOString(),
});

export const auditService = {
  /**
   * Registra uma ou mais entradas. Passe o `tx` da transação da operação auditada:
   * se a gravação do log falhar, a alteração também é desfeita (e vice-versa).
   */
  async record(actor: AuditActor, entries: AuditEntry | AuditEntry[], db: DbClient = defaultDb) {
    const list = Array.isArray(entries) ? entries : [entries];
    if (list.length === 0) return;

    await auditRepository.createMany(
      list.map((entry) => ({
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        entityLabel: entry.entityLabel ?? null,
        changes: entry.changes,
        adminId: actor.adminId,
        actorEmail: actor.email,
        ip: actor.ip,
        userAgent: actor.userAgent,
        requestId: actor.requestId,
      })),
      db,
    );
  },

  async list(filter: AuditListFilter): Promise<Paginated<AuditLogDTO>> {
    const rows = await auditRepository.findPage(filter);
    const hasMore = rows.length > filter.limit;
    const items = (hasMore ? rows.slice(0, filter.limit) : rows).map(toAuditLogDTO);
    return { items, nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null };
  },
};
