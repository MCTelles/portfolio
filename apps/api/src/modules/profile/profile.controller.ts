import type { Request, Response } from 'express';
import { getActor } from '../audit/audit.types';
import { profileService } from './profile.service';

export const profileController = {
  async get(_req: Request, res: Response) {
    res.json(await profileService.get());
  },

  async save(req: Request, res: Response) {
    res.json(await profileService.save(req.body, getActor(req)));
  },
};
