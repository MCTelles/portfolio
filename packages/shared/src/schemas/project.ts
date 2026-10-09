import { z } from 'zod';
import { SLUG_PATTERN } from '../constants';
import { optionalUrl } from './common';

// Sem `.default()` de propósito: o schema de update é `.partial()` e um default
// sobrescreveria campos que o cliente não enviou. Os defaults moram no banco.
export const projectInputSchema = z.object({
  title: z.string().trim().min(2, 'Mínimo de 2 caracteres').max(120),
  slug: z
    .string()
    .trim()
    .regex(SLUG_PATTERN, 'Use apenas letras minúsculas, números e hífens')
    .max(80)
    .optional()
    .or(z.literal('')),
  summary: z.string().trim().min(10, 'Mínimo de 10 caracteres').max(280),
  description: z.string().trim().min(10, 'Mínimo de 10 caracteres').max(10_000),
  stack: z
    .array(z.string().trim().min(1).max(40))
    .min(1, 'Informe ao menos uma tecnologia')
    .max(20),
  repoUrl: optionalUrl,
  deployUrl: optionalUrl,
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  order: z.number().int().min(0).max(9999).optional(),
});

export const projectUpdateSchema = projectInputSchema.partial();

export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
