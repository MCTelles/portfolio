import { z } from 'zod';

try {
  process.loadEnvFile();
} catch {
  // Sem .env: usa apenas as variáveis já presentes no ambiente (CI, produção).
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
  JWT_EXPIRES_IN_HOURS: z.coerce.number().positive().default(8),
  WEB_ORIGIN: z.url().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().min(1).default('uploads'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().max(50).default(5),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(`Variáveis de ambiente inválidas:\n${z.prettifyError(parsed.error)}`);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
};
