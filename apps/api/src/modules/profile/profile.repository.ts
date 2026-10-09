import { db as defaultDb, type DbClient } from '../../lib/db';
import type { Prisma } from '../../generated/prisma/client';

/** O perfil é um registro único; o id fixo garante isso no banco. */
export const PROFILE_ID = 1;

export const profileRepository = {
  find: (db: DbClient = defaultDb) => db.profile.findUnique({ where: { id: PROFILE_ID } }),

  upsert: (data: Prisma.ProfileCreateInput, db: DbClient = defaultDb) =>
    db.profile.upsert({
      where: { id: PROFILE_ID },
      create: { ...data, id: PROFILE_ID },
      update: data,
    }),
};
