import type { Request, Response } from 'express';
import { getActor } from '../audit/audit.types';
import { skillService } from './skills.service';

type IdParams = { id: string };

export const skillController = {
  async list(_req: Request, res: Response) {
    res.json(await skillService.list());
  },

  async create(req: Request, res: Response) {
    res.status(201).json(await skillService.create(req.body, getActor(req)));
  },

  async update(req: Request<IdParams>, res: Response) {
    res.json(await skillService.update(req.params.id, req.body, getActor(req)));
  },

  async remove(req: Request<IdParams>, res: Response) {
    await skillService.remove(req.params.id, getActor(req));
    res.status(204).end();
  },
};
