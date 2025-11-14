import React, { useState } from 'react';
import UserManagement from './UserManagement';
import ApiSettings from './ApiSettings';

type AdminTab = 'users' | 'settings';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  return (
    <main className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6 text-slate-200 border-b border-slate-700 pb-2">Painel do Administrador</h2>
      <div className="flex space-x-2 border-b border-slate-700 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors duration-200 focus:outline-none ${
            activeTab === 'users' ? 'bg-slate-700 text-white border-b-2 border-blue-400' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          Gerenciamento de Usuários
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors duration-200 focus:outline-none ${
            activeTab === 'settings' ? 'bg-slate-700 text-white border-b-2 border-blue-400' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          Configurações da API
        </button>
      </div>
      
      <div>
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'settings' && <ApiSettings />}
      </div>
    </main>
  );
};

export default AdminPanel;