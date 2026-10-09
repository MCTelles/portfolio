import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@/lib/api';

/**
 * Leva os erros de validação devolvidos pela API (details[].path) para os campos
 * do formulário. Retorna a mensagem geral para exibir quando não há campo associado.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): string {
  if (!(error instanceof ApiError)) return 'Erro inesperado. Tente novamente.';

  // O path da API ("socials.0.url") já está no formato de caminho do react-hook-form.
  for (const { path, message } of error.details) {
    if (path) setError(path as Path<T>, { type: 'server', message });
  }

  if (error.code === 'SLUG_TAKEN')
    setError('slug' as Path<T>, { type: 'server', message: error.message });

  return error.message;
}

/** Para `<input type="number">` e `<select>`: campo vazio vira `undefined` em vez de NaN/0. */
export const toOptionalNumber = (value: unknown) =>
  value === '' || value === null || value === undefined ? undefined : Number(value);

/** Para campos que aceitam "sem valor" explícito (ex.: nível da skill). */
export const toNullableNumber = (value: unknown) =>
  value === '' || value === null || value === undefined ? null : Number(value);
