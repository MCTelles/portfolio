import os from 'node:os';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

try {
  process.loadEnvFile();
} catch {
  // Sem .env: usa as variáveis do ambiente (CI).
}

/** Testes usam um banco próprio (`<nome>_test`) e nunca tocam os dados de desenvolvimento. */
function toTestDatabaseUrl(url: string | undefined): string {
  if (!url) throw new Error('Defina DATABASE_URL ou TEST_DATABASE_URL para rodar os testes');
  const parsed = new URL(url);
  const name = parsed.pathname.slice(1);
  parsed.pathname = `/${name.endsWith('_test') ? name : `${name}_test`}`;
  return parsed.toString();
}

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? toTestDatabaseUrl(process.env.DATABASE_URL);
// Lido pelo globalSetup, que roda neste mesmo processo.
process.env.TEST_DATABASE_URL = testDatabaseUrl;

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/global-setup.ts'],
    // Os arquivos compartilham o banco de teste: rodar em série evita interferência.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl,
      UPLOAD_DIR: path.join(os.tmpdir(), 'portfolio-test-uploads'),
    },
  },
});
