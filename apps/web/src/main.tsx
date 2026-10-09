import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/titillium-web/700.css';
import '@fontsource/titillium-web/700-italic.css';
import './styles/global.scss';

import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { queryClient } from './lib/queryClient';
import { router } from './router';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* Respeita "reduzir movimento" do sistema em todas as animações do motion */}
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
