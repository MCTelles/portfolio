import { db as defaultDb, type DbClient } from '../../lib/db';
import type { Prisma } from '../../generated/prisma/client';

const includeImages = {
  images: { orderBy: { order: 'asc' } },
} as const satisfies Prisma.ProjectInclude;

const listOrder = [
  { featured: 'desc' },
  { order: 'asc' },
  { createdAt: 'desc' },
] as const satisfies Prisma.ProjectOrderByWithRelationInput[];

export type ProjectWithImages = Prisma.ProjectGetPayload<{ include: typeof includeImages }>;

export interface NewProjectImage {
  url: string;
  storageKey: string;
  alt: string;
  order: number;
  width: number;
  height: number;
}

export const projectRepository = {
  findMany: ({ publishedOnly }: { publishedOnly: boolean }, db: DbClient = defaultDb) =>
    db.project.findMany({
      where: publishedOnly ? { published: true } : undefined,
      include: includeImages,
      orderBy: [...listOrder],
    }),

  findById: (id: string, db: DbClient = defaultDb) =>
    db.project.findUnique({ where: { id }, include: includeImages }),

  findBySlug: (slug: string, db: DbClient = defaultDb) =>
    db.project.findUnique({ where: { slug }, include: includeImages }),

  async isSlugTaken(slug: string, excludeId?: string, db: DbClient = defaultDb) {
    const project = await db.project.findUnique({ where: { slug }, select: { id: true } });
    return project !== null && project.id !== excludeId;
  },

  create: (data: Prisma.ProjectCreateInput, db: DbClient = defaultDb) =>
    db.project.create({ data, include: includeImages }),

  update: (id: string, data: Prisma.ProjectUpdateInput, db: DbClient = defaultDb) =>
    db.project.update({ where: { id }, data, include: includeImages }),

  delete: (id: string, db: DbClient = defaultDb) => db.project.delete({ where: { id } }),

  addImages: (projectId: string, images: NewProjectImage[], db: DbClient = defaultDb) =>
    db.projectImage.createManyAndReturn({
      data: images.map((image) => ({ ...image, projectId })),
    }),

  deleteImage: (imageId: string, db: DbClient = defaultDb) =>
    db.projectImage.delete({ where: { id: imageId } }),
};
