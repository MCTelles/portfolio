import { idParamSchema, projectInputSchema, projectUpdateSchema } from '@portfolio/shared';
import { Router } from 'express';
import { z } from 'zod';
import { uploadProjectImages } from '../../middlewares/upload';
import { validate } from '../../middlewares/validate';
import { projectController } from './projects.controller';

const imageParamsSchema = idParamSchema.extend({ imageId: z.uuid('ID inválido') });

export function projectPublicRoutes(): Router {
  const router = Router();
  router.get('/', projectController.listPublished);
  router.get('/:slug', projectController.getPublishedBySlug);
  return router;
}

export function projectAdminRoutes(): Router {
  const router = Router();
  const byId = validate({ params: idParamSchema });

  router.get('/', projectController.listAll);
  router.post('/', validate({ body: projectInputSchema }), projectController.create);
  router.get('/:id', byId, projectController.getById);
  router.patch(
    '/:id',
    validate({ params: idParamSchema, body: projectUpdateSchema }),
    projectController.update,
  );
  router.delete('/:id', byId, projectController.remove);

  router.post('/:id/images', byId, uploadProjectImages, projectController.addImages);
  router.delete(
    '/:id/images/:imageId',
    validate({ params: imageParamsSchema }),
    projectController.removeImage,
  );

  return router;
}
