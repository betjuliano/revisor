import React, { useState, useCallback } from 'react';

interface PixModalProps {
  onClose: () => void;
}

const PIX_KEY = '95311947004';
const PIX_NAME = 'Juliano Nunes Alves';

const PixModal: React.FC<PixModalProps> = ({ onClose }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(PIX_KEY).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    });
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-2xl p-8 max-w-md w-full text-white ring-1 ring-slate-700 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-center">Pagar com PIX</h2>
        <p className="text-slate-400 mb-6 text-center">Use os detalhes abaixo para sua transferência PIX.</p>
        
        <div className="space-y-4 bg-slate-900/50 p-6 rounded-lg mb-6">
            <div>
                <span className="text-sm text-slate-400">Nome:</span>
                <p className="text-lg font-semibold text-slate-200">{PIX_NAME}</p>
            </div>
             <div>
                <span className="text-sm text-slate-400">Chave PIX (CPF):</span>
                <div className="relative">
                    <input
                        type="text"
                        readOnly
                        value={PIX_KEY}
                        className="w-full bg-slate-800 text-slate-300 rounded-md p-3 pr-20 border border-slate-700 font-mono"
                    />
                    <button
                        onClick={handleCopy}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-slate-300 bg-slate-700/80 hover:bg-slate-700 rounded-r-md transition-colors"
                    >
                        {isCopied ? 'Copiado!' : 'Copiar'}
                    </button>
                </div>
            </div>
        </div>

        <p className="text-center text-slate-400 text-sm mb-6">
          Após pagar, lembre-se de enviar o comprovante via WhatsApp para receber seus créditos.
        </p>

        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default PixModal;