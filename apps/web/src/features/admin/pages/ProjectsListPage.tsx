import type { ProjectDTO } from '@portfolio/shared';
import { Link } from 'react-router';
import { buttonClasses } from '@/components/buttonClasses';
import { PageLoader } from '@/components/PageLoader';
import { useAdminProjects, useDeleteProject, useUpdateProject } from '../api';
import styles from '../admin.module.scss';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

function ProjectRow({ project }: { project: ProjectDTO }) {
  const update = useUpdateProject();
  const remove = useDeleteProject();

  const togglePublished = () =>
    update.mutate({ id: project.id, input: { published: !project.published } });

  const handleDelete = () => {
    if (window.confirm(`Excluir "${project.title}"? As imagens também serão apagadas.`)) {
      remove.mutate(project.id);
    }
  };

  return (
    <tr>
      <td>
        <Link to={`projects/${project.id}`} className={styles.rowTitle}>
          {project.title}
        </Link>
        <span className={styles.muted}>/{project.slug}</span>
      </td>
      <td className={styles.hideMobile}>{project.stack.slice(0, 3).join(' · ')}</td>
      <td>
        <button
          type="button"
          className={`${styles.status} ${project.published ? styles.published : ''}`}
          onClick={togglePublished}
          disabled={update.isPending}
          title="Alternar publicação"
        >
          {project.published ? 'Publicado' : 'Rascunho'}
        </button>
      </td>
      <td className={styles.hideMobile}>{dateFormatter.format(new Date(project.updatedAt))}</td>
      <td className={styles.actions}>
        <Link to={`projects/${project.id}`}>Editar</Link>
        <button
          type="button"
          className={styles.dangerLink}
          onClick={handleDelete}
          disabled={remove.isPending}
        >
          Excluir
        </button>
      </td>
    </tr>
  );
}

export function ProjectsListPage() {
  const { data: projects, isPending, isError } = useAdminProjects();

  return (
    <>
      <div className={styles.pageHeader}>
        <h1>Projetos</h1>
        <Link to="projects/new" className={buttonClasses({ size: 'sm' })}>
          Novo projeto
        </Link>
      </div>

      {isPending && <PageLoader />}
      {isError && <p className={styles.error}>Não foi possível carregar os projetos.</p>}
      {projects?.length === 0 && (
        <p className={styles.muted}>Nenhum projeto ainda. Crie o primeiro!</p>
      )}

      {projects && projects.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th className={styles.hideMobile}>Stack</th>
                <th>Status</th>
                <th className={styles.hideMobile}>Atualizado</th>
                <th>
                  <span className="visually-hidden">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
