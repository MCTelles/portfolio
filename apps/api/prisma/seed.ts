/**
 * Popula o banco com o admin e dados de exemplo. Idempotente: pode rodar várias vezes.
 * O admin é criado/atualizado a partir de ADMIN_EMAIL / ADMIN_PASSWORD do .env.
 * Conteúdo de exemplo só é criado se ainda não existir (não sobrescreve edições do painel).
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../src/modules/auth/password';
import { PrismaClient, type Prisma } from '../src/generated/prisma/client';

try {
  process.loadEnvFile();
} catch {
  // Sem .env: usa as variáveis do ambiente.
}

const seedEnv = z
  .object({
    DATABASE_URL: z.url(),
    ADMIN_NAME: z.string().min(1).default('Admin'),
    ADMIN_EMAIL: z.email().toLowerCase(),
    ADMIN_PASSWORD: z.string().min(12, 'ADMIN_PASSWORD deve ter pelo menos 12 caracteres'),
    /** Perfil, skills e projetos de exemplo. Em produção: false (o conteúdo vem do painel). */
    SEED_DEMO_CONTENT: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),
  })
  .parse(process.env);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: seedEnv.DATABASE_URL }),
});

const profile: Prisma.ProfileCreateInput = {
  name: 'Marcelo',
  headline: 'Engenheiro de Software · Web & Mobile',
  bio: 'Construo produtos digitais de ponta a ponta: interfaces rápidas e acessíveis, APIs robustas e apps mobile. Gosto de arquitetura limpa, performance e de detalhes que fazem a experiência parecer simples.',
  location: 'Brasil',
  socials: [
    { label: 'GitHub', url: 'https://github.com/MCTelles' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/marcelodacostatelles' },
    { label: 'E-mail', url: 'mailto:marcelotellesest@gmail.com' },
  ],
};

const skills: Prisma.SkillCreateInput[] = [
  { name: 'React', category: 'FRONTEND', level: 5, order: 0 },
  { name: 'TypeScript', category: 'FRONTEND', level: 5, order: 1 },
  { name: 'Three.js / R3F', category: 'FRONTEND', level: 4, order: 2 },
  { name: 'SASS', category: 'FRONTEND', level: 4, order: 3 },
  { name: 'Node.js', category: 'BACKEND', level: 5, order: 0 },
  { name: 'Express', category: 'BACKEND', level: 5, order: 1 },
  { name: 'PostgreSQL', category: 'BACKEND', level: 4, order: 2 },
  { name: 'Prisma', category: 'BACKEND', level: 4, order: 3 },
  { name: 'React Native', category: 'MOBILE', level: 4, order: 0 },
  { name: 'Expo', category: 'MOBILE', level: 4, order: 1 },
  { name: 'Docker', category: 'DEVOPS', level: 4, order: 0 },
  { name: 'CI/CD', category: 'DEVOPS', level: 3, order: 1 },
  { name: 'Git', category: 'TOOLS', level: 5, order: 0 },
  { name: 'Figma', category: 'TOOLS', level: 3, order: 1 },
];

const projects: Prisma.ProjectCreateInput[] = [
  {
    title: 'Portfólio 3D',
    slug: 'portfolio-3d',
    summary: 'Este site: frontend imersivo com React Three Fiber e painel administrativo próprio.',
    description:
      'Monorepo com React + Vite + R3F no frontend e Express + Prisma no backend. Hero com modelo glTF comprimido via meshopt, CRUD autenticado com JWT em cookie httpOnly e upload de imagens validado por assinatura de arquivo.',
    stack: ['React', 'Three.js', 'TypeScript', 'Node.js', 'PostgreSQL'],
    featured: true,
    published: true,
    order: 0,
  },
  {
    title: 'App de Finanças Pessoais',
    slug: 'app-financas',
    summary: 'App mobile offline-first para controle de gastos com sincronização em background.',
    description:
      'Aplicativo React Native com armazenamento local, sincronização incremental e gráficos de categorias. API em Node com autenticação e notificações push.',
    stack: ['React Native', 'Expo', 'Node.js', 'SQLite'],
    published: true,
    order: 1,
  },
  {
    title: 'Dashboard de Observabilidade',
    slug: 'dashboard-observabilidade',
    summary: 'Painel em tempo real para métricas de serviços, com alertas e filtros salvos.',
    description:
      'Dashboard web com WebSockets, gráficos virtualizados para milhares de pontos e backend agregando métricas no PostgreSQL com particionamento por tempo.',
    stack: ['React', 'WebSockets', 'PostgreSQL', 'Docker'],
    published: true,
    order: 2,
  },
];

async function main() {
  const existing = await prisma.adminUser.findUnique({ where: { email: seedEnv.ADMIN_EMAIL } });
  const passwordChanged =
    existing !== null && !(await verifyPassword(seedEnv.ADMIN_PASSWORD, existing.passwordHash));
  const passwordHash = await hashPassword(seedEnv.ADMIN_PASSWORD);

  await prisma.adminUser.upsert({
    where: { email: seedEnv.ADMIN_EMAIL },
    create: { email: seedEnv.ADMIN_EMAIL, name: seedEnv.ADMIN_NAME, passwordHash },
    // Senha trocada: incrementa a versão para derrubar sessões abertas com a senha antiga.
    update: {
      name: seedEnv.ADMIN_NAME,
      passwordHash,
      ...(passwordChanged && { tokenVersion: { increment: 1 } }),
    },
  });
  if (passwordChanged) console.log('Senha do admin alterada: sessões anteriores foram revogadas.');

  if (!seedEnv.SEED_DEMO_CONTENT) {
    console.log(`Seed concluído: admin ${seedEnv.ADMIN_EMAIL} (sem conteúdo de exemplo).`);
    return;
  }

  await prisma.profile.upsert({ where: { id: 1 }, create: { ...profile, id: 1 }, update: {} });

  for (const skill of skills) {
    await prisma.skill.upsert({ where: { name: skill.name }, create: skill, update: {} });
  }

  for (const project of projects) {
    await prisma.project.upsert({ where: { slug: project.slug }, create: project, update: {} });
  }

  console.log(
    `Seed concluído: admin ${seedEnv.ADMIN_EMAIL}, ${skills.length} skills, ${projects.length} projetos.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
