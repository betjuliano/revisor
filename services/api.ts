import type { TransactionMethod } from '../contexts/AuthContext';

const DEFAULT_API_BASE_URL = 'http://localhost:4000';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
  ? String(import.meta.env.VITE_API_BASE_URL)
  : DEFAULT_API_BASE_URL;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = 'Falha ao comunicar com o servidor.';
    try {
      const errorBody = await response.json();
      if (errorBody?.message) {
        message = errorBody.message;
      }
    } catch (_) {
      // Ignore JSON parsing errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    // No content
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  tier: 'free' | 'premium';
  role: 'user' | 'admin';
  cpf: string;
  credits: number;
  freeWordsUsed: number;
}

export interface ApiTransaction {
  id: number;
  userId: number;
  credits: number;
  amount: number;
  method: TransactionMethod;
  createdAt: string;
}

export async function loginRequest(email: string, cpf: string) {
  return request<{ user: ApiUser; users: ApiUser[]; transactions: ApiTransaction[] }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, cpf }),
  });
}

export async function fetchUsersRequest() {
  return request<{ users: ApiUser[] }>('/users');
}

export async function addCreditsRequest(userId: number, amount: number, method: TransactionMethod, price?: number) {
  return request<{ user: ApiUser; users: ApiUser[]; transactions: ApiTransaction[] }>(`/users/${userId}/credits`, {
    method: 'POST',
    body: JSON.stringify({ amount, method, price }),
  });
}

export async function useCreditsRequest(userId: number, wordCount: number) {
  return request<{ user: ApiUser; users: ApiUser[] }>(`/users/${userId}/credits/use`, {
    method: 'POST',
    body: JSON.stringify({ wordCount }),
  });
}

export async function useFreeWordsRequest(userId: number, wordCount: number) {
  return request<{ user: ApiUser; users: ApiUser[] }>(`/users/${userId}/free-words`, {
    method: 'POST',
    body: JSON.stringify({ wordCount }),
  });
}

export async function upgradeUserRequest(userId: number) {
  return request<{ user: ApiUser; users: ApiUser[] }>(`/users/${userId}/upgrade`, {
    method: 'POST',
  });
}

export async function fetchTransactionsForUser(userId: number) {
  return request<{ transactions: ApiTransaction[] }>(`/users/${userId}/transactions`);
}
