import { defineConfig } from 'prisma/config';

try {
  process.loadEnvFile();
} catch {
  // Sem .env: usa apenas as variáveis já presentes no ambiente (CI, produção).
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
