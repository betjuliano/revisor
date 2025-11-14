import React, { useState } from 'react';
import PixModal from './PixModal';

const PaymentOptions: React.FC = () => {
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);

  return (
    <>
      <div className="bg-slate-800 rounded-lg p-6 shadow-2xl ring-1 ring-slate-700">
        <h3 className="text-xl font-bold mb-2 text-slate-200">Comprar Créditos</h3>
        <p className="text-slate-400 mb-6">Após o pagamento, envie o comprovante via WhatsApp para a liberação manual dos créditos por um administrador.</p>

        <div className="bg-slate-700/50 p-6 rounded-lg mb-6 flex justify-between items-center">
          <div>
            <p className="text-3xl font-bold text-white">5.000 Créditos</p>
            <p className="text-sm text-slate-400 mt-1">(Aproximadamente 5.000 palavras)</p>
          </div>
          <div className="text-3xl font-bold text-green-400">
            R$ 10.00
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mercado Pago Button */}
          <a
            href="https://mpago.li/241DCaL"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#00AEEF] hover:bg-[#009ee3] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center text-center"
          >
            Pagar com Mercado Pago
          </a>

          {/* PIX Button */}
          <button
            onClick={() => setIsPixModalOpen(true)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v4m6-4v4m-6 8v4m6-4v4" />
            </svg>
            Pagar com PIX
          </button>
        </div>

        {/* Send Receipt Button */}
        <div className="mt-6 border-t border-slate-700 pt-6">
          <a
            href="https://wa.me/5555999631365"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center text-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.428-9.889 9.891-.001 2.235.652 4.315 1.731 6.096l.433.896-1.137 4.155 4.274-1.119.867.465z" />
            </svg>
            Enviar Comprovante (WhatsApp)
          </a>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Clique aqui para enviar seu comprovante de pagamento e ter seus créditos liberados.
          </p>
        </div>
      </div>
      {isPixModalOpen && <PixModal onClose={() => setIsPixModalOpen(false)} />}
    </>
  );
};

export default PaymentOptions;