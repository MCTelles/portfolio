import { zodResolver } from '@hookform/resolvers/zod';
import { SKILL_CATEGORIES, skillInputSchema, type SkillDTO } from '@portfolio/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components/Button';
import { MAX_SKILL_LEVEL, SKILL_CATEGORY_LABELS } from '@/features/skills/categories';
import { ApiError } from '@/lib/api';
import { applyServerErrors, toNullableNumber, toOptionalNumber } from '../formErrors';
import { Field } from './Field';
import styles from '../admin.module.scss';

type SkillFormInput = z.input<typeof skillInputSchema>;
export type SkillFormOutput = z.output<typeof skillInputSchema>;

const LEVELS = Array.from({ length: MAX_SKILL_LEVEL }, (_, index) => index + 1);

const toFormValues = (skill?: SkillDTO): SkillFormInput => ({
  name: skill?.name ?? '',
  category: skill?.category ?? 'FRONTEND',
  level: skill?.level ?? null,
  order: skill?.order ?? 0,
});

interface SkillFormProps {
  skill?: SkillDTO;
  submitLabel: string;
  onSubmit: (input: SkillFormOutput) => Promise<unknown>;
  onCancel?: () => void;
  /** Modo cadastro: após salvar limpa o nome e mantém a categoria, para adicionar várias em sequência. */
  resetAfterSubmit?: boolean;
}

export function SkillForm({
  skill,
  submitLabel,
  onSubmit,
  onCancel,
  resetAfterSubmit,
}: SkillFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<SkillFormInput, unknown, SkillFormOutput>({
    resolver: zodResolver(skillInputSchema),
    defaultValues: toFormValues(skill),
  });

  const submit = handleSubmit(async (input) => {
    setFormError(null);
    try {
      await onSubmit(input);
      if (resetAfterSubmit) {
        reset({ ...toFormValues(), category: input.category, order: (input.order ?? 0) + 1 });
        setFocus('name');
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('name', { type: 'server', message: 'Já existe uma habilidade com esse nome' });
        return;
      }
      setFormError(applyServerErrors(error, setError));
    }
  });

  return (
    <form className={styles.inlineForm} onSubmit={submit} noValidate>
      <Field label="Nome" error={errors.name?.message}>
        <input {...register('name')} placeholder="Ex.: TypeScript" autoFocus={Boolean(skill)} />
      </Field>

      <Field label="Categoria" error={errors.category?.message}>
        <select {...register('category')}>
          {SKILL_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {SKILL_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Nível" error={errors.level?.message}>
        <select {...register('level', { setValueAs: toNullableNumber })}>
          <option value="">Sem nível</option>
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {level} de {MAX_SKILL_LEVEL}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Ordem" error={errors.order?.message}>
        <input type="number" min={0} {...register('order', { setValueAs: toOptionalNumber })} />
      </Field>

      <div className={styles.inlineActions}>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>

      {formError && (
        <p className={`${styles.error} ${styles.fullRow}`} role="alert">
          {formError}
        </p>
      )}
    </form>
  );
}
