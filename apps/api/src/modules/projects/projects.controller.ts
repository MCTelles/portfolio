import type { Request, Response } from 'express';
import { getActor } from '../audit/audit.types';
import { projectService } from './projects.service';

type IdParams = { id: string };
type ImageParams = { id: string; imageId: string };

export const projectController = {
  async listPublished(_req: Request, res: Response) {
    res.json(await projectService.listPublished());
  },

  async getPublishedBySlug(req: Request<{ slug: string }>, res: Response) {
    res.json(await projectService.getPublishedBySlug(req.params.slug));
  },

  async listAll(_req: Request, res: Response) {
    res.json(await projectService.listAll());
  },

  async getById(req: Request<IdParams>, res: Response) {
    res.json(await projectService.getById(req.params.id));
  },

  async create(req: Request, res: Response) {
    res.status(201).json(await projectService.create(req.body, getActor(req)));
  },

  async update(req: Request<IdParams>, res: Response) {
    res.json(await projectService.update(req.params.id, req.body, getActor(req)));
  },

  async remove(req: Request<IdParams>, res: Response) {
    await projectService.remove(req.params.id, getActor(req));
    res.status(204).end();
  },

  async addImages(req: Request<IdParams>, res: Response) {
    const files = Array.isArray(req.files) ? req.files : [];
    res.status(201).json(await projectService.addImages(req.params.id, files, getActor(req)));
  },

  async removeImage(req: Request<ImageParams>, res: Response) {
    res.json(await projectService.removeImage(req.params.id, req.params.imageId, getActor(req)));
  },
};
