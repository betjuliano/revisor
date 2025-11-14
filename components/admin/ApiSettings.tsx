import React, { useState } from 'react';

const ApiSettings: React.FC = () => {
  const [geminiKey, setGeminiKey] = useState('sk-********************');
  const [gptKey, setGptKey] = useState('sk-********************');
  const [otherKey, setOtherKey] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would make an API call to a secure backend
    alert('Configurações de API salvas (simulado).');
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-2xl ring-1 ring-slate-700">
      <h3 className="text-2xl font-bold mb-6 text-slate-200">Gerenciamento de Chaves de API</h3>
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label htmlFor="geminiKey" className="block text-sm font-medium text-slate-300 mb-2">
            Chave da API Gemini
          </label>
          <input
            id="geminiKey"
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            className="w-full bg-slate-900/70 text-slate-300 rounded-md p-3 border border-slate-700 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="gptKey" className="block text-sm font-medium text-slate-300 mb-2">
            Chave da API GPT
          </label>
          <input
            id="gptKey"
            type="password"
            value={gptKey}
            onChange={(e) => setGptKey(e.target.value)}
            className="w-full bg-slate-900/70 text-slate-300 rounded-md p-3 border border-slate-700 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="otherKey" className="block text-sm font-medium text-slate-300 mb-2">
            Chave de API de Outro Serviço
          </label>
          <input
            id="otherKey"
            type="password"
            value={otherKey}
            onChange={(e) => setOtherKey(e.target.value)}
            placeholder="Digite outra chave de API"
            className="w-full bg-slate-900/70 text-slate-300 rounded-md p-3 border border-slate-700 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
          >
            Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApiSettings;