import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import styles from './Section.module.scss';

interface SectionProps {
  id: string;
  /** Número da "volta" da seção (01, 02…), exibido como nos letreiros de cronometragem. */
  number: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  /**
   * Painel lateral (desktop): ocupa a coluna da direita alinhado ao topo do cabeçalho,
   * em vez de começar abaixo do título. No mobile vem depois do conteúdo.
   */
  aside?: ReactNode;
  children: ReactNode;
}

export function Section({ id, number, eyebrow, title, lead, aside, children }: SectionProps) {
  const header = (
    <motion.header
      className={styles.header}
      initial={{ opacity: 0, x: -32 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className={styles.eyebrow}>
        <span className={styles.number}>{number}</span>
        {eyebrow}
      </span>
      <h2 id={`${id}-title`} className={styles.title}>
        {title}
      </h2>
      {lead && <p className={styles.lead}>{lead}</p>}
    </motion.header>
  );

  return (
    <section
      id={id}
      className={`${styles.section} ${aside ? styles.split : ''}`}
      aria-labelledby={`${id}-title`}
    >
      {aside ? (
        <>
          <div className={styles.main}>
            {header}
            {children}
          </div>
          <div className={styles.aside}>{aside}</div>
        </>
      ) : (
        <>
          {header}
          {children}
        </>
      )}
    </section>
  );
}
