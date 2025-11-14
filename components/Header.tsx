import React from 'react';
import { useAuth } from '../contexts/AuthContext';

type View = 'app' | 'admin' | 'profile';

interface HeaderProps {
    currentView: View;
    onNavigate: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  // Fix: Combined useAuth calls and correctly destructured credits and freeWordsUsed from the user object.
  const { user, logout, FREE_WORD_LIMIT } = useAuth();
  const { credits = 0, freeWordsUsed = 0 } = user || {};

  return (
    <header className="p-4 md:p-6 text-white border-b border-slate-800">
      <div className="container mx-auto flex justify-between items-center">
        <div 
            className="text-left cursor-pointer"
            onClick={() => onNavigate('app')}
            title="Voltar ao App"
        >
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
              Academic Article Reviewer AI
            </h1>
            <p className="text-slate-400 mt-1 text-sm hidden md:block">
              Receba feedback especializado de IA para sua escrita acadêmica.
            </p>
        </div>
        
        {user && (
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="text-right">
                <p className="font-semibold text-slate-200 text-sm">{user.name}</p>
                 {user.tier === 'premium' ? (
                    <p className="text-xs text-blue-300 font-mono" title={`${credits} palavras restantes`}>
                        Créditos: {credits.toLocaleString()}
                    </p>
                ) : (
                    <p className="text-xs text-slate-400">
                        Palavras Grátis: {(FREE_WORD_LIMIT - freeWordsUsed).toLocaleString()}/{FREE_WORD_LIMIT.toLocaleString()}
                    </p>
                )}
            </div>
             {currentView !== 'profile' && (
                <button 
                    onClick={() => onNavigate('profile')}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-2 px-4 rounded-md text-sm transition-colors duration-200">
                    Créditos
                </button>
            )}
            {user.role === 'admin' && currentView !== 'admin' && (
                 <button 
                    onClick={() => onNavigate('admin')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200 shadow-md">
                     Painel Admin
                 </button>
            )}
             {currentView !== 'app' && (
                 <button 
                    onClick={() => onNavigate('app')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors duration-200 shadow-md">
                     Voltar ao App
                 </button>
            )}
            <button 
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors duration-200">
                Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;