import type { SocialLink } from '../schemas/profile';
import type { AuditAction, SkillCategory } from '../constants';

/** Formatos de resposta da API (datas serializadas como ISO string). */

export interface AdminDTO {
  id: string;
  email: string;
  name: string;
}

export interface ProjectImageDTO {
  id: string;
  url: string;
  alt: string;
  order: number;
  width: number | null;
  height: number | null;
}

export interface ProjectDTO {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  stack: string[];
  repoUrl: string | null;
  deployUrl: string | null;
  featured: boolean;
  published: boolean;
  order: number;
  images: ProjectImageDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface SkillDTO {
  id: string;
  name: string;
  category: SkillCategory;
  level: number | null;
  order: number;
}

export interface ProfileDTO {
  name: string;
  headline: string;
  bio: string;
  location: string | null;
  avatarUrl: string | null;
  socials: SocialLink[];
}

export interface AuditLogDTO {
  id: string;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  entityLabel: string | null;
  /** CREATE: `{ after }` · UPDATE: `{ campo: { from, to } }` · DELETE: `{ before }` */
  changes: unknown;
  actorEmail: string | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
}
