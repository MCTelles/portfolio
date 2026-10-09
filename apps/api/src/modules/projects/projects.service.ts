import { MAX_PROJECT_IMAGES, type ProjectInput, type ProjectUpdateInput } from '@portfolio/shared';
import { AppError } from '../../errors/AppError';
import { transaction } from '../../lib/db';
import { reencodeImage, type ProcessedImage } from '../../lib/image-processor';
import { logger } from '../../lib/logger';
import { storage, type StoredFile } from '../../lib/storage';
import { detectImageType } from '../../utils/image-signature';
import { slugify } from '../../utils/slugify';
import { auditService } from '../audit/audit.service';
import type { Actor } from '../audit/audit.types';
import { diffSnapshots, hasChanges } from '../audit/diff';
import { toProjectDTO, toProjectSnapshot } from './projects.mapper';
import { projectRepository } from './projects.repository';

const FALLBACK_SLUG = 'projeto';

const projectNotFound = () => AppError.notFound('Projeto não encontrado', 'PROJECT_NOT_FOUND');

function toCreateData(input: ProjectInput, slug: string) {
  return {
    title: input.title,
    slug,
    summary: input.summary,
    description: input.description,
    stack: input.stack,
    repoUrl: input.repoUrl || null,
    deployUrl: input.deployUrl || null,
    featured: input.featured,
    published: input.published,
    order: input.order,
  };
}

/** String vazia vinda do formulário significa "remover o link". */
const toNullableUrl = (url: string | undefined) => (url === undefined ? undefined : url || null);

function toUpdateData(input: ProjectUpdateInput) {
  return {
    title: input.title,
    summary: input.summary,
    description: input.description,
    stack: input.stack,
    repoUrl: toNullableUrl(input.repoUrl),
    deployUrl: toNullableUrl(input.deployUrl),
    featured: input.featured,
    published: input.published,
    order: input.order,
  };
}

async function findOrThrow(id: string) {
  const project = await projectRepository.findById(id);
  if (!project) throw projectNotFound();
  return project;
}

