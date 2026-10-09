import { idParamSchema, skillInputSchema, skillUpdateSchema } from '@portfolio/shared';
import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { skillController } from './skills.controller';

export function skillPublicRoutes(): Router {
  const router = Router();
  router.get('/', skillController.list);
  return router;
}

export function skillAdminRoutes(): Router {
  const router = Router();
  router.get('/', skillController.list);
  router.post('/', validate({ body: skillInputSchema }), skillController.create);
  router.patch(
    '/:id',
    validate({ params: idParamSchema, body: skillUpdateSchema }),
    skillController.update,
  );
  router.delete('/:id', validate({ params: idParamSchema }), skillController.remove);
  return router;
}
