import React, { useState, useCallback } from 'react';
import { PromptKey } from '../types';
import { PROMPTS } from '../constants';
import { generateReview } from '../services/geminiService';
import PromptSelector from './PromptSelector';
import OutputDisplay from './OutputDisplay';
import UpgradeModal from './UpgradeModal';
import { useAuth } from '../contexts/AuthContext';

interface MainAppProps {
  onNavigateToBilling: () => void;
}

const MainApp: React.FC<MainAppProps> = ({ onNavigateToBilling }) => {
  const { user, useCredits, useFreeWords, FREE_WORD_LIMIT } = useAuth();
  // Destructure user properties with defaults to prevent errors on logout
  const { credits = 0, freeWordsUsed = 0, tier = 'free' } = user || {};

  const [selectedPrompt, setSelectedPrompt] = useState<PromptKey>(PromptKey.REVISOR_PERIODICO);
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const getButtonState = () => {
    if (isLoading) {
      return { disabled: true, text: 'Processando...' };
    }
    if (!inputText.trim()) {
      return { disabled: true, text: 'Gerar Revisão' };
    }
    
    const wordCount = inputText.trim().split(/\s+/).length;

    if (tier === 'free') {
        const remainingWords = FREE_WORD_LIMIT - freeWordsUsed;
        if (wordCount > remainingWords) {
            return { disabled: false, text: `Precisa de ${wordCount} palavras - Fazer Upgrade` };
        }
    }
    
    if (tier === 'premium' && credits < wordCount) {
        return { disabled: false, text: `Créditos Insuficientes (Precisa de ${wordCount})` };
    }

    return { disabled: false, text: 'Gerar Revisão' };
  };

  const buttonState = getButtonState();

  const handleSubmit = useCallback(async () => {
    if (!user) return;
    
    const wordCount = inputText.trim().split(/\s+/).length;
    setError(null);

    if (user.tier === 'free') {
        const remainingWords = FREE_WORD_LIMIT - freeWordsUsed;
        if (wordCount > remainingWords) {
            setError(`Você precisa de ${wordCount} palavras, mas só tem ${remainingWords} palavras gratuitas restantes.`);
            setIsUpgradeModalOpen(true);
            return;
        }
    } else if (user.tier === 'premium') {
        if (credits < wordCount) {
            setError(`Você precisa de ${wordCount} créditos para esta revisão, mas você só tem ${credits}.`);
            setIsUpgradeModalOpen(true);
            return;
        }
    }

    setIsLoading(true);
    setOutputText('');

    try {
      const systemInstruction = PROMPTS[selectedPrompt].systemInstruction;
      const result = await generateReview(systemInstruction, inputText);
      setOutputText(result);

      if (user.tier === 'free') {
        useFreeWords(wordCount);
      } else {
        useCredits(wordCount);
      }
    } catch (e: any) {
      setError(e.message || "Ocorreu um erro desconhecido.");
    } finally {
      setIsLoading(false);
    }
  }, [inputText, selectedPrompt, user, credits, freeWordsUsed, useCredits, useFreeWords, FREE_WORD_LIMIT]);

  const handleButtonClick = () => {
    const wordCount = inputText.trim().split(/\s+/).length;
    if (isLoading || !wordCount) return;

    if (tier === 'free') {
        const remainingWords = FREE_WORD_LIMIT - freeWordsUsed;
        if (wordCount > remainingWords) {
            setIsUpgradeModalOpen(true);
            return;
        }
    }
    
    if (tier === 'premium' && credits < wordCount) {
        setIsUpgradeModalOpen(true);
        return;
    }
    
    handleSubmit();
  };

  return (
    <>
        <main className="container mx-auto px-4 py-4 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-800 rounded-lg p-4 sm:p-6 shadow-2xl ring-1 ring-slate-700 flex flex-col">
              <PromptSelector selectedPrompt={selectedPrompt} onSelectPrompt={setSelectedPrompt} />
              <div className="flex-grow flex flex-col">
                <label htmlFor="manuscript" className="sr-only">Manuscript Text</label>
                <textarea
                  id="manuscript"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Cole seu manuscrito ou o texto do artigo aqui..."
                  className="w-full flex-grow bg-slate-900/70 text-slate-300 rounded-md p-3 text-base leading-relaxed resize-none border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  rows={15}
                  disabled={isLoading}
                ></textarea>
              </div>
              <button
                onClick={handleButtonClick}
                disabled={isLoading || !inputText.trim()}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-200 ease-in-out flex items-center justify-center shadow-lg"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </>
                ) : (
                  buttonState.text
                )}
              </button>
            </div>
            <div className="flex flex-col">
               <OutputDisplay outputText={outputText} isLoading={isLoading} error={error} />
            </div>
          </div>
        </main>
      {isUpgradeModalOpen && <UpgradeModal onClose={() => setIsUpgradeModalOpen(false)} onNavigateToBilling={onNavigateToBilling} />}
    </>
  );
};

export default MainApp;