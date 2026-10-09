import { SKILL_CATEGORIES, type SkillCategory, type SkillDTO } from '@portfolio/shared';

export const MAX_SKILL_LEVEL = 5;

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  MOBILE: 'Mobile',
  DEVOPS: 'DevOps & Cloud',
  TOOLS: 'Ferramentas',
};

/** Agrupa na ordem canônica das categorias, omitindo grupos vazios. */
export function groupByCategory(skills: SkillDTO[]) {
  return SKILL_CATEGORIES.map((category) => ({
    category,
    skills: skills.filter((skill) => skill.category === category),
  })).filter((group) => group.skills.length > 0);
}

/** Cor de "equipe" de cada categoria na torre de cronometragem. */
export const SKILL_CATEGORY_COLORS: Record<SkillCategory, string> = {
  FRONTEND: '#3d7bff',
  BACKEND: '#27e0c3',
  MOBILE: '#ff8a1f',
  DEVOPS: '#e10600',
  TOOLS: '#2fbf71',
};

export type LevelTier = 'purple' | 'green' | 'yellow' | 'white';

/** Nível vira cor de cronometragem: roxo = domínio, verde = avançado, amarelo = intermediário. */
export function levelTier(level: number | null): LevelTier {
  if (level === null) return 'white';
  if (level >= 5) return 'purple';
  if (level === 4) return 'green';
  if (level === 3) return 'yellow';
  return 'white';
}

export const LEVEL_TIER_LABELS: Record<LevelTier, string> = {
  purple: 'Domínio',
  green: 'Avançado',
  yellow: 'Intermediário',
  white: 'Em evolução',
};

const lettersOf = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase();

/** Candidatas a sigla, da mais natural para a menos: "React Native" -> REA, RNA, RNT… */
function codeCandidates(name: string): string[] {
  const words = name
    .split(/[\s/.-]+/)
    .map(lettersOf)
    .filter(Boolean);
  const all = lettersOf(name);
  const initials = words.map((word) => word[0]).join('');
  const last = words.at(-1) ?? '';

  const candidates = [all.slice(0, 3)];
  if (words.length > 1) {
    candidates.push(
      (initials + last.slice(1)).slice(0, 3),
      (initials.slice(0, 2) + last.slice(-1)).slice(0, 3),
    );
  }
  for (let i = 2; i < all.length; i++) candidates.push(all.slice(0, 2) + all[i]);
  return candidates.filter((code) => code.length === 3);
}

/**
 * Siglas de 3 letras únicas, como na torre da TV ("TypeScript" -> TYP). Quando duas
 * colidem (React e React Native), a segunda usa as iniciais: REA e RNA.
 */
export function timingCodes(names: readonly string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    const code =
      codeCandidates(name).find((candidate) => !used.has(candidate)) ??
      `${lettersOf(name).slice(0, 2)}${used.size % 10}`;
    used.add(code);
    return code;
  });
}
