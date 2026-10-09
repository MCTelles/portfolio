import { z } from 'zod';
import { SKILL_CATEGORIES } from '../constants';

export const skillInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  category: z.enum(SKILL_CATEGORIES),
  level: z.number().int().min(1).max(5).nullable().optional(),
  order: z.number().int().min(0).max(9999).optional(),
});

export const skillUpdateSchema = skillInputSchema.partial();

export type SkillInput = z.infer<typeof skillInputSchema>;
export type SkillUpdateInput = z.infer<typeof skillUpdateSchema>;
