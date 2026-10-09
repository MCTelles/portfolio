import type { SkillDTO } from '@portfolio/shared';
import { useState } from 'react';
import { PageLoader } from '@/components/PageLoader';
import {
  groupByCategory,
  MAX_SKILL_LEVEL,
  SKILL_CATEGORY_LABELS,
} from '@/features/skills/categories';
import { useAdminSkills, useCreateSkill, useDeleteSkill, useUpdateSkill } from '../api';
import { SkillForm } from '../components/SkillForm';
import styles from '../admin.module.scss';

function LevelDots({ level }: { level: number | null }) {
  if (!level) return <span className={styles.muted}>Sem nível</span>;
  return (
    <span
      className={styles.levelDots}
      role="img"
      aria-label={`Nível ${level} de ${MAX_SKILL_LEVEL}`}
    >
      {Array.from({ length: MAX_SKILL_LEVEL }, (_, index) => (
        <span key={index} className={index < level ? styles.on : undefined} />
      ))}
    </span>
  );
}

function SkillRow({ skill }: { skill: SkillDTO }) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateSkill();
  const remove = useDeleteSkill();

  if (editing) {
    return (
      <li className={styles.skillRowEditing}>
        <SkillForm
          skill={skill}
          submitLabel="Salvar"
          onSubmit={async (input) => {
            await update.mutateAsync({ id: skill.id, input });
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  const handleDelete = () => {
    if (!window.confirm(`Excluir "${skill.name}"?`)) return;
    remove.mutate(skill.id, { onError: (error) => window.alert(error.message) });
  };

  return (
    <li className={styles.skillRow}>
      <span className={styles.skillName}>{skill.name}</span>
      <LevelDots level={skill.level} />
      <span className={`${styles.muted} ${styles.hideMobile}`}>Ordem {skill.order}</span>
      <span className={styles.actions}>
        <button type="button" onClick={() => setEditing(true)}>
          Editar
        </button>
        <button
          type="button"
          className={styles.dangerLink}
          onClick={handleDelete}
          disabled={remove.isPending}
        >
          Excluir
        </button>
      </span>
    </li>
  );
}

export function SkillsPage() {
  const { data: skills, isPending, isError } = useAdminSkills();
  const create = useCreateSkill();

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1>Habilidades</h1>
          <p className={styles.muted}>
            Aparecem na seção “Habilidades” do site, agrupadas por categoria e ordenadas pelo campo
            ordem.
          </p>
        </div>
      </div>

      <div className={styles.stackLayout}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Nova habilidade</h2>
          <SkillForm submitLabel="Adicionar" onSubmit={create.mutateAsync} resetAfterSubmit />
        </section>

        {isPending && <PageLoader />}
        {isError && <p className={styles.error}>Não foi possível carregar as habilidades.</p>}
        {skills?.length === 0 && (
          <p className={styles.muted}>Nenhuma habilidade cadastrada ainda.</p>
        )}

        {groupByCategory(skills ?? []).map((group) => (
          <section key={group.category} className={styles.card}>
            <h2 className={styles.cardTitle}>
              {SKILL_CATEGORY_LABELS[group.category]}
              <span className={styles.count}>{group.skills.length}</span>
            </h2>
            <ul className={styles.skillList}>
              {group.skills.map((skill) => (
                <SkillRow key={skill.id} skill={skill} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
