import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';
import { logger } from '../lib/logger';
import { Prisma } from '../generated/prisma/client';

const MULTER_MESSAGES: Partial<Record<multer.ErrorCode, string>> = {
  LIMIT_FILE_SIZE: `Arquivo maior que ${env.MAX_UPLOAD_SIZE_MB}MB`,
  LIMIT_FILE_COUNT: 'Arquivos demais no mesmo envio',
  LIMIT_UNEXPECTED_FILE: 'Campo de arquivo inesperado (use "images")',
};

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return AppError.badRequest('Dados inválidos', 'VALIDATION_ERROR', details);
  }

  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return new AppError(status, MULTER_MESSAGES[error.code] ?? error.message, error.code);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') return AppError.notFound();
    if (error.code === 'P2002')
      return AppError.conflict('Já existe um registro com esse valor único');
  }

  // JSON malformado no body (lançado pelo express.json)
  if (error instanceof SyntaxError && 'type' in error && error.type === 'entity.parse.failed') {
    return AppError.badRequest('JSON inválido', 'INVALID_JSON');
  }

  return new AppError(500, 'Erro interno do servidor', 'INTERNAL_ERROR');
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const appError = toAppError(error);

  if (appError.statusCode >= 500)
    logger.error({ err: error, requestId: req.requestId }, 'Erro não tratado');

  res.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details && { details: appError.details }),
      ...(!env.isProduction &&
        appError.statusCode >= 500 &&
        error instanceof Error && { stack: error.stack }),
    },
  });
};

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Rota não encontrada: ${req.method} ${req.path}`, 'ROUTE_NOT_FOUND'));
};
