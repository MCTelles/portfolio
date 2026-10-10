import type { SkillDTO } from '@portfolio/shared';
import { motion } from 'motion/react';
import type { CSSProperties } from 'react';
import { Section } from '@/components/Section';
import {
  groupByCategory,
  LEVEL_TIER_LABELS,
  levelTier,
  MAX_SKILL_LEVEL,
  SKILL_CATEGORY_COLORS,
  SKILL_CATEGORY_LABELS,
  timingCodes,
  type LevelTier,
} from './categories';
import { useSkills } from './queries';
import styles from './Skills.module.scss';
import { useRevealOffset } from '@/hooks/useRevealOffset';

const LEGEND: LevelTier[] = ['purple', 'green', 'yellow', 'white'];

function LevelMeter({ level }: { level: number | null }) {
  const tier = levelTier(level);
  const label = level
    ? `Nível ${level} de ${MAX_SKILL_LEVEL}: ${LEVEL_TIER_LABELS[tier]}`
    : LEVEL_TIER_LABELS[tier];
  return (
    <span className={styles.meter} data-tier={tier} role="img" aria-label={label}>
      {Array.from({ length: MAX_SKILL_LEVEL }, (_, index) => (
        <span key={index} className={index < (level ?? 0) ? styles.on : undefined} />
      ))}
    </span>
  );
}

function TimingRow({ skill, position, code }: { skill: SkillDTO; position: number; code: string }) {
  return (
    <li className={styles.row}>
      <span className={styles.position}>{position}</span>
      <span className={styles.code}>{code}</span>
      <span className={styles.name}>{skill.name}</span>
      <LevelMeter level={skill.level} />
    </li>
  );
}

export function SkillsSection() {
  const reveal = useRevealOffset(-32);
  const { data: skills, isPending, isError } = useSkills();

  if (isError) return null;

  const groups = groupByCategory(skills ?? []);
  // Siglas únicas no grid inteiro, na ordem em que aparecem
  const ordered = groups.flatMap((group) => group.skills);
  const codes = new Map(
    timingCodes(ordered.map((skill) => skill.name)).map((code, i) => [ordered[i]?.id, code]),
  );

  return (
    <Section
      id="habilidades"
      number="03"
      eyebrow="Torre de cronometragem"
      title="Stack que uso no dia a dia"
      lead="Cada ferramenta com o seu tempo de pista: as cores seguem a cronometragem da F1."
    >
      <ul className={styles.legend} aria-label="Legenda de níveis">
        {LEGEND.map((tier) => (
          <li key={tier} data-tier={tier}>
            {LEVEL_TIER_LABELS[tier]}
          </li>
        ))}
      </ul>

      <div className={styles.grid} aria-busy={isPending}>
        {groups.map((group, index) => (
          <motion.section
            key={group.category}
            className={styles.tower}
            style={{ '--team': SKILL_CATEGORY_COLORS[group.category] } as CSSProperties}
            initial={{ opacity: 0, ...reveal }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
            aria-label={SKILL_CATEGORY_LABELS[group.category]}
          >
            <header className={styles.towerHeader}>
              <h3>{SKILL_CATEGORY_LABELS[group.category]}</h3>
              <span>{group.skills.length}</span>
            </header>
            <ol className={styles.list}>
              {group.skills.map((skill, position) => (
                <TimingRow
                  key={skill.id}
                  skill={skill}
                  position={position + 1}
                  code={codes.get(skill.id) ?? ''}
                />
              ))}
            </ol>
          </motion.section>
        ))}
      </div>
    </Section>
  );
}
