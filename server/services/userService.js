import { query, withTransaction } from '../db.js';
import { persistSnapshot } from './snapshotService.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import { mapTransactionRecord, mapUserRecord } from '../utils/mappers.js';

const ADMIN_EMAILS = new Set(['admjulianoo@gmail.com']);

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

export function buildPriceFromCredits(credits, providedPrice) {
  if (typeof providedPrice === 'number' && !Number.isNaN(providedPrice)) {
    return Number(providedPrice);
  }
  const computed = (credits / 5000) * 10;
  return Number(computed.toFixed(2));
}

export async function findOrCreateUser(email, cpf) {
  if (!email || !cpf) {
    throw new BadRequestError('Email e CPF são obrigatórios.');
  }

  const normalizedEmail = normalizeEmail(email);

  const userRecord = await withTransaction(async (client) => {
    const existing = await client.query('select * from public.users where email = $1', [normalizedEmail]);
    if (existing.rowCount > 0) {
      const user = existing.rows[0];
      if (!user.cpf) {
        await client.query('update public.users set cpf = $1 where id = $2', [cpf, user.id]);
        user.cpf = cpf;
      }
      return user;
    }

    const payload = {
      name: `Usuário ${String(cpf).slice(0, 3)}`,
      email: normalizedEmail,
      cpf,
      tier: 'free',
      role: ADMIN_EMAILS.has(normalizedEmail) ? 'admin' : 'user',
      credits: 0,
      free_words_used: 0,
    };

    const insertResult = await client.query(
      `insert into public.users (name, email, cpf, tier, role, credits, free_words_used)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [payload.name, payload.email, payload.cpf, payload.tier, payload.role, payload.credits, payload.free_words_used],
    );
    return insertResult.rows[0];
  });

  return mapUserRecord(userRecord);
}

export async function fetchAllUsers() {
  const { rows } = await query(
    `select id, name, email, tier, role, cpf, credits, free_words_used from public.users order by id asc`,
  );
  return rows.map(mapUserRecord);
}

export async function fetchTransactionsByUser() {
  const { rows } = await query(
    `select id, user_id, credits, amount, method, created_at from public.transactions order by created_at desc`,
  );
  const map = {};
  for (const row of rows) {
    const entry = mapTransactionRecord(row);
    const key = String(entry.userId);
    if (!map[key]) {
      map[key] = [];
    }
    map[key].push(entry);
  }
  return map;
}

export async function fetchTransactionsForUser(userId) {
  const { rows } = await query(
    `select id, user_id, credits, amount, method, created_at
     from public.transactions
     where user_id = $1
     order by created_at desc`,
    [userId],
  );
  return rows.map(mapTransactionRecord);
}

export async function addCreditsToUser(userId, amount, method, price) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new BadRequestError('O campo amount deve ser um número maior que zero.');
  }

  const creditMethod = method ?? 'Crédito do Admin';
  const transactionAmount = buildPriceFromCredits(amount, price);

  const updatedUser = await withTransaction(async (client) => {
    const current = await client.query('select * from public.users where id = $1 for update', [userId]);
    if (current.rowCount === 0) {
      throw new NotFoundError('Usuário não encontrado.');
    }
    const user = current.rows[0];
    const currentCredits = Number(user.credits ?? 0);
    const newCredits = currentCredits + amount;
    const nextTier = user.tier === 'free' ? 'premium' : user.tier;

    const { rows } = await client.query(
      `update public.users set credits = $1, tier = $2 where id = $3 returning *`,
      [newCredits, nextTier, userId],
    );

    await client.query(
      `insert into public.transactions (user_id, credits, amount, method)
       values ($1, $2, $3, $4)`,
      [userId, amount, transactionAmount, creditMethod],
    );

    return rows[0];
  });

  return mapUserRecord(updatedUser);
}

export async function deductCreditsFromUser(userId, wordCount) {
  if (!Number.isFinite(wordCount) || wordCount <= 0) {
    throw new BadRequestError('wordCount deve ser maior que zero.');
  }

  const updatedUser = await withTransaction(async (client) => {
    const current = await client.query('select * from public.users where id = $1 for update', [userId]);
    if (current.rowCount === 0) {
      throw new NotFoundError('Usuário não encontrado.');
    }
    const user = current.rows[0];
    const currentCredits = Number(user.credits ?? 0);
    const newCredits = Math.max(0, currentCredits - wordCount);

    const { rows } = await client.query(
      `update public.users set credits = $1 where id = $2 returning *`,
      [newCredits, userId],
    );

    return rows[0];
  });

  return mapUserRecord(updatedUser);
}

export async function incrementFreeWordsForUser(userId, wordCount) {
  if (!Number.isFinite(wordCount) || wordCount <= 0) {
    throw new BadRequestError('wordCount deve ser maior que zero.');
  }

  const updatedUser = await withTransaction(async (client) => {
    const current = await client.query('select * from public.users where id = $1 for update', [userId]);
    if (current.rowCount === 0) {
      throw new NotFoundError('Usuário não encontrado.');
    }
    const user = current.rows[0];
    const usedWords = Number(user.free_words_used ?? 0) + wordCount;

    const { rows } = await client.query(
      `update public.users set free_words_used = $1 where id = $2 returning *`,
      [usedWords, userId],
    );

    return rows[0];
  });

  return mapUserRecord(updatedUser);
}

export async function upgradeUserTier(userId) {
  const { rows } = await query(
    `update public.users set tier = 'premium' where id = $1 returning *`,
    [userId],
  );

  if (rows.length === 0) {
    throw new NotFoundError('Usuário não encontrado.');
  }

  return mapUserRecord(rows[0]);
}

export async function refreshSnapshotState(focusUserId, { includeTransactions = false, fallbackUser = null } = {}) {
  const [users, transactionsMap] = await Promise.all([fetchAllUsers(), fetchTransactionsByUser()]);
  await persistSnapshot(users, transactionsMap);

  let user = null;
  if (typeof focusUserId === 'number' && !Number.isNaN(focusUserId)) {
    user = users.find((entry) => entry.id === focusUserId) ?? fallbackUser;
  } else {
    user = fallbackUser;
  }

  const response = { users, user: user ?? null };
  if (includeTransactions) {
    const key = user ? String(user.id) : focusUserId != null ? String(focusUserId) : null;
    response.transactions = key ? transactionsMap[key] ?? [] : [];
  }

  return response;
}
