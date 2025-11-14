import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email.trim() && cpf.trim()) {
        const success = login(email.trim(), cpf.trim());
        if (!success) {
            setError('Falha no login. Por favor, verifique suas credenciais.');
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
      <div className="text-center max-w-2xl w-full">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
          Bem-vindo ao Revisor de Artigos Acadêmicos AI
        </h1>
        <p className="text-slate-400 mt-4 text-lg">
          Receba feedback especializado de IA para sua escrita acadêmica. Faça login para continuar.
        </p>
        <form onSubmit={handleLogin} className="mt-8 max-w-sm mx-auto">
            {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md mb-4">{error}</p>}
            <div className="mb-4">
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    className="w-full bg-slate-800 text-white placeholder-slate-500 px-4 py-3 rounded-md border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                />
            </div>
            <div className="mb-4">
                <label htmlFor="cpf" className="sr-only">CPF</label>
                <input
                    id="cpf"
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="Digite seu CPF"
                    className="w-full bg-slate-800 text-white placeholder-slate-500 px-4 py-3 rounded-md border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                />
                 <p className="text-xs text-slate-500 mt-2">
                    Um CPF é necessário para o acesso gratuito (1000 palavras). Isto é uma simulação.
                </p>
            </div>
          <button
            type="submit"
            disabled={!email.trim() || !cpf.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
          >
            Entrar / Registrar
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-12">
          Ao entrar, você concorda com nossos Termos de Serviço simulados.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;