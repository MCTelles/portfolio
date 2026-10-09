import type { ApiErrorBody } from '@portfolio/shared';

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: NonNullable<ApiErrorBody['error']['details']> = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { json?: unknown; body?: BodyInit };

async function request<T>(
  path: string,
  { json, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_ORIGIN}/api${path}`, {
    credentials: 'include',
    ...init,
    headers: json === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
    body: json === undefined ? init.body : JSON.stringify(json),
  });

  if (response.status === 204) return undefined as T;

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (data as ApiErrorBody | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN',
      error?.message ?? 'Não foi possível completar a requisição',
      error?.details,
    );
  }

  return data as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, json?: unknown) => request<T>(path, { method: 'POST', json }),
  patch: <T>(path: string, json: unknown) => request<T>(path, { method: 'PATCH', json }),
  put: <T>(path: string, json: unknown) => request<T>(path, { method: 'PUT', json }),
  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, body: FormData) => request<T>(path, { method: 'POST', body }),
};

/** URLs de upload são relativas (/uploads/...); em produção podem precisar do domínio da API. */
export const assetUrl = (path: string) => (path.startsWith('http') ? path : `${API_ORIGIN}${path}`);
