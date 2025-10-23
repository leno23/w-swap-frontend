'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Token } from '@/types';
import { SUPPORTED_TOKENS } from '@/contracts/addresses';

interface TokenSelectProps {
  selectedToken: Token | null;
  onSelect: (token: Token) => void;
  label?: string;
  excludeToken?: Token | null;
}

export default function TokenSelect({
  selectedToken,
  onSelect,
  label = 'Select Token',
  excludeToken,
}: TokenSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const availableTokens = SUPPORTED_TOKENS.filter(
    (token) => token.address !== excludeToken?.address
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary-500 transition-colors"
      >
        {selectedToken ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
              {selectedToken.symbol.charAt(0)}
            </div>
            <span className="font-medium">{selectedToken.symbol}</span>
          </div>
        ) : (
          <span className="text-gray-500">{label}</span>
        )}
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-auto">
            {availableTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => {
                  onSelect(token);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                  {token.symbol.charAt(0)}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{token.symbol}</div>
                  <div className="text-xs text-gray-500">{token.name}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


