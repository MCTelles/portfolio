import { db as defaultDb, type DbClient } from '../../lib/db';
import type { Prisma } from '../../generated/prisma/client';

export interface AuditListFilter {
  entity?: string;
  cursor?: string;
  limit: number;
}

export const auditRepository = {
  createMany: (data: Prisma.AuditLogCreateManyInput[], db: DbClient = defaultDb) =>
    db.auditLog.createMany({ data }),

  /** Paginação por cursor, do mais recente para o mais antigo. */
  findPage: ({ entity, cursor, limit }: AuditListFilter, db: DbClient = defaultDb) =>
    db.auditLog.findMany({
      where: entity ? { entity } : undefined,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    }),
};
