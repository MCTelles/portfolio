import type { AuditAction, AuditEntity, AuditLogDTO } from '@portfolio/shared';

export const ENTITY_FILTER_LABELS: Record<AuditEntity, string> = {
  Project: 'Projetos',
  ProjectImage: 'Imagens',
  Skill: 'Habilidades',
  Profile: 'Perfil',
  Session: 'Sessões',
};

export const ACTION_BADGES: Record<AuditAction, string> = {
  CREATE: 'Criação',
  UPDATE: 'Alteração',
  DELETE: 'Exclusão',
  LOGIN: 'Login',
  LOGIN_FAILED: 'Login falhou',
  LOGOUT: 'Logout',
};

const FIELD_LABELS: Record<string, string> = {
  title: 'Título',
  slug: 'Slug',
  summary: 'Resumo',
  description: 'Descrição',
  stack: 'Stack',
  repoUrl: 'Repositório',
  deployUrl: 'Deploy',
  featured: 'Destaque',
  published: 'Publicado',
  order: 'Ordem',
  name: 'Nome',
  category: 'Categoria',
  level: 'Nível',
  headline: 'Headline',
  bio: 'Bio',
  location: 'Localização',
  avatarUrl: 'Avatar',
  socials: 'Links',
  imageCount: 'Imagens',
  url: 'URL',
  width: 'Largura',
  height: 'Altura',
  projectId: 'Projeto',
};

export const fieldLabel = (field: string) => FIELD_LABELS[field] ?? field;

/** Verbo + alvo da frase "<quem> <verbo> <alvo>". */
export function describeEvent(log: AuditLogDTO): { verb: string; target: string | null } {
  const label = log.entityLabel ? `“${log.entityLabel}”` : null;

  if (log.entity === 'Session') {
    if (log.action === 'LOGIN') return { verb: 'entrou no painel', target: null };
    if (log.action === 'LOGOUT') return { verb: 'saiu e encerrou todas as sessões', target: null };
    return { verb: 'teve uma tentativa de login recusada', target: null };
  }

  if (log.entity === 'ProjectImage') {
    const verb = log.action === 'DELETE' ? 'removeu uma imagem de' : 'adicionou uma imagem em';
    return { verb, target: label };
  }

  const verbs: Partial<Record<AuditAction, string>> = {
    CREATE: 'criou',
    UPDATE: 'alterou',
    DELETE: 'excluiu',
  };
  const nouns: Partial<Record<string, string>> = {
    Project: 'o projeto',
    Skill: 'a habilidade',
    Profile: 'o perfil',
  };
  return {
    verb: `${verbs[log.action] ?? log.action.toLowerCase()} ${nouns[log.entity] ?? log.entity}`,
    target: log.entity === 'Profile' ? null : label,
  };
}

export interface FieldChangeRow {
  field: string;
  from: unknown;
  to: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Normaliza os três formatos de `changes` (UPDATE, CREATE `{after}`, DELETE `{before}`) em linhas. */
export function toChangeRows(log: AuditLogDTO): FieldChangeRow[] {
  const { changes } = log;
  if (!isRecord(changes)) return [];

  if (log.action === 'UPDATE') {
    return Object.entries(changes).map(([field, change]) => ({
      field,
      from: isRecord(change) ? change.from : undefined,
      to: isRecord(change) ? change.to : undefined,
    }));
  }

  const snapshot = isRecord(changes.after)
    ? changes.after
    : isRecord(changes.before)
      ? changes.before
      : {};
  const isCreate = isRecord(changes.after);
  return Object.entries(snapshot).map(([field, value]) => ({
    field,
    from: isCreate ? undefined : value,
    to: isCreate ? value : undefined,
  }));
}

const MAX_VALUE_LENGTH = 140;

export function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) {
    return value
      .map((item) => (isRecord(item) && 'label' in item ? String(item.label) : formatValue(item)))
      .join(', ');
  }
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH)}…` : text;
}

const relativeFormatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
const absoluteFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

export function formatRelative(iso: string, now = Date.now()): string {
  const seconds = (new Date(iso).getTime() - now) / 1000;
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size)
      return relativeFormatter.format(Math.round(seconds / size), unit);
  }
  return 'agora mesmo';
}

export const formatAbsolute = (iso: string) => absoluteFormatter.format(new Date(iso));
