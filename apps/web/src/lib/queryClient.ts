import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

/** Chave da sessão do admin; fica aqui para o tratamento global de 401 não depender do chunk do painel. */
export const SESSION_QUERY_KEY = ['admin', 'session'] as const;

/**
 * Qualquer 401 numa chamada autenticada (token expirado ou sessão revogada em outro
 * dispositivo) zera a sessão em cache, e o ProtectedRoute redireciona para o login.
 * Credenciais erradas no formulário de login não contam: ali o usuário só tenta de novo.
 */
function handleUnauthorized(error: unknown) {
  if (error instanceof ApiError && error.status === 401 && error.code !== 'INVALID_CREDENTIALS') {
    queryClient.setQueryData(SESSION_QUERY_KEY, null);
  }
}

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthorized }),
  mutationCache: new MutationCache({ onError: handleUnauthorized }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      // Erros 4xx são definitivos; só vale tentar de novo em falhas de rede/5xx.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 2,
    },
  },
});
