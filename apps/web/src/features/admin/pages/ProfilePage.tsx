import { zodResolver } from '@hookform/resolvers/zod';
import { profileInputSchema, type ProfileDTO } from '@portfolio/shared';
import { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components/Button';
import { TrashIcon } from '@/components/Icons';
import { PageLoader } from '@/components/PageLoader';
import { useAdminProfile, useSaveProfile } from '../api';
import { Field } from '../components/Field';
import { applyServerErrors } from '../formErrors';
import styles from '../admin.module.scss';

type ProfileFormInput = z.input<typeof profileInputSchema>;
type ProfileFormOutput = z.output<typeof profileInputSchema>;

const MAX_SOCIALS = 10;

const EMPTY_PROFILE: ProfileFormInput = {
  name: '',
  headline: '',
  bio: '',
  location: '',
  avatarUrl: '',
  socials: [],
};

const toFormValues = (profile: ProfileDTO): ProfileFormInput => ({
  name: profile.name,
  headline: profile.headline,
  bio: profile.bio,
  location: profile.location ?? '',
  avatarUrl: profile.avatarUrl ?? '',
  socials: profile.socials,
});

const isHttpUrl = (value: string | undefined) => Boolean(value && /^https?:\/\/\S+$/.test(value));

function ProfileForm({ profile }: { profile: ProfileDTO | null }) {
  const save = useSaveProfile();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormInput, unknown, ProfileFormOutput>({
    resolver: zodResolver(profileInputSchema),
    defaultValues: profile ? toFormValues(profile) : EMPTY_PROFILE,
  });

  const socials = useFieldArray({ control, name: 'socials' });
  const avatarUrl = useWatch({ control, name: 'avatarUrl' });
  const bioLength = useWatch({ control, name: 'bio' }).length;

  const onSubmit = handleSubmit(async (input) => {
    setFeedback(null);
    try {
      reset(toFormValues(await save.mutateAsync(input)));
      setFeedback({ type: 'success', message: 'Perfil salvo. O site já reflete as alterações.' });
    } catch (error) {
      setFeedback({ type: 'error', message: applyServerErrors(error, setError) });
    }
  });

  return (
    <form className={styles.formLayout} onSubmit={onSubmit} noValidate>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Informações</h2>

        <div className={styles.row}>
          <Field label="Nome" error={errors.name?.message}>
            <input autoComplete="name" {...register('name')} />
          </Field>
          <Field label="Localização" error={errors.location?.message}>
            <input placeholder="São Paulo, Brasil" {...register('location')} />
          </Field>
        </div>

        <Field
          label="Headline"
          error={errors.headline?.message}
          hint="Aparece no topo do site, ao lado do seu nome."
        >
          <input placeholder="Engenheiro de Software · Web & Mobile" {...register('headline')} />
        </Field>

        <Field
          label="Bio"
          error={errors.bio?.message}
          hint={`${bioLength}/5000 · Deixe uma linha em branco para separar parágrafos.`}
        >
          <textarea rows={8} {...register('bio')} />
        </Field>

        <div className={styles.avatarField}>
          {isHttpUrl(avatarUrl) ? (
            <img className={styles.avatarPreview} src={avatarUrl} alt="" />
          ) : (
            <span className={styles.avatarPreview} aria-hidden="true" />
          )}
          <Field label="URL do avatar" error={errors.avatarUrl?.message} hint="Opcional.">
            <input type="url" placeholder="https://…" {...register('avatarUrl')} />
          </Field>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Links e contato</h2>
        <p className={styles.muted}>
          Use <code>mailto:marcelotellesest@gmail.com</code> para o e-mail: ele vira o contato em
          destaque no rodapé.
        </p>

        {socials.fields.length > 0 && (
          <ul className={styles.socialList}>
            {socials.fields.map((field, index) => (
              <li key={field.id} className={styles.socialRow}>
                <Field label="Rótulo" error={errors.socials?.[index]?.label?.message}>
                  <input placeholder="GitHub" {...register(`socials.${index}.label`)} />
                </Field>
                <Field label="URL" error={errors.socials?.[index]?.url?.message}>
                  <input placeholder="https://…" {...register(`socials.${index}.url`)} />
                </Field>
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`Remover link ${index + 1}`}
                  onClick={() => socials.remove(index)}
                >
                  <TrashIcon width={16} height={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {errors.socials?.root?.message && (
          <p className={styles.error}>{errors.socials.root.message}</p>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={socials.fields.length >= MAX_SOCIALS}
          onClick={() => socials.append({ label: '', url: '' })}
        >
          + Adicionar link
        </Button>
      </section>

      <div className={styles.formFooter}>
        {feedback && (
          <p className={feedback.type === 'error' ? styles.error : styles.success} role="status">
            {feedback.message}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting || (profile !== null && !isDirty)}>
          {isSubmitting ? 'Salvando…' : 'Salvar perfil'}
        </Button>
      </div>
    </form>
  );
}

export function ProfilePage() {
  const { data: profile, isPending, isError } = useAdminProfile();

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1>Perfil</h1>
          <p className={styles.muted}>Dados das seções “Sobre”, do topo do site e do rodapé.</p>
        </div>
      </div>

      {isPending && <PageLoader />}
      {isError && <p className={styles.error}>Não foi possível carregar o perfil.</p>}
      {profile !== undefined && <ProfileForm profile={profile} />}
    </>
  );
}
