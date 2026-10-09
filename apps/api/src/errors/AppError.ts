export interface ErrorDetail {
  path: string;
  message: string;
}

/** Erro de domínio com status HTTP. Qualquer outro erro vira 500 no errorHandler. */
export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly code: string,
    readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, code = 'BAD_REQUEST', details?: ErrorDetail[]) {
    return new AppError(400, message, code, details);
  }

  static unauthorized(message = 'Não autenticado', code = 'UNAUTHORIZED') {
    return new AppError(401, message, code);
  }

  static notFound(message = 'Recurso não encontrado', code = 'NOT_FOUND') {
    return new AppError(404, message, code);
  }

  static conflict(message: string, code = 'CONFLICT') {
    return new AppError(409, message, code);
  }
}
