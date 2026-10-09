// Constantes sem dependência de zod: o site público importa daqui sem levar
// a biblioteca de validação para o bundle (ela só é necessária no painel e na API).

export const MAX_PROJECT_IMAGES = 6;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SKILL_CATEGORIES = ['FRONTEND', 'BACKEND', 'MOBILE', 'DEVOPS', 'TOOLS'] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export const AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGIN_FAILED',
  'LOGOUT',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ENTITIES = ['Project', 'ProjectImage', 'Skill', 'Profile', 'Session'] as const;
export type AuditEntity = (typeof AUDIT_ENTITIES)[number];
