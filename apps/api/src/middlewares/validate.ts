import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
}

/**
 * Valida e normaliza body/params com Zod. Em caso de falha o ZodError sobe
 * para o errorHandler, que responde 400 com os detalhes por campo.
 */
export const validate =
  ({ body, params }: ValidationSchemas): RequestHandler =>
  (req, _res, next) => {
    if (params) req.params = params.parse(req.params) as typeof req.params;
    if (body) req.body = body.parse(req.body);
    next();
  };
