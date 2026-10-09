import pino from 'pino';
import { env } from '../config/env';

/**
 * Logs estruturados (JSON) para agregadores em produção; legíveis no terminal em dev.
 * Cabeçalhos com credenciais e campos de senha nunca chegam ao log.
 */
export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  redact: {
    paths: ['headers.authorization', 'headers.cookie', '*.password', '*.passwordHash'],
    censor: '[REDACTED]',
  },
  ...(!env.isProduction && {
    transport: {
      target: 'pino-pretty',
      options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
    },
  }),
});
