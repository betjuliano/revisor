
import React from 'react';
import { PromptKey } from '../types';
import { PROMPTS } from '../constants';

interface PromptSelectorProps {
  selectedPrompt: PromptKey;
  onSelectPrompt: (prompt: PromptKey) => void;
}

const PromptSelector: React.FC<PromptSelectorProps> = ({ selectedPrompt, onSelectPrompt }) => {
  return (
    <div>
      <div className="flex space-x-2 border-b border-slate-700 mb-4">
        {Object.values(PromptKey).map((key) => {
          const isActive = selectedPrompt === key;
          return (
            <button
              key={key}
              onClick={() => onSelectPrompt(key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 ${
                isActive
                  ? 'bg-slate-700 text-white border-b-2 border-blue-400'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {PROMPTS[key].title}
            </button>
          );
        })}
      </div>
      <div className="p-1 mb-4 text-slate-300">
        <h3 className="font-semibold text-white">{PROMPTS[selectedPrompt].title}</h3>
        <p className="text-sm text-slate-400">{PROMPTS[selectedPrompt].description}</p>
      </div>
    </div>
  );
};

export default PromptSelector;
