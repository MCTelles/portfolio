import { Button } from '@/components/Button';
import { Section } from '@/components/Section';
import { ProjectCard } from './ProjectCard';
import styles from './Projects.module.scss';
import { useProjects } from './queries';

function ProjectsContent() {
  const { data: projects, isPending, isError, refetch } = useProjects();

  if (isPending) {
    return (
      <div className={styles.grid} aria-busy="true">
        {[0, 1, 2].map((key) => (
          <div key={key} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.state}>
        <p>Bandeira vermelha: não foi possível carregar os projetos.</p>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (projects.length === 0) {
    return <p className={styles.state}>Grid ainda vazio: novos projetos em breve.</p>;
  }

  return (
    <div className={styles.grid}>
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} position={index + 1} />
      ))}
    </div>
  );
}

export function ProjectsSection() {
  return (
    <Section
      id="projetos"
      number="01"
      eyebrow="Grid de largada"
      title="Projetos em pista"
      lead="Do primeiro commit ao deploy: cada projeto com o setup que levou até a bandeira quadriculada."
    >
      <ProjectsContent />
    </Section>
  );
}
