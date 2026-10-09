import type { Prisma } from '../generated/prisma/client';
import { prisma } from './prisma';

/**
 * Cliente aceito pelos repositories: o PrismaClient global ou o `tx` de uma transação.
 * Permite que a escrita e o registro de auditoria aconteçam atomicamente.
 */
export type DbClient = Prisma.TransactionClient;

export const db: DbClient = prisma;

export const transaction = <T>(work: (tx: DbClient) => Promise<T>) => prisma.$transaction(work);