/** Slug informado pelo admin precisa estar livre; slug derivado do título ganha sufixo (-2, -3…). */
async function resolveSlug({
  explicit,
  title,
  excludeId,
}: {
  explicit?: string;
  title: string;
  excludeId?: string;
}) {
  if (explicit) {
    if (await projectRepository.isSlugTaken(explicit, excludeId)) {
      throw AppError.conflict(`O slug "${explicit}" já está em uso`, 'SLUG_TAKEN');
    }
    return explicit;
  }

  const base = slugify(title) || FALLBACK_SLUG;
  let candidate = base;
  for (let suffix = 2; await projectRepository.isSlugTaken(candidate, excludeId); suffix++) {
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

/**
 * Triagem barata primeiro (quantidade e assinatura de todos os arquivos), re-encoding
 * depois: um lote com um arquivo inválido é recusado antes de gastar CPU com os outros.
 */
async function prepareImages(
  files: Express.Multer.File[],
  currentCount: number,
): Promise<ProcessedImage[]> {
  if (files.length === 0) {
    throw AppError.badRequest('Envie ao menos uma imagem no campo "images"', 'NO_FILES');
  }
  if (currentCount + files.length > MAX_PROJECT_IMAGES) {
    throw AppError.badRequest(
      `Cada projeto aceita no máximo ${MAX_PROJECT_IMAGES} imagens`,
      'TOO_MANY_IMAGES',
    );
  }

  const invalid = files.find((file) => !detectImageType(file.buffer));
  if (invalid) {
    throw AppError.badRequest(
      `"${invalid.originalname}" não é uma imagem válida`,
      'INVALID_FILE_TYPE',
    );
  }

  const processed: ProcessedImage[] = [];
  for (const file of files) processed.push(await reencodeImage(file.buffer));
  return processed;
}

async function removeStoredFiles(keys: string[]) {
  const results = await Promise.allSettled(keys.map((key) => storage.remove(key)));
  for (const result of results) {
    if (result.status === 'rejected') {
      logger.warn({ err: result.reason }, 'Falha ao remover arquivo do storage');
    }
  }
}

export const projectService = {
  async listPublished() {
    const projects = await projectRepository.findMany({ publishedOnly: true });
    return projects.map(toProjectDTO);
  },

  async getPublishedBySlug(slug: string) {
    const project = await projectRepository.findBySlug(slug);
    if (!project?.published) throw projectNotFound();
    return toProjectDTO(project);
  },

  async listAll() {
    const projects = await projectRepository.findMany({ publishedOnly: false });
    return projects.map(toProjectDTO);
  },

  async getById(id: string) {
    return toProjectDTO(await findOrThrow(id));
  },

  async create(input: ProjectInput, actor: Actor) {
    const slug = await resolveSlug({ explicit: input.slug, title: input.title });

    const project = await transaction(async (tx) => {
      const created = await projectRepository.create(toCreateData(input, slug), tx);
      await auditService.record(
        actor,
        {
          action: 'CREATE',
          entity: 'Project',
          entityId: created.id,
          entityLabel: created.title,
          changes: { after: toProjectSnapshot(created) },
        },
        tx,
      );
      return created;
    });

    return toProjectDTO(project);
  },

  async update(id: string, input: ProjectUpdateInput, actor: Actor) {
    const current = await findOrThrow(id);

    // Slug só muda se o admin pedir: renomear o título não quebra URLs já publicadas.
    const slug =
      input.slug === undefined
        ? undefined
        : await resolveSlug({
            explicit: input.slug,
            title: input.title ?? current.title,
            excludeId: id,
          });

    const project = await transaction(async (tx) => {
      const updated = await projectRepository.update(id, { ...toUpdateData(input), slug }, tx);
      const changes = diffSnapshots(toProjectSnapshot(current), toProjectSnapshot(updated));
      if (hasChanges(changes)) {
        await auditService.record(
          actor,
          {
            action: 'UPDATE',
            entity: 'Project',
            entityId: id,
            entityLabel: updated.title,
            changes,
          },
          tx,
        );
      }
      return updated;
    });

    return toProjectDTO(project);
  },

  async remove(id: string, actor: Actor) {
    const project = await findOrThrow(id);

    await transaction(async (tx) => {
      await projectRepository.delete(id, tx);
      await auditService.record(
        actor,
        {
          action: 'DELETE',
          entity: 'Project',
          entityId: id,
          entityLabel: project.title,
          changes: { before: { ...toProjectSnapshot(project), imageCount: project.images.length } },
        },
        tx,
      );
    });

    // Banco primeiro: se o disco falhar sobra só um arquivo órfão, nunca um registro quebrado.
    await removeStoredFiles(project.images.map((image) => image.storageKey));
  },

  async addImages(id: string, files: Express.Multer.File[], actor: Actor) {
    const project = await findOrThrow(id);
    const images = await prepareImages(files, project.images.length);

    const saved: Array<{ file: StoredFile; image: ProcessedImage }> = [];
    try {
      for (const image of images) saved.push({ file: await storage.save(image), image });

      await transaction(async (tx) => {
        const created = await projectRepository.addImages(
          id,
          saved.map(({ file, image }, index) => ({
            url: file.url,
            storageKey: file.key,
            alt: project.title,
            order: project.images.length + index,
            width: image.width,
            height: image.height,
          })),
          tx,
        );

        await auditService.record(
          actor,
          created.map((row) => ({
            action: 'CREATE' as const,
            entity: 'ProjectImage' as const,
            entityId: row.id,
            entityLabel: project.title,
            changes: {
              after: { projectId: id, url: row.url, width: row.width, height: row.height },
            },
          })),
          tx,
        );
      });
    } catch (error) {
      await removeStoredFiles(saved.map(({ file }) => file.key));
      throw error;
    }

    return this.getById(id);
  },

  async removeImage(projectId: string, imageId: string, actor: Actor) {
    const project = await findOrThrow(projectId);
    const image = project.images.find((candidate) => candidate.id === imageId);
    if (!image) throw AppError.notFound('Imagem não encontrada', 'IMAGE_NOT_FOUND');

    await transaction(async (tx) => {
      await projectRepository.deleteImage(image.id, tx);
      await auditService.record(
        actor,
        {
          action: 'DELETE',
          entity: 'ProjectImage',
          entityId: image.id,
          entityLabel: project.title,
          changes: { before: { projectId, url: image.url } },
        },
        tx,
      );
    });

    await removeStoredFiles([image.storageKey]);
    return this.getById(projectId);
  },
};
