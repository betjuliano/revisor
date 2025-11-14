import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const snapshotPath = path.resolve(__dirname, '..', 'data', 'users.json');
const dataDir = path.dirname(snapshotPath);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configurados.');
  process.exit(1);
}

// 1. Extract common Supabase client init into a shared module
// src/lib/db.js
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Supabase config missing')
  process.exit(1)
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// 2. Collapse applyUsers into a single upsert call:
async function applyUsers(users) {
  const payload = users
    .filter(u => u.email)
    .map(u => ({
      email: u.email.toLowerCase(),
      name: u.name ?? null,
      cpf: u.cpf ?? null,
      tier: u.tier ?? 'free',
      role: u.role ?? 'user',
      credits: u.credits ?? 0,
      free_words_used: u.freeWordsUsed ?? 0,
    }))

  const { error } = await supabase
    .from('users')
    .upsert(payload, { onConflict: 'email' })

  if (error) throw error
}

// 3. Bulk‐insert new transactions (optionally use upsert if you have a unique constraint):
async function applyTransactions(transactionsMap) {
  const txs = Object.entries(transactionsMap ?? {}).flatMap(([uid, entries]) => {
    const id = Number(uid)
    if (Number.isNaN(id)) return []
    return (entries || []).map(tx => ({
      user_id: id,
      credits: tx.credits ?? 0,
      amount: tx.amount ?? 0,
      method: tx.method ?? 'Crédito Manual',
      created_at: tx.createdAt ?? new Date().toISOString(),
    }))
  })

  // If you need to dedupe, fetch keys first then filter `txs` here…
  const { error } = await supabase.from('transactions').insert(txs)
  if (error) throw error
}

// 4. In your main file, import { supabase } from 'src/lib/db' and drop duplicated init/fetch logic.
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function readSnapshot() {
  try {
    const raw = await fs.readFile(snapshotPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      throw new Error('Snapshot não encontrado. Execute a API pelo menos uma vez para gerar data/users.json.');
    }
    throw err;
  }
}

async function applyUsers(users) {
  for (const user of users) {
    if (!user?.email) {
      continue;
    }

    const { data: existingUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email.toLowerCase())
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!existingUser) {
      console.log(`Criando usuário ${user.email}`);
      const { error: insertError } = await supabase.from('users').insert({
        name: user.name ?? null,
        email: user.email,
        cpf: user.cpf ?? null,
        tier: user.tier ?? 'free',
        role: user.role ?? 'user',
        credits: user.credits ?? 0,
        free_words_used: user.freeWordsUsed ?? 0,
      });
      if (insertError) {
        throw insertError;
      }
      continue;
    }

    const updates = {};
    if (typeof user.credits === 'number' && user.credits !== Number(existingUser.credits ?? 0)) {
      updates.credits = user.credits;
    }
    if (typeof user.freeWordsUsed === 'number' && user.freeWordsUsed !== Number(existingUser.free_words_used ?? 0)) {
      updates.free_words_used = user.freeWordsUsed;
    }
    if (user.tier && user.tier !== existingUser.tier) {
      updates.tier = user.tier;
    }
    if (user.role && user.role !== existingUser.role) {
      updates.role = user.role;
    }

    if (Object.keys(updates).length > 0) {
      console.log(`Atualizando ${user.email}:`, updates);
      const { error: updateError } = await supabase.from('users').update(updates).eq('id', existingUser.id);
      if (updateError) {
        throw updateError;
      }
    }
  }
}

async function applyTransactions(transactionsMap) {
  const userIds = Object.keys(transactionsMap ?? {});
  for (const userId of userIds) {
    const entries = transactionsMap[userId];
    if (!Array.isArray(entries) || entries.length === 0) {
      continue;
    }

    const numericId = Number(userId);
    if (Number.isNaN(numericId)) {
      continue;
    }

    const { data: existingTransactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', numericId);
    if (error) {
      throw error;
    }

    const existingKeys = new Set(
      (existingTransactions ?? []).map((tx) => `${tx.credits}|${tx.amount}|${tx.method}|${tx.created_at}`),
    );

    for (const tx of entries) {
      const createdAt = tx.createdAt ?? new Date().toISOString();
      const key = `${tx.credits}|${tx.amount}|${tx.method}|${createdAt}`;
      if (existingKeys.has(key)) {
        continue;
      }

      console.log(`Registrando transação manual para usuário ${numericId}: +${tx.credits} créditos (${tx.method}).`);
      const { error: insertError } = await supabase.from('transactions').insert({
        user_id: numericId,
        credits: tx.credits ?? 0,
        amount: tx.amount ?? 0,
        method: tx.method ?? 'Crédito Manual',
        created_at: createdAt,
      });
      if (insertError) {
        throw insertError;
      }
    }
  }
}

async function fetchAllUsers() {
  const { data, error } = await supabase.from('users').select('*').order('id', { ascending: true });
  if (error) {
    throw error;
  }
  return (data ?? []).map((record) => ({
    id: Number(record.id),
    name: record.name ?? '',
    email: record.email ?? '',
    tier: record.tier ?? 'free',
    role: record.role ?? 'user',
    cpf: record.cpf ?? '',
    credits: Number(record.credits ?? 0),
    freeWordsUsed: Number(record.free_words_used ?? 0),
  }));
}

async function fetchTransactionsByUser() {
  const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  const map = {};
  for (const tx of data ?? []) {
    const entry = {
      id: Number(tx.id),
      userId: Number(tx.user_id),
      credits: Number(tx.credits ?? 0),
      amount: Number(tx.amount ?? 0),
      method: tx.method ?? 'PIX',
      createdAt: tx.created_at ?? new Date().toISOString(),
    };
    const key = String(entry.userId);
    if (!map[key]) {
      map[key] = [];
    }
    map[key].push(entry);
  }
  return map;
}

async function refreshSnapshotFile() {
  const [users, transactions] = await Promise.all([fetchAllUsers(), fetchTransactionsByUser()]);
  await fs.mkdir(dataDir, { recursive: true });
  const payload = {
    updatedAt: new Date().toISOString(),
    users,
    transactions,
  };
  await fs.writeFile(snapshotPath, JSON.stringify(payload, null, 2), 'utf-8');
}

async function main() {
  try {
    const snapshot = await readSnapshot();
    await applyUsers(snapshot.users ?? []);
    await applyTransactions(snapshot.transactions ?? {});
    await refreshSnapshotFile();
    console.log('Sincronização concluída com sucesso.');
  } catch (err) {
    console.error('Falha ao aplicar snapshot:', err);
    process.exit(1);
  }
}

main();
