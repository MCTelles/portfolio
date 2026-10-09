import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Router, type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { UPLOADS_PUBLIC_PATH, uploadsDirectory } from './lib/storage';
import { authenticate } from './middlewares/authenticate';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { requestContext } from './middlewares/requestContext';
import { auditAdminRoutes } from './modules/audit/audit.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { profileAdminRoutes, profilePublicRoutes } from './modules/profile/profile.routes';
import { projectAdminRoutes, projectPublicRoutes } from './modules/projects/projects.routes';
import { skillAdminRoutes, skillPublicRoutes } from './modules/skills/skills.routes';

function adminRoutes(): Router {
  const router = Router();
  router.use(authenticate);
  router.use('/projects', projectAdminRoutes());
  router.use('/skills', skillAdminRoutes());
  router.use('/profile', profileAdminRoutes());
  router.use('/audit-logs', auditAdminRoutes());
  return router;
}

function apiRoutes(): Router {
  const router = Router();

  router.get('/health', async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'up', uptime: Math.round(process.uptime()) });
  });

  router.use('/auth', authRoutes());
  router.use('/projects', projectPublicRoutes());
  router.use('/skills', skillPublicRoutes());
  router.use('/profile', profilePublicRoutes());
  router.use('/admin', adminRoutes());

  return router;
}

/** Monta o app sem abrir porta, o que permite testá-lo com supertest. */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY_HOPS);

  // As imagens podem ser exibidas por um frontend em outra origem (produção).
  app.use(requestContext);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Nomes de arquivo são UUIDs: o conteúdo de uma URL nunca muda, então pode ser cacheado para sempre.
  app.use(
    UPLOADS_PUBLIC_PATH,
    express.static(uploadsDirectory, { immutable: true, maxAge: '1y', index: false }),
  );

  app.use('/api', apiRoutes());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
