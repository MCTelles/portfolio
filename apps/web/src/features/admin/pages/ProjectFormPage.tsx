import { zodResolver } from '@hookform/resolvers/zod';
import { projectInputSchema, type ProjectDTO } from '@portfolio/shared';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import type { z } from 'zod';
import { Button } from '@/components/Button';
import { PageLoader } from '@/components/PageLoader';
import { useAdminProject, useCreateProject, useUpdateProject } from '../api';
import { Field } from '../components/Field';
import { ImageUploader } from '../components/ImageUploader';
import { TagInput } from '../components/TagInput';
import { applyServerErrors, toOptionalNumber } from '../formErrors';
import styles from '../admin.module.scss';

type FormInput = z.input<typeof projectInputSchema>;
type FormOutput = z.output<typeof projectInputSchema>;

const EMPTY_FORM: FormInput = {
  title: '',
  slug: '',
  summary: '',
  description: '',
  stack: [],
  repoUrl: '',
  deployUrl: '',
  featured: false,
  published: false,
  order: 0,
};

const toFormValues = (project: ProjectDTO): FormInput => ({
  title: project.title,
  slug: project.slug,
  summary: project.summary,
  description: project.description,
  stack: project.stack,
  repoUrl: project.repoUrl ?? '',
  deployUrl: project.deployUrl ?? '',
  featured: project.featured,
  published: project.published,
  order: project.order,
});

function ProjectForm({ project }: { project?: ProjectDTO }) {
  const navigate = useNavigate();
  const location = useLocation();
  const create = useCreateProject();
  const update = useUpdateProject();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    (location.state as { created?: boolean } | null)?.created
      ? { type: 'success', message: 'Projeto criado! Agora adicione as imagens de capa.' }
      : null,
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(projectInputSchema),
    defaultValues: project ? toFormValues(project) : EMPTY_FORM,
  });

  const onSubmit = handleSubmit(async (input) => {
    setFeedback(null);
    try {
      if (project) {
        const saved = await update.mutateAsync({ id: project.id, input });
        reset(toFormValues(saved));
        setFeedback({ type: 'success', message: 'Alterações salvas.' });
      } else {
        const created = await create.mutateAsync(input);
        navigate(`/admin/projects/${created.id}`, { replace: true, state: { created: true } });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: applyServerErrors(error, setError) });
    }
  });

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <Link to="/admin" className={styles.muted}>
            ← Projetos
          </Link>
          <h1>{project ? project.title : 'Novo projeto'}</h1>
        </div>
      </div>

      <div className={styles.formLayout}>
        <form className={styles.card} onSubmit={onSubmit} noValidate>
          <Field label="Título" error={errors.title?.message}>
            <input {...register('title')} />
          </Field>

          <Field
            label="Slug"
            error={errors.slug?.message}
            hint="Usado na URL. Deixe vazio para gerar a partir do título."
          >
            <input {...register('slug')} placeholder="meu-projeto" />
          </Field>

          <Field
            label="Resumo"
            error={errors.summary?.message}
            hint="Uma ou duas frases para o card (até 280 caracteres)."
          >
            <textarea rows={2} {...register('summary')} />
          </Field>

          <Field label="Descrição" error={errors.description?.message}>
            <textarea rows={7} {...register('description')} />
          </Field>

          <Field
            label="Stack"
            error={errors.stack?.message ?? errors.stack?.root?.message}
            hint="Enter ou vírgula para adicionar."
          >
            <Controller
              control={control}
              name="stack"
              render={({ field }) => (
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="React, Node.js…"
                />
              )}
            />
          </Field>

          <div className={styles.row}>
            <Field label="Repositório" error={errors.repoUrl?.message}>
              <input type="url" placeholder="https://github.com/…" {...register('repoUrl')} />
            </Field>
            <Field label="Deploy" error={errors.deployUrl?.message}>
              <input type="url" placeholder="https://…" {...register('deployUrl')} />
            </Field>
          </div>

          <div className={styles.row}>
            <Field label="Ordem" error={errors.order?.message} hint="Menor aparece primeiro.">
              <input
                type="number"
                min={0}
                {...register('order', { setValueAs: toOptionalNumber })}
              />
            </Field>
            <div className={styles.checks}>
              <label className={styles.check}>
                <input type="checkbox" {...register('published')} /> Publicado
              </label>
              <label className={styles.check}>
                <input type="checkbox" {...register('featured')} /> Destaque
              </label>
            </div>
          </div>

          {feedback && (
            <p className={feedback.type === 'error' ? styles.error : styles.success} role="status">
              {feedback.message}
            </p>
          )}

          <div className={styles.formActions}>
            <Button type="submit" disabled={isSubmitting || (project && !isDirty)}>
              {isSubmitting ? 'Salvando…' : project ? 'Salvar alterações' : 'Criar projeto'}
            </Button>
          </div>
        </form>

        <aside className={styles.card}>
          <h2 className={styles.cardTitle}>Imagens de capa</h2>
          {project ? (
            <ImageUploader project={project} />
          ) : (
            <p className={styles.muted}>Salve o projeto para enviar imagens.</p>
          )}
        </aside>
      </div>
    </>
  );
}

export function ProjectFormPage() {
  const { id } = useParams();
  const { data: project, isPending, isError } = useAdminProject(id);

  if (!id) return <ProjectForm />;
  if (isPending) return <PageLoader />;
  if (isError) return <p className={styles.error}>Projeto não encontrado.</p>;

  // `key` remonta o formulário com os valores certos ao trocar de projeto.
  return <ProjectForm key={project.id} project={project} />;
}
