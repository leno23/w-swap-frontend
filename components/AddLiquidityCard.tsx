'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import TokenSelect from './TokenSelect';
import { Token } from '@/types';
import { useLiquidity } from '@/hooks/useLiquidity';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { formatTokenAmount, parseTokenAmount } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AddLiquidityCard() {
  const [token0, setToken0] = useState<Token | null>(null);
  const [token1, setToken1] = useState<Token | null>(null);
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');

  const { addLiquidity, isAdding } = useLiquidity();
  const { balance: balance0 } = useTokenBalance(token0?.address);
  const { balance: balance1 } = useTokenBalance(token1?.address);

  const handleAddLiquidity = async () => {
    if (!token0 || !token1 || !amount0 || !amount1) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount0Wei = parseTokenAmount(amount0, token0.decimals);
    const amount1Wei = parseTokenAmount(amount1, token1.decimals);

    if (amount0Wei > balance0) {
      toast.error(`Insufficient ${token0.symbol} balance`);
      return;
    }

    if (amount1Wei > balance1) {
      toast.error(`Insufficient ${token1.symbol} balance`);
      return;
    }

    const success = await addLiquidity(
      token0.address,
      token1.address,
      amount0Wei,
      amount1Wei
    );

    if (success) {
      setAmount0('');
      setAmount1('');
    }
  };

  const isValid = token0 && token1 && amount0 && amount1 && 
                  parseFloat(amount0) > 0 && parseFloat(amount1) > 0;

  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Plus className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Add Liquidity</h2>
      </div>

      {/* Token 0 */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Token 1</label>
          {token0 && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Balance: {formatTokenAmount(balance0, token0.decimals)}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={amount0}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setAmount0(value);
              }
            }}
            placeholder={token0 ? "0.0" : "Select token 1 first"}
            disabled={!token0}
            className="flex-1 px-4 py-4 text-2xl bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-transparent focus:border-primary-500 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <TokenSelect
            selectedToken={token0}
            onSelect={setToken0}
            excludeToken={token1}
          />
        </div>
        {token0 && balance0 > 0 && (
          <button
            onClick={() => setAmount0(formatTokenAmount(balance0, token0.decimals))}
            className="mt-1 text-sm text-primary-500 hover:text-primary-600 font-medium"
          >
            Max
          </button>
        )}
      </div>

      {/* Token 1 */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Token 2</label>
          {token1 && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Balance: {formatTokenAmount(balance1, token1.decimals)}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={amount1}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setAmount1(value);
              }
            }}
            placeholder={token1 ? "0.0" : "Select token 2 first"}
            disabled={!token1}
            className="flex-1 px-4 py-4 text-2xl bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-transparent focus:border-primary-500 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <TokenSelect
            selectedToken={token1}
            onSelect={setToken1}
            excludeToken={token0}
          />
        </div>
        {token1 && balance1 > 0 && (
          <button
            onClick={() => setAmount1(formatTokenAmount(balance1, token1.decimals))}
            className="mt-1 text-sm text-primary-500 hover:text-primary-600 font-medium"
          >
            Max
          </button>
        )}
      </div>

      {/* Info Box */}
      {token0 && token1 && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Pool Pair</span>
              <span className="font-medium">{token0.symbol} / {token1.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Fee Tier</span>
              <span className="font-medium">0.3%</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={handleAddLiquidity}
        disabled={!isValid || isAdding}
        className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-800 text-white font-bold rounded-xl transition-all disabled:cursor-not-allowed"
      >
        {isAdding ? 'Adding Liquidity...' : !isValid ? 'Enter amounts' : 'Add Liquidity'}
      </button>
    </div>
  );
}

