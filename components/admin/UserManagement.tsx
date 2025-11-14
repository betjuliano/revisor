import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement: React.FC = () => {
  const { users, addCreditsToUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState<number>(5000);

  const handleAddCredits = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId && creditsToAdd > 0) {
      addCreditsToUser(selectedUserId, creditsToAdd);
      setSelectedUserId(null);
      setCreditsToAdd(5000);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-2xl ring-1 ring-slate-700">
        <h3 className="text-2xl font-bold mb-4 text-slate-200">Gerenciar Usuários</h3>

        {/* Add Credits Form */}
        <form onSubmit={handleAddCredits} className="mb-6 bg-slate-900/50 p-4 rounded-md flex items-end space-x-4">
            <div>
                <label htmlFor="user-select" className="block text-sm font-medium text-slate-300 mb-1">Selecionar Usuário</label>
                <select 
                    id="user-select"
                    value={selectedUserId ?? ''}
                    onChange={(e) => setSelectedUserId(Number(e.target.value))}
                    className="bg-slate-800 text-slate-300 rounded-md p-2 border border-slate-700 focus:ring-2 focus:ring-blue-500 w-full"
                >
                    <option value="" disabled>Selecione um usuário...</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                        </option>
                    ))}
                </select>
            </div>
             <div>
                <label htmlFor="credits-to-add" className="block text-sm font-medium text-slate-300 mb-1">Créditos</label>
                <input 
                    type="number"
                    id="credits-to-add"
                    value={creditsToAdd}
                    onChange={(e) => setCreditsToAdd(Number(e.target.value))}
                    className="bg-slate-800 text-slate-300 rounded-md p-2 border border-slate-700 focus:ring-2 focus:ring-blue-500 w-48"
                    min="1"
                    step="100"
                />
            </div>
            <button 
                type="submit"
                disabled={!selectedUserId}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
                Adicionar Créditos
            </button>
        </form>

        {/* Users Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-400">
            <thead className="text-xs text-slate-300 uppercase bg-slate-700/50">
                <tr>
                <th scope="col" className="px-6 py-3">ID</th>
                <th scope="col" className="px-6 py-3">Nome</th>
                <th scope="col" className="px-6 py-3">E-mail</th>
                <th scope="col" className="px-6 py-3">Plano</th>
                <th scope="col" className="px-6 py-3 text-right">Créditos / Palavras Usadas</th>
                </tr>
            </thead>
            <tbody>
                {users.map((user) => (
                <tr key={user.id} className="bg-slate-800/50 border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="px-6 py-4">{user.id}</td>
                    <th scope="row" className="px-6 py-4 font-medium text-slate-200 whitespace-nowrap">{user.name}</th>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.tier === 'premium' ? 'bg-blue-900 text-blue-300' : 'bg-slate-600 text-slate-300'}`}>
                            {user.tier}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">
                        {user.tier === 'premium' ? `${user.credits.toLocaleString()}` : `${user.freeWordsUsed.toLocaleString()} / 1.000`}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
    </div>
  );
};

export default UserManagement;