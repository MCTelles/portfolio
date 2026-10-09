import { db as defaultDb, type DbClient } from '../../lib/db';

export const adminRepository = {
  findByEmail: (email: string, db: DbClient = defaultDb) =>
    db.adminUser.findUnique({ where: { email } }),

  findById: (id: string, db: DbClient = defaultDb) => db.adminUser.findUnique({ where: { id } }),

  /** Consulta mínima feita em toda requisição autenticada. */
  findSessionState: (id: string, db: DbClient = defaultDb) =>
    db.adminUser.findUnique({ where: { id }, select: { email: true, tokenVersion: true } }),

  /** Invalida todos os tokens já emitidos para o admin. */
  incrementTokenVersion: (id: string, db: DbClient = defaultDb) =>
    db.adminUser.update({ where: { id }, data: { tokenVersion: { increment: 1 } } }),
};
