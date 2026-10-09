import { profileInputSchema } from '@portfolio/shared';
import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { profileController } from './profile.controller';

export function profilePublicRoutes(): Router {
  const router = Router();
  router.get('/', profileController.get);
  return router;
}

export function profileAdminRoutes(): Router {
  const router = Router();
  router.get('/', profileController.get);
  router.put('/', validate({ body: profileInputSchema }), profileController.save);
  return router;
}
