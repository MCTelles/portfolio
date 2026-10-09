import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/server.ts'],
  format: 'esm',
  platform: 'node',
  target: 'node22',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // O pacote compartilhado é publicado como TypeScript-fonte, então precisa entrar no bundle.
  deps: { alwaysBundle: ['@portfolio/shared'] },
});
