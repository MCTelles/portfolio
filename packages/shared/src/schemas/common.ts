import { z } from 'zod';

/** URL http(s) opcional. String vazia é aceita (campo de formulário em branco) e vira `null` na API. */
export const optionalUrl = z
  .union([z.url({ protocol: /^https?$/, error: 'Informe uma URL http(s) válida' }), z.literal('')])
  .optional();

export const idParamSchema = z.object({ id: z.uuid('ID inválido') });
