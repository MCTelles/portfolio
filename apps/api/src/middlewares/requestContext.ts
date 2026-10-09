import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { logger } from '../lib/logger';

const VALID_REQUEST_ID = /^[\w-]{8,64}$/;

/**
 * Atribui um ID a cada requisição (aceita `X-Request-Id` de um proxy confiável)
 * e registra método, rota, status, duração e o admin autenticado ao final.
 * O mesmo ID vai para a trilha de auditoria, ligando log técnico e ação de negócio.
 */
export const requestContext: RequestHandler = (req, res, next) => {
  const incoming = req.get('x-request-id');
  req.requestId = incoming && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();
  res.setHeader('X-Request-Id', req.requestId);

  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    logger[level](
      {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        status,
        durationMs: Math.round(Number(process.hrtime.bigint() - startedAt) / 1e6),
        ip: req.ip,
        adminId: req.admin?.sub,
      },
      `${req.method} ${req.originalUrl} ${status}`,
    );
  });

  next();
};
