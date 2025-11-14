import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import {
  addCreditsRequest,
  fetchTransactionsForUser,
  fetchUsersRequest,
  loginRequest,
  useCreditsRequest,
  useFreeWordsRequest,
  upgradeUserRequest,
  type ApiTransaction,
  type ApiUser,
} from '../services/api';

export const FREE_WORD_LIMIT = 1000;

export type TransactionMethod = 'Mercado Pago' | 'Google Pay' | 'Crédito do Admin' | 'PIX';

export type User = ApiUser;

export type Transaction = ApiTransaction;

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  users: User[];
  transactions: Transaction[];
  login: (email: string, cpf: string) => Promise<boolean>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
  addCredits: (amount: number, method: TransactionMethod, price?: number) => Promise<void>;
  useCredits: (wordCount: number) => Promise<void>;
  useFreeWords: (wordCount: number) => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  addCreditsToUser: (userId: number, amount: number, method?: TransactionMethod, price?: number) => Promise<void>;
  FREE_WORD_LIMIT: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const syncCurrentUser = useCallback((updatedUsers: User[], fallbackUser: User | null = null) => {
    if (!currentUser && !fallbackUser) {
      return;
    }
    const targetId = fallbackUser?.id ?? currentUser?.id;
    if (!targetId) {
      return;
    }
    const nextUser = updatedUsers.find((u) => u.id === targetId) ?? fallbackUser ?? null;
    setCurrentUser(nextUser);
  }, [currentUser]);

  const login = useCallback(async (email: string, cpf: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await loginRequest(email, cpf);
      setCurrentUser(response.user);
      setUsers(response.users);
      setTransactions(response.transactions);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Erro ao autenticar usuário:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setTransactions([]);
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const { users: fetchedUsers } = await fetchUsersRequest();
      setUsers(fetchedUsers);
      syncCurrentUser(fetchedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  }, [syncCurrentUser]);

  const addCredits = useCallback(async (amount: number, method: TransactionMethod, price?: number) => {
    if (!currentUser) return;
    try {
      const response = await addCreditsRequest(currentUser.id, amount, method, price);
      setUsers(response.users);
      setCurrentUser(response.user);
      setTransactions(response.transactions);
    } catch (error) {
      console.error('Erro ao adicionar créditos:', error);
      throw error;
    }
  }, [currentUser]);

  const useCredits = useCallback(async (wordCount: number) => {
    if (!currentUser) return;
    try {
      const response = await useCreditsRequest(currentUser.id, wordCount);
      setUsers(response.users);
      setCurrentUser(response.user);
    } catch (error) {
      console.error('Erro ao debitar créditos:', error);
      throw error;
    }
  }, [currentUser]);

  const useFreeWords = useCallback(async (wordCount: number) => {
    if (!currentUser) return;
    try {
      const response = await useFreeWordsRequest(currentUser.id, wordCount);
      setUsers(response.users);
      setCurrentUser(response.user);
    } catch (error) {
      console.error('Erro ao atualizar palavras gratuitas:', error);
      throw error;
    }
  }, [currentUser]);

  const upgradeToPremium = useCallback(async () => {
    if (!currentUser) return;
    try {
      const response = await upgradeUserRequest(currentUser.id);
      setUsers(response.users);
      setCurrentUser(response.user);
    } catch (error) {
      console.error('Erro ao fazer upgrade de plano:', error);
      throw error;
    }
  }, [currentUser]);

  const addCreditsToUser = useCallback(async (userId: number, amount: number, method: TransactionMethod = 'Crédito do Admin', price?: number) => {
    try {
      const response = await addCreditsRequest(userId, amount, method, price);
      setUsers(response.users);
      if (currentUser && currentUser.id === response.user.id) {
        setCurrentUser(response.user);
        setTransactions(response.transactions);
      } else if (currentUser) {
        syncCurrentUser(response.users);
        if (currentUser.id === userId) {
          const { transactions: fetchedTransactions } = await fetchTransactionsForUser(userId);
          setTransactions(fetchedTransactions);
        }
      }
      if (userId === currentUser?.id) {
        alert(`Adicionados ${amount.toLocaleString()} créditos com sucesso ao seu saldo.`);
      } else {
        alert(`Adicionados ${amount.toLocaleString()} créditos com sucesso ao usuário ID ${userId}.`);
      }
    } catch (error) {
      console.error('Erro ao adicionar créditos para usuário:', error);
      throw error;
    }
  }, [currentUser, syncCurrentUser]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      user: currentUser,
      users,
      transactions,
      login,
      logout,
      refreshUsers,
      addCredits,
      useCredits,
      useFreeWords,
      upgradeToPremium,
      addCreditsToUser,
      FREE_WORD_LIMIT,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};