import type { Prisma } from '../../generated/prisma/client';

export type Snapshot = Record<string, Prisma.InputJsonValue | null>;
export type FieldChanges = Record<
  string,
  { from: Prisma.InputJsonValue | null; to: Prisma.InputJsonValue | null }
>;

const isEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Campos que mudaram entre dois snapshots, no formato `{ campo: { from, to } }`. */
export function diffSnapshots(before: Snapshot, after: Snapshot): FieldChanges {
  const changes: FieldChanges = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const from = before[key] ?? null;
    const to = after[key] ?? null;
    if (!isEqual(from, to)) changes[key] = { from, to };
  }
  return changes;
}

export const hasChanges = (changes: FieldChanges) => Object.keys(changes).length > 0;
