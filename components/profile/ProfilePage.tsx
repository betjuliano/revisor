import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PaymentOptions from './PaymentOptions';
import BillingHistory from './BillingHistory';

const ProfilePage: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return <p>Carregando...</p>;
    }

    return (
        <main className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-6 text-slate-200 border-b border-slate-700 pb-2">Perfil e Cobrança</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: User Info & Payment */}
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-slate-800 rounded-lg p-6 shadow-2xl ring-1 ring-slate-700">
                        <h3 className="text-xl font-bold mb-4 text-slate-200">Detalhes da Conta</h3>
                        <div className="space-y-2 text-slate-300">
                            <p><strong>Nome:</strong> {user.name}</p>
                            <p><strong>E-mail:</strong> {user.email}</p>
                            <p><strong>CPF:</strong> {user.cpf}</p>
                            <p><strong>Plano da Conta:</strong> 
                                <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${user.tier === 'premium' ? 'bg-blue-900 text-blue-300' : 'bg-slate-600 text-slate-300'}`}>
                                    {user.tier}
                                </span>
                            </p>
                        </div>
                    </div>
                    <PaymentOptions />
                </div>

                {/* Right Column: Billing History */}
                <div className="md:col-span-1">
                    <BillingHistory />
                </div>
            </div>
        </main>
    );
};

export default ProfilePage;