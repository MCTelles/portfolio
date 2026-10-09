import { z } from 'zod';
import { optionalUrl } from './common';

export const socialLinkSchema = z.object({
  label: z.string().trim().min(1).max(40),
  url: z.url({ protocol: /^(https?|mailto)$/ }),
});

export const profileInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  headline: z.string().trim().min(2).max(160),
  bio: z.string().trim().min(10).max(5_000),
  location: z.string().trim().max(120).optional().or(z.literal('')),
  avatarUrl: optionalUrl,
  socials: z.array(socialLinkSchema).max(10),
});

export type SocialLink = z.infer<typeof socialLinkSchema>;
export type ProfileInput = z.infer<typeof profileInputSchema>;
