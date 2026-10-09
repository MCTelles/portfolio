import type { ProjectDTO } from '@portfolio/shared';
import { motion } from 'motion/react';
import { ExternalLinkIcon, GithubIcon } from '@/components/Icons';
import { Tag } from '@/components/Tag';
import { assetUrl } from '@/lib/api';
import styles from './Projects.module.scss';

interface ProjectCardProps {
  project: ProjectDTO;
  /** Posição no grid de largada (1 = pole). */
  position: number;
}

export function ProjectCard({ project, position }: ProjectCardProps) {
  const cover = project.images[0];
  const isPole = position === 1;

  return (
    <motion.article
      className={`${styles.card} ${project.featured ? styles.featured : ''}`}
      initial={{ opacity: 0, x: -48 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: ((position - 1) % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.cover}>
        {cover ? (
          <img
            src={assetUrl(cover.url)}
            alt={cover.alt || project.title}
            width={cover.width ?? undefined}
            height={cover.height ?? undefined}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            <span>{project.title}</span>
          </div>
        )}

        <span className={`${styles.position} ${isPole ? styles.pole : ''}`}>
          <span className="visually-hidden">Posição </span>P{position}
        </span>
        {isPole && <span className={styles.poleLabel}>Pole position</span>}
      </div>

      <div className={styles.body}>
        <h3 className={styles.cardTitle}>{project.title}</h3>
        <p className={styles.summary}>{project.summary}</p>

        <div className={styles.setup}>
          <span className={styles.setupLabel}>Setup</span>
          <ul className={styles.stack} aria-label="Tecnologias">
            {project.stack.map((tech) => (
              <li key={tech}>
                <Tag>{tech}</Tag>
              </li>
            ))}
          </ul>
        </div>

        {(project.repoUrl || project.deployUrl) && (
          <div className={styles.links}>
            {project.deployUrl && (
              <a href={project.deployUrl} target="_blank" rel="noreferrer">
                <ExternalLinkIcon /> Ver online
              </a>
            )}
            {project.repoUrl && (
              <a href={project.repoUrl} target="_blank" rel="noreferrer">
                <GithubIcon /> Código
              </a>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}
