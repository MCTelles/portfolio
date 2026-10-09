import { motion } from 'motion/react';
import { MapPinIcon } from '@/components/Icons';
import { Section } from '@/components/Section';
import { useProjects } from '@/features/projects/queries';
import { useSkills } from '@/features/skills/queries';
import styles from './About.module.scss';
import { useProfile } from './queries';

const EASE = [0.16, 1, 0.3, 1] as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

function DriverCard() {
  const { data: profile } = useProfile();
  const { data: projects } = useProjects();
  const { data: skills } = useSkills();

  if (!profile) return null;

  const stats = [
    { label: 'Projetos no grid', value: projects?.length },
    { label: 'Ferramentas no setup', value: skills?.length },
  ].filter((stat) => stat.value !== undefined);

  return (
    <motion.aside
      className={styles.card}
      initial={{ opacity: 0, x: 32 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
      aria-label="Ficha do piloto"
    >
      <div className={styles.cardStripe} aria-hidden="true" />

      <div className={styles.identity}>
        {profile.avatarUrl ? (
          <img
            className={styles.avatar}
            src={profile.avatarUrl}
            alt=""
            width={72}
            height={72}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className={styles.plate} aria-hidden="true">
            {initials(profile.name)}
          </span>
        )}
        <div>
          <p className={styles.role}>Piloto → Dev</p>
          <p className={styles.name}>{profile.name}</p>
          <p className={styles.headline}>{profile.headline}</p>
        </div>
      </div>

      {stats.length > 0 && (
        <dl className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{String(stat.value).padStart(2, '0')}</dd>
            </div>
          ))}
        </dl>
      )}

      {profile.location && (
        <p className={styles.location}>
          <MapPinIcon /> Base: {profile.location}
        </p>
      )}

      {profile.socials.length > 0 && (
        <div className={styles.radio}>
          <span className={styles.radioLabel}>Rádio</span>
          <ul className={styles.socials}>
            {profile.socials.map((social) => (
              <li key={social.url}>
                <a href={social.url} target="_blank" rel="noreferrer">
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.aside>
  );
}

export function AboutSection() {
  const { data: profile, isPending, isError } = useProfile();

  if (isError) return null;

  return (
    <Section
      id="sobre"
      number="02"
      eyebrow="Piloto → Dev"
      title="Da pista para o código"
      aside={isPending ? <div className={styles.skeleton} aria-busy="true" /> : <DriverCard />}
    >
      {!isPending && (
        <motion.div
          className={styles.bio}
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          {profile.bio.split(/\n{2,}/).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </motion.div>
      )}
    </Section>
  );
}
