import React, { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
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

type MutationResponse = { user: ApiUser; users: ApiUser[]; transactions?: ApiTransaction[] };

type MutationOptions = {
  includeTransactions?: boolean;
  focusUserId?: number | null;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const runWithLoader = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      return await operation();
    } catch (error) {
      console.error('Erro ao executar operação da API:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyMutationResponse = useCallback(
    (response: MutationResponse, { includeTransactions = false, focusUserId = null }: MutationOptions) => {
      const { users: responseUsers, user: responseUser, transactions: responseTransactions } = response;
      if (Array.isArray(responseUsers)) {
        setUsers(responseUsers);
      }

      const resolvedFocusId = focusUserId ?? responseUser?.id ?? null;
      if (resolvedFocusId != null) {
        const resolvedUser = responseUsers?.find((entry) => entry.id === resolvedFocusId) ??
          (responseUser && responseUser.id === resolvedFocusId ? responseUser : null);
        if (resolvedUser) {
          setCurrentUser(resolvedUser);
        }
      }

      if (includeTransactions && Array.isArray(responseTransactions)) {
        setTransactions(responseTransactions);
      }

      return response;
    },
    [],
  );

  const performUserMutation = useCallback(
    async (
      apiCall: () => Promise<MutationResponse>,
      options: MutationOptions = {},
    ): Promise<MutationResponse> => {
      const response = await runWithLoader(apiCall);
      return applyMutationResponse(response, options);
    },
    [applyMutationResponse, runWithLoader],
  );

  const login = useCallback(async (email: string, cpf: string): Promise<boolean> => {
    try {
      await performUserMutation(() => loginRequest(email, cpf), { includeTransactions: true });
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Erro ao autenticar usuário:', error);
      setIsAuthenticated(false);
      return false;
    }
  }, [performUserMutation]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setTransactions([]);
  }, []);

  const refreshUsers = useCallback(async () => {
    const { users: fetchedUsers } = await runWithLoader(fetchUsersRequest);
    setUsers(fetchedUsers);
    setCurrentUser((previous) => {
      if (!previous) {
        return null;
      }
      return fetchedUsers.find((entry) => entry.id === previous.id) ?? previous;
    });
  }, [runWithLoader]);

  const addCredits = useCallback(async (amount: number, method: TransactionMethod, price?: number) => {
    if (!currentUser) {
      return;
    }
    await performUserMutation(
      () => addCreditsRequest(currentUser.id, amount, method, price),
      { includeTransactions: true },
    );
  }, [currentUser, performUserMutation]);

  const useCredits = useCallback(async (wordCount: number) => {
    if (!currentUser) {
      return;
    }
    await performUserMutation(() => useCreditsRequest(currentUser.id, wordCount));
  }, [currentUser, performUserMutation]);

  const useFreeWords = useCallback(async (wordCount: number) => {
    if (!currentUser) {
      return;
    }
    await performUserMutation(() => useFreeWordsRequest(currentUser.id, wordCount));
  }, [currentUser, performUserMutation]);

  const upgradeToPremium = useCallback(async () => {
    if (!currentUser) {
      return;
    }
    await performUserMutation(() => upgradeUserRequest(currentUser.id));
  }, [currentUser, performUserMutation]);

  const addCreditsToUser = useCallback(
    async (
      userId: number,
      amount: number,
      method: TransactionMethod = 'Crédito do Admin',
      price?: number,
    ) => {
      const activeUserId = currentUser?.id ?? null;
      const response = await performUserMutation(
        () => addCreditsRequest(userId, amount, method, price),
        {
          includeTransactions: activeUserId != null && activeUserId === userId,
          focusUserId: activeUserId,
        },
      );

      if (activeUserId != null && activeUserId !== userId) {
        const { users: updatedUsers } = response;
        setCurrentUser((previous) => {
          if (!previous) {
            return null;
          }
          const refreshed = updatedUsers.find((entry) => entry.id === previous.id);
          return refreshed ?? previous;
        });
      }

      if (userId === activeUserId) {
        alert(`Adicionados ${amount.toLocaleString()} créditos com sucesso ao seu saldo.`);
      } else {
        alert(`Adicionados ${amount.toLocaleString()} créditos com sucesso ao usuário ID ${userId}.`);
      }

      if (activeUserId === userId && (!response.transactions || response.transactions.length === 0)) {
        const { transactions: fetchedTransactions } = await runWithLoader(() => fetchTransactionsForUser(userId));
        setTransactions(fetchedTransactions);
      }
    },
    [currentUser, performUserMutation, runWithLoader],
  );

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
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
