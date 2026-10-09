import { execSync } from 'node:child_process';
import pg from 'pg';

const quoteIdentifier = (name: string) => `"${name.replace(/"/g, '""')}"`;

async function withClient<T>(url: URL, work: (client: pg.Client) => Promise<T>): Promise<T> {
  const connection = new URL(url);
  connection.search = '';
  const client = new pg.Client({ connectionString: connection.toString() });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

/** Cria o banco de teste se preciso, aplica as migrations e começa sempre do zero. */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL não definido (ver vitest.config.ts)');

  const target = new URL(url);
  const databaseName = target.pathname.slice(1);
  const maintenance = new URL(url);
  maintenance.pathname = '/postgres';

  await withClient(maintenance, async (client) => {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      databaseName,
    ]);
    if (!rowCount) await client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
  });

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });

  // TRUNCATE não dispara triggers de linha, então limpa também a trilha append-only.
  await withClient(target, (client) =>
    client.query(
      'TRUNCATE audit_logs, project_images, projects, skills, profile, admin_users RESTART IDENTITY CASCADE',
    ),
  );
}
