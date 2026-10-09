import type { ProjectDTO } from '@portfolio/shared';
import type { Project } from '../../generated/prisma/client';
import type { Snapshot } from '../audit/diff';
import type { ProjectWithImages } from './projects.repository';

/** Converte a entidade do banco no contrato público (sem `storageKey`, datas em ISO). */
export function toProjectDTO(project: ProjectWithImages): ProjectDTO {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    description: project.description,
    stack: project.stack,
    repoUrl: project.repoUrl,
    deployUrl: project.deployUrl,
    featured: project.featured,
    published: project.published,
    order: project.order,
    images: project.images.map(({ id, url, alt, order, width, height }) => ({
      id,
      url,
      alt,
      order,
      width,
      height,
    })),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

/** Campos editáveis registrados na trilha de auditoria (sem timestamps e relações). */
export function toProjectSnapshot(project: Project): Snapshot {
  return {
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    description: project.description,
    stack: project.stack,
    repoUrl: project.repoUrl,
    deployUrl: project.deployUrl,
    featured: project.featured,
    published: project.published,
    order: project.order,
  };
}
