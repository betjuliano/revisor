import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UpgradeModalProps {
  onClose: () => void;
  onNavigateToBilling: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, onNavigateToBilling }) => {
  const { user } = useAuth();

  const handleNavigate = () => {
    onNavigateToBilling();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-2xl p-8 max-w-md w-full text-white ring-1 ring-slate-700 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
          {user?.tier === 'free' ? 'Fazer Upgrade para Premium' : 'Obter Mais Créditos'}
        </h2>
        
        {user?.tier === 'free' ? (
          <p className="text-slate-400 mb-6">
            Você atingiu seu limite de palavras gratuitas. Faça o upgrade para desbloquear revisões ilimitadas e comprar créditos.
          </p>
        ) : (
           <p className="text-slate-400 mb-6">
            Você precisa de mais créditos para processar esta solicitação. Vá para a página de cobrança para comprar mais.
          </p>
        )}
        
        <div className="bg-slate-700/50 p-6 rounded-lg mb-6 text-center">
            <p className="text-4xl font-bold text-white">5.000</p>
            <p className="text-slate-300">Créditos</p>
            <p className="text-sm text-slate-400 mt-2">(Aproximadamente 5.000 palavras)</p>
            <div className="mt-4 text-3xl font-bold text-green-400">
                R$ 10.00
            </div>
        </div>

        <button
          onClick={handleNavigate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 shadow-lg"
        >
          Ir para a Página de Cobrança
        </button>
        <button
          onClick={onClose}
          className="w-full mt-3 text-slate-400 hover:text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          Talvez Depois
        </button>
      </div>
    </div>
  );
};

export default UpgradeModal;