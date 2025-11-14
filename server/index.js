import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '..', 'data');
const snapshotPath = path.join(dataDir, 'users.json');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('As variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_ANON_KEY) são obrigatórias.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

const snapshotReady = ensureSnapshotFile();

async function ensureSnapshotFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(snapshotPath);
  } catch {
    const initialSnapshot = {
      updatedAt: new Date().toISOString(),
      users: [],
      transactions: {},
    };
    await fs.writeFile(snapshotPath, JSON.stringify(initialSnapshot, null, 2), 'utf-8');
  }
}

function mapUser(record) {
  return {
    id: Number(record.id),
    name: record.name ?? '',
    email: record.email ?? '',
    tier: record.tier ?? 'free',
    role: record.role ?? 'user',
    cpf: record.cpf ?? '',
    credits: Number(record.credits ?? 0),
    freeWordsUsed: Number(record.free_words_used ?? 0),
  };
}

function mapTransaction(record) {
  return {
    id: Number(record.id),
    userId: Number(record.user_id),
    credits: Number(record.credits ?? 0),
    amount: Number(record.amount ?? 0),
    method: record.method ?? 'PIX',
    createdAt: record.created_at ?? new Date().toISOString(),
  };
}

async function fetchAllUsers() {
  const { data, error } = await supabase.from('users').select('*').order('id', { ascending: true });
  if (error) {
    throw error;
  }
  return (data ?? []).map(mapUser);
}

async function fetchTransactionsByUser() {
  const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  const map = {};
  for (const tx of data ?? []) {
    const parsed = mapTransaction(tx);
    const key = String(parsed.userId);
    if (!map[key]) {
      map[key] = [];
    }
    map[key].push(parsed);
  }
  return map;
}

async function persistSnapshot(users, transactionsMap) {
  await snapshotReady;
  await fs.writeFile(snapshotPath, JSON.stringify({
    updatedAt: new Date().toISOString(),
    users,
    transactions: transactionsMap,
  }, null, 2), 'utf-8');
}

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function buildPriceFromCredits(credits, providedPrice) {
  if (typeof providedPrice === 'number' && !Number.isNaN(providedPrice)) {
    return Number(providedPrice);
  }
  const computed = (credits / 5000) * 10;
  return Number(computed.toFixed(2));
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/auth/login', async (req, res) => {
  const { email, cpf } = req.body ?? {};
  if (!email || !cpf) {
    return res.status(400).json({ message: 'Email e CPF são obrigatórios.' });
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!user) {
      const newUserPayload = {
        name: `Usuário ${String(cpf).slice(0, 3)}`,
        email: normalizedEmail,
        cpf,
        tier: 'free',
        role: normalizedEmail === 'admjulianoo@gmail.com' ? 'admin' : 'user',
        credits: 0,
        free_words_used: 0,
      };
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(newUserPayload)
        .select()
        .single();
      if (insertError) {
        throw insertError;
      }
      user = insertedUser;
    }

    const users = await fetchAllUsers();
    const transactionsMap = await fetchTransactionsByUser();
    await persistSnapshot(users, transactionsMap);

    const mappedUser = mapUser(user);
    const userTransactions = transactionsMap[String(mappedUser.id)] ?? [];

    res.json({
      user: mappedUser,
      users,
      transactions: userTransactions,
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ message: 'Falha ao autenticar usuário.' });
  }
});

app.get('/users', async (_req, res) => {
  try {
    const users = await fetchAllUsers();
    res.json({ users });
  } catch (err) {
    console.error('Erro ao carregar usuários:', err);
    res.status(500).json({ message: 'Não foi possível carregar os usuários.' });
  }
});

app.get('/users/:id/transactions', async (req, res) => {
  const userId = Number(req.params.id);
  if (Number.isNaN(userId)) {
    return res.status(400).json({ message: 'ID do usuário inválido.' });
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      throw error;
    }
    const transactions = (data ?? []).map(mapTransaction);
    res.json({ transactions });
  } catch (err) {
    console.error('Erro ao carregar transações:', err);
    res.status(500).json({ message: 'Não foi possível carregar as transações do usuário.' });
  }
});

