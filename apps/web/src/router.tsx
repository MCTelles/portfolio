import { createBrowserRouter } from 'react-router';
import { PageLoader } from '@/components/PageLoader';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  {
    // O painel admin (formulários, react-hook-form…) vira um chunk separado,
    // então visitantes do portfólio nunca baixam esse código.
    path: '/admin/*',
    HydrateFallback: PageLoader,
    lazy: async () => ({ Component: (await import('@/features/admin/AdminApp')).AdminApp }),
  },
  { path: '*', element: <NotFoundPage /> },
]);
