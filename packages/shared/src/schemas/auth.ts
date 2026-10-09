import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido').trim().toLowerCase(),
  password: z.string().min(1, 'Informe a senha').max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
