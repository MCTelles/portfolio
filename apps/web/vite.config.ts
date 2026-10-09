import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_DEV_API_PROXY ?? 'http://localhost:3333';

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // Em dev, front e API compartilham a mesma origem: o cookie de sessão funciona sem CORS.
      proxy: {
        '/api': apiTarget,
        '/uploads': apiTarget,
      },
    },
    build: {
      target: 'es2022',
      // O chunk do three.js é carregado sob demanda (React.lazy), não bloqueia o primeiro paint.
      chunkSizeWarningLimit: 1200,
    },
  };
});
