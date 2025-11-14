import {
  addCreditsToUser,
  deductCreditsFromUser,
  fetchAllUsers,
  fetchTransactionsForUser,
  findOrCreateUser,
  incrementFreeWordsForUser,
  refreshSnapshotState,
  upgradeUserTier,
} from '../services/userService.js';
import { databaseReady } from '../services/bootstrapService.js';
import { BadRequestError } from '../utils/errors.js';

function parseUserId(raw) {
  const userId = Number(raw);
  if (Number.isNaN(userId)) {
    throw new BadRequestError('ID do usuário inválido.');
  }
  return userId;
}

async function mutateAndRespond(res, { userId, includeTransactions = false }, operation) {
  const user = await operation();
  const snapshot = await refreshSnapshotState(userId ?? user?.id ?? null, {
    includeTransactions,
    fallbackUser: user,
  });

  const payload = {
    user: snapshot.user ?? user ?? null,
    users: snapshot.users,
  };

  if (includeTransactions) {
    payload.transactions = snapshot.transactions ?? [];
  }

  res.json(payload);
}

export async function login(req, res, next) {
  try {
    await databaseReady;
    const { email, cpf } = req.body ?? {};
    const user = await findOrCreateUser(email, cpf);
    await mutateAndRespond(res, { userId: user.id, includeTransactions: true }, async () => user);
  } catch (error) {
    next(error);
  }
}

export async function getUsers(_req, res, next) {
  try {
    await databaseReady;
    const users = await fetchAllUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function getTransactions(req, res, next) {
  try {
    await databaseReady;
    const userId = parseUserId(req.params.id);
    const transactions = await fetchTransactionsForUser(userId);
    res.json({ transactions });
  } catch (error) {
    next(error);
  }
}

export async function addCredits(req, res, next) {
  try {
    await databaseReady;
    const userId = parseUserId(req.params.id);
    const { amount, method, price } = req.body ?? {};
    await mutateAndRespond(res, { userId, includeTransactions: true }, () =>
      addCreditsToUser(userId, amount, method, price),
    );
  } catch (error) {
    next(error);
  }
}

export async function useCredits(req, res, next) {
  try {
    await databaseReady;
    const userId = parseUserId(req.params.id);
    const { wordCount } = req.body ?? {};
    await mutateAndRespond(res, { userId }, () => deductCreditsFromUser(userId, wordCount));
  } catch (error) {
    next(error);
  }
}

export async function useFreeWords(req, res, next) {
  try {
    await databaseReady;
    const userId = parseUserId(req.params.id);
    const { wordCount } = req.body ?? {};
    await mutateAndRespond(res, { userId }, () => incrementFreeWordsForUser(userId, wordCount));
  } catch (error) {
    next(error);
  }
}

export async function upgrade(req, res, next) {
  try {
    await databaseReady;
    const userId = parseUserId(req.params.id);
    await mutateAndRespond(res, { userId }, () => upgradeUserTier(userId));
  } catch (error) {
    next(error);
  }
}
