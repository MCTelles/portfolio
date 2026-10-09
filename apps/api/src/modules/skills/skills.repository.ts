import { db as defaultDb, type DbClient } from '../../lib/db';
import type { Prisma } from '../../generated/prisma/client';

export const skillRepository = {
  findAll: (db: DbClient = defaultDb) =>
    db.skill.findMany({ orderBy: [{ category: 'asc' }, { order: 'asc' }, { name: 'asc' }] }),

  findById: (id: string, db: DbClient = defaultDb) => db.skill.findUnique({ where: { id } }),

  create: (data: Prisma.SkillCreateInput, db: DbClient = defaultDb) => db.skill.create({ data }),

  update: (id: string, data: Prisma.SkillUpdateInput, db: DbClient = defaultDb) =>
    db.skill.update({ where: { id }, data }),

  delete: (id: string, db: DbClient = defaultDb) => db.skill.delete({ where: { id } }),
};
