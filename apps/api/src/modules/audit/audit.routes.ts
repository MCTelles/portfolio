import { AUDIT_ENTITIES } from '@portfolio/shared';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { auditService } from './audit.service';

const listQuerySchema = z.object({
  entity: z.enum(AUDIT_ENTITIES).optional(),
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export function auditAdminRoutes(): Router {
  const router = Router();

  // Express 5 não permite reatribuir req.query; o parse acontece aqui mesmo.
  router.get('/', async (req: Request, res: Response) => {
    res.json(await auditService.list(listQuerySchema.parse(req.query)));
  });

  return router;
}