app.post('/users/:id/credits', async (req, res) => {
  const userId = Number(req.params.id);
  const { amount, method, price } = req.body ?? {};

  if (Number.isNaN(userId)) {
    return res.status(400).json({ message: 'ID do usuário inválido.' });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ message: 'O campo amount deve ser um número maior que zero.' });
  }

  const creditMethod = method ?? 'Crédito do Admin';
  const transactionAmount = buildPriceFromCredits(amount, price);

  try {
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (fetchError) {
      throw fetchError;
    }

    const currentCredits = Number(currentUser.credits ?? 0);
    const newCredits = currentCredits + amount;
    const nextTier = currentUser.tier === 'free' ? 'premium' : currentUser.tier;

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ credits: newCredits, tier: nextTier })
      .eq('id', userId)
      .select()
      .single();
    if (updateError) {
      throw updateError;
    }

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        credits: amount,
        amount: transactionAmount,
        method: creditMethod,
      });
    if (transactionError) {
      throw transactionError;
    }

    const users = await fetchAllUsers();
    const transactionsMap = await fetchTransactionsByUser();
    await persistSnapshot(users, transactionsMap);

    res.json({
      user: mapUser(updatedUser),
      users,
      transactions: transactionsMap[String(userId)] ?? [],
    });
  } catch (err) {
    console.error('Erro ao adicionar créditos:', err);
    res.status(500).json({ message: 'Falha ao adicionar créditos para o usuário.' });
  }
});

app.post('/users/:id/credits/use', async (req, res) => {
  const userId = Number(req.params.id);
  const { wordCount } = req.body ?? {};

  if (Number.isNaN(userId)) {
    return res.status(400).json({ message: 'ID do usuário inválido.' });
  }

  if (typeof wordCount !== 'number' || wordCount <= 0) {
    return res.status(400).json({ message: 'wordCount deve ser maior que zero.' });
  }

  try {
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (fetchError) {
      throw fetchError;
    }

    const currentCredits = Number(currentUser.credits ?? 0);
    const newCredits = Math.max(0, currentCredits - wordCount);

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ credits: newCredits })
      .eq('id', userId)
      .select()
      .single();
    if (updateError) {
      throw updateError;
    }

    const users = await fetchAllUsers();
    const transactionsMap = await fetchTransactionsByUser();
    await persistSnapshot(users, transactionsMap);

    res.json({ user: mapUser(updatedUser), users });
  } catch (err) {
    console.error('Erro ao debitar créditos:', err);
    res.status(500).json({ message: 'Não foi possível atualizar os créditos do usuário.' });
  }
});

app.post('/users/:id/free-words', async (req, res) => {
  const userId = Number(req.params.id);
  const { wordCount } = req.body ?? {};

  if (Number.isNaN(userId)) {
    return res.status(400).json({ message: 'ID do usuário inválido.' });
  }

  if (typeof wordCount !== 'number' || wordCount <= 0) {
    return res.status(400).json({ message: 'wordCount deve ser maior que zero.' });
  }

  try {
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (fetchError) {
      throw fetchError;
    }

    const usedWords = Number(currentUser.free_words_used ?? 0) + wordCount;

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ free_words_used: usedWords })
      .eq('id', userId)
      .select()
      .single();
    if (updateError) {
      throw updateError;
    }

    const users = await fetchAllUsers();
    const transactionsMap = await fetchTransactionsByUser();
    await persistSnapshot(users, transactionsMap);

    res.json({ user: mapUser(updatedUser), users });
  } catch (err) {
    console.error('Erro ao atualizar palavras gratuitas:', err);
    res.status(500).json({ message: 'Não foi possível atualizar as palavras gratuitas do usuário.' });
  }
});

app.post('/users/:id/upgrade', async (req, res) => {
  const userId = Number(req.params.id);

  if (Number.isNaN(userId)) {
    return res.status(400).json({ message: 'ID do usuário inválido.' });
  }

  try {
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ tier: 'premium' })
      .eq('id', userId)
      .select()
      .single();
    if (error) {
      throw error;
    }

    const users = await fetchAllUsers();
    const transactionsMap = await fetchTransactionsByUser();
    await persistSnapshot(users, transactionsMap);

    res.json({ user: mapUser(updatedUser), users });
  } catch (err) {
    console.error('Erro ao atualizar plano do usuário:', err);
    res.status(500).json({ message: 'Não foi possível atualizar o plano do usuário.' });
  }
});

app.use((err, _req, res, _next) => {
  console.error('Erro inesperado:', err);
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
