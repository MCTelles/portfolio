import { z } from 'zod';

try {
  process.loadEnvFile();
} catch {
  // Sem .env: usa apenas as variáveis já presentes no ambiente (CI, produção).
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3333),
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
    JWT_EXPIRES_IN_HOURS: z.coerce.number().positive().default(8),
    WEB_ORIGIN: z.url().default('http://localhost:5173'),
    UPLOAD_DIR: z.string().min(1).default('uploads'),
    MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().max(50).default(5),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    /**
     * Quantos proxies confiáveis há na frente da API. Em produção: Vercel (rewrite de /api)
     * + balanceador do Render = 2. Errar esse número faz req.ip (e o rate limit de login)
     * enxergar o IP de um proxy em vez do visitante.
     */
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(1),

    // Armazenamento das imagens: disco local (dev) ou bucket S3/R2 (produção)
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    S3_ENDPOINT: z.url().optional(),
    S3_REGION: z.string().default('auto'),
    S3_BUCKET: z.string().min(1).optional(),
    S3_ACCESS_KEY_ID: z.string().min(1).optional(),
    S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    S3_PUBLIC_URL: z.url().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.STORAGE_DRIVER !== 's3') return;
    for (const key of [
      'S3_ENDPOINT',
      'S3_BUCKET',
      'S3_ACCESS_KEY_ID',
      'S3_SECRET_ACCESS_KEY',
      'S3_PUBLIC_URL',
    ] as const) {
      if (!value[key])
        ctx.addIssue({ code: 'custom', path: [key], message: 'Obrigatório com STORAGE_DRIVER=s3' });
    }
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
