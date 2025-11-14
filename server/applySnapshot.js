import { initializeDatabase, query, withTransaction } from './db.js';
import {
  fetchAllUsers,
  fetchTransactionsByUser,
  normalizeEmail,
} from './services/userService.js';
import {
  ensureSnapshotExists,
  persistSnapshot,
  readSnapshot,
} from './services/snapshotService.js';

const bootstrapReady = initializeDatabase();

function normalizeTimestamp(value) {
  if (!value) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

async function ensureSnapshotReady() {
  await ensureSnapshotExists();
}

async function readLocalSnapshot() {
  await ensureSnapshotReady();
  const snapshot = await readSnapshot();
  if (!snapshot) {
    throw new Error('Snapshot inválido.');
  }
  return snapshot;
}

async function applyUsers(users) {
  for (const user of users) {
    if (!user?.email) {
      continue;
    }

    const normalizedEmail = normalizeEmail(user.email);

    await withTransaction(async (client) => {
      const existing = await client.query('select * from public.users where email = $1 for update', [normalizedEmail]);

      if (existing.rowCount === 0) {
        console.log(`Criando usuário ${normalizedEmail}`);
        await client.query(
          `insert into public.users (name, email, cpf, tier, role, credits, free_words_used)
           values ($1, $2, $3, $4, $5, $6, $7)`,
          [
            user.name ?? null,
            normalizedEmail,
            user.cpf ?? null,
            user.tier ?? 'free',
            user.role ?? 'user',
            user.credits ?? 0,
            user.freeWordsUsed ?? 0,
          ],
        );
        return;
      }

      const record = existing.rows[0];
      const updates = {};

      if (typeof user.credits === 'number' && user.credits !== Number(record.credits ?? 0)) {
        updates.credits = user.credits;
      }
      if (typeof user.freeWordsUsed === 'number' && user.freeWordsUsed !== Number(record.free_words_used ?? 0)) {
        updates.free_words_used = user.freeWordsUsed;
      }
      if (user.tier && user.tier !== record.tier) {
        updates.tier = user.tier;
      }
      if (user.role && user.role !== record.role) {
        updates.role = user.role;
      }
      if (user.cpf && user.cpf !== record.cpf) {
        updates.cpf = user.cpf;
      }

      const keys = Object.keys(updates);
      if (keys.length > 0) {
        console.log(`Atualizando ${normalizedEmail}:`, updates);
        const sets = keys.map((key, index) => `${key} = $${index + 1}`);
        const values = keys.map((key) => updates[key]);
        values.push(record.id);
        await client.query(`update public.users set ${sets.join(', ')} where id = $${keys.length + 1}`, values);
      }
    });
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

    const { rows } = await query(
      `select credits, amount, method, created_at from public.transactions where user_id = $1`,
      [numericId],
    );
    const existingKeys = new Set(
      rows.map((tx) => `${tx.credits}|${tx.amount}|${tx.method}|${normalizeTimestamp(tx.created_at)}`),
    );

    for (const tx of entries) {
      const createdAt = tx.createdAt ?? new Date().toISOString();
      const normalized = normalizeTimestamp(createdAt) || new Date().toISOString();
      const key = `${tx.credits}|${tx.amount}|${tx.method}|${normalized}`;
      if (existingKeys.has(key)) {
        continue;
      }

      console.log(`Registrando transação manual para usuário ${numericId}: +${tx.credits} créditos (${tx.method}).`);
      await query(
        `insert into public.transactions (user_id, credits, amount, method, created_at)
         values ($1, $2, $3, $4, $5)`,
        [numericId, tx.credits ?? 0, tx.amount ?? 0, tx.method ?? 'Crédito Manual', normalized],
      );
    }
  }
}

async function refreshSnapshotFile() {
  const [users, transactions] = await Promise.all([fetchAllUsers(), fetchTransactionsByUser()]);
  await persistSnapshot(users, transactions);
}

async function main() {
  await bootstrapReady;
  try {
    const snapshot = await readLocalSnapshot();
    await applyUsers(snapshot.users ?? []);
    await applyTransactions(snapshot.transactions ?? {});
    await refreshSnapshotFile();
    console.log('Snapshot aplicado com sucesso.');
  } catch (err) {
    console.error('Erro ao aplicar snapshot:', err);
    process.exitCode = 1;
  }
}

main();
