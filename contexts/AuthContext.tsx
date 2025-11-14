import React, { createContext, useState, useContext, ReactNode } from 'react';

const FREE_WORD_LIMIT = 1000;
const ADMIN_EMAIL = 'admjulianoo@gmail.com';

type User = {
  id: number;
  name: string;
  email: string;
  tier: 'free' | 'premium';
  role: 'user' | 'admin';
  cpf: string;
  credits: number;
  freeWordsUsed: number;
};

type TransactionMethod = 'Mercado Pago' | 'Google Pay' | 'Crédito do Admin' | 'PIX';

type Transaction = {
  date: string;
  amount: number;
  credits: number;
  method: TransactionMethod;
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  users: User[];
  transactions: Transaction[];
  login: (email: string, cpf: string) => boolean;
  logout: () => void;
  addCredits: (amount: number, method: TransactionMethod) => void;
  useCredits: (wordCount: number) => void;
  useFreeWords: (wordCount: number) => void;
  upgradeToPremium: () => void;
  addCreditsToUser: (userId: number, amount: number) => void;
  FREE_WORD_LIMIT: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock database of users
const initialUsers: User[] = [
    { id: 1, name: 'Admin User', email: ADMIN_EMAIL, tier: 'premium', role: 'admin', cpf: '000.000.000-00', credits: 999999, freeWordsUsed: 0 },
    { id: 2, name: 'Premium User', email: 'premium@example.com', tier: 'premium', role: 'user', cpf: '111.111.111-11', credits: 500, freeWordsUsed: 0 },
    { id: 3, name: 'Free User', email: 'free@example.com', tier: 'free', role: 'user', cpf: '222.222.222-22', credits: 0, freeWordsUsed: 250 },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const login = (email: string, cpf: string): boolean => {
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) { // If user doesn't exist, create a new one
        const newUser: User = {
            id: users.length + 1,
            name: `Usuário ${cpf.substring(0,3)}`,
            email,
            cpf,
            tier: 'free',
            role: 'user',
            credits: 0,
            freeWordsUsed: 0,
        };
        setUsers(prev => [...prev, newUser]);
        user = newUser;
    }
    
    setCurrentUser(user);
    setIsAuthenticated(true);
    // Load existing transactions or start fresh
    setTransactions(user.email === 'premium@example.com' ? [
        { date: new Date().toLocaleDateString(), amount: 10, credits: 5000, method: 'Mercado Pago' }
    ] : []);
    
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setTransactions([]);
  };
  
  const updateUserState = (userId: number, updates: Partial<User>) => {
    let updatedUser: User | null = null;
    setUsers(prevUsers => prevUsers.map(u => {
        if (u.id === userId) {
            updatedUser = { ...u, ...updates };
            return updatedUser;
        }
        return u;
    }));
    if (currentUser && currentUser.id === userId && updatedUser) {
        setCurrentUser(updatedUser);
    }
  };

  const addCredits = (amount: number, method: TransactionMethod) => {
    if (!currentUser) return;
    updateUserState(currentUser.id, { credits: currentUser.credits + amount });
    setTransactions(prev => [...prev, {
      date: new Date().toLocaleDateString(),
      amount: (amount / 5000) * 10,
      credits: amount,
      method,
    }]);
  };
  
  const useCredits = (wordCount: number) => {
    if (!currentUser) return;
    updateUserState(currentUser.id, { credits: Math.max(0, currentUser.credits - wordCount) });
  };
  
  const useFreeWords = (wordCount: number) => {
    if (!currentUser) return;
    updateUserState(currentUser.id, { freeWordsUsed: currentUser.freeWordsUsed + wordCount });
  };
  
  const upgradeToPremium = () => {
    if (currentUser) {
        updateUserState(currentUser.id, { tier: 'premium' });
    }
  };
  
  const addCreditsToUser = (userId: number, amount: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    setUsers(prevUsers => {
        const newUsers = prevUsers.map(u => {
            if (u.id === userId) {
                const updates: Partial<User> = { credits: u.credits + amount };
                if (u.tier === 'free') {
                    updates.tier = 'premium';
                }
                return { ...u, ...updates };
            }
            return u;
        });
        
        // Update current user state if they are the one being updated
        if (currentUser && currentUser.id === userId) {
            const updatedUser = newUsers.find(u => u.id === userId);
            if(updatedUser) setCurrentUser(updatedUser);
        }
        
        return newUsers;
    });

    // Add transaction for the user being credited if they are the current user
    if (currentUser && currentUser.id === userId) {
        setTransactions(prev => [...prev, {
            date: new Date().toLocaleDateString(),
            amount: 0,
            credits: amount,
            method: 'Crédito do Admin',
        }]);
    }

    alert(`Adicionados ${amount.toLocaleString()} créditos com sucesso ao usuário ID ${userId}.`);
  };

  return (
    <AuthContext.Provider value={{ 
        isAuthenticated, 
        user: currentUser, 
        users,
        transactions,
        login, 
        logout, 
        addCredits, 
        useCredits,
        useFreeWords,
        upgradeToPremium,
        addCreditsToUser,
        FREE_WORD_LIMIT
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