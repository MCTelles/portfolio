import { loginSchema } from '@portfolio/shared';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { authController } from './auth.controller';

export function authRoutes(): Router {
  const router = Router();

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Muitas tentativas. Tente novamente em alguns minutos.',
      },
    },
  });

  router.post('/login', loginLimiter, validate({ body: loginSchema }), authController.login);
  router.post('/logout', authController.logout);
  router.get('/me', authenticate, authController.me);

  return router;
}
