import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const BillingHistory: React.FC = () => {
    const { transactions } = useAuth();

    return (
        <div className="bg-slate-800 rounded-lg p-6 shadow-2xl ring-1 ring-slate-700 h-full">
            <h3 className="text-xl font-bold mb-4 text-slate-200">Histórico de Cobrança</h3>
            {transactions.length === 0 ? (
                <p className="text-slate-400">Nenhuma transação ainda.</p>
            ) : (
                <div className="space-y-3">
                    {transactions.map((tx, index) => (
                        <div key={index} className="bg-slate-700/50 p-3 rounded-md flex justify-between items-center text-sm">
                           <div>
                             <p className="font-semibold text-slate-200">
                                +{tx.credits.toLocaleString()} Créditos
                             </p>
                             <p className="text-xs text-slate-400">
                                {tx.date} - {tx.method}
                             </p>
                           </div>
                           <div className="font-mono text-green-400">
                             R$ {tx.amount.toFixed(2)}
                           </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BillingHistory;