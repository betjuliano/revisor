import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const {
  DATABASE_URL,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
  POSTGRES_SSL,
} = process.env;

const sslEnabled = String(POSTGRES_SSL ?? '').toLowerCase() === 'true' || String(POSTGRES_SSL ?? '') === '1';

let pool;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
  });
} else if (POSTGRES_HOST && POSTGRES_USER && POSTGRES_DB) {
  pool = new Pool({
    host: POSTGRES_HOST,
    port: Number(POSTGRES_PORT ?? 5432),
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    database: POSTGRES_DB,
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
  });
} else {
  console.error(
    'Configure DATABASE_URL ou as variáveis POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD e POSTGRES_DB.',
  );
  process.exit(1);
}

pool.on('error', (err) => {
  console.error('Erro inesperado na conexão com o Postgres:', err);
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function initializeDatabase() {
  await query(`
    create table if not exists public.users (
      id bigserial primary key,
      name text,
      email text unique not null,
      cpf text,
      tier text default 'free',
      role text default 'user',
      credits integer default 0,
      free_words_used integer default 0,
      created_at timestamptz default now()
    );
  `);

  await query(`
    create table if not exists public.transactions (
      id bigserial primary key,
      user_id bigint not null references public.users(id) on delete cascade,
      credits integer not null,
      amount numeric(10,2) default 0,
      method text default 'PIX',
      created_at timestamptz default now()
    );
  `);

  await query('alter table public.users enable row level security;').catch(() => {});
  await query('alter table public.transactions enable row level security;').catch(() => {});

  await query(
    `insert into storage.buckets (id, name, public)
     values ($1, $1, false)
     on conflict (id) do nothing;`,
    ['revisor-user-data'],
  ).catch((err) => {
    if (err.code !== '42P01') {
      throw err;
    }
    console.warn(
      'Esquema de storage não encontrado. Caso utilize o Supabase Storage, crie a extensão storage e o bucket manualmente.',
    );
  });
}
