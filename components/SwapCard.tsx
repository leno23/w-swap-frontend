'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowDown, Settings, Loader2 } from 'lucide-react';
import TokenSelect from './TokenSelect';
import { Token } from '@/types';
import { useSwap } from '@/hooks/useSwap';
import { useQuote } from '@/hooks/useQuote';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { formatTokenAmount, parseTokenAmount, debounce } from '@/lib/utils';
import { DEFAULT_SLIPPAGE, DEBOUNCE_DELAY } from '@/lib/constants';
import toast from 'react-hot-toast';

export default function SwapCard() {
  const [tokenIn, setTokenIn] = useState<Token | null>(null);
  const [tokenOut, setTokenOut] = useState<Token | null>(null);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [showSettings, setShowSettings] = useState(false);
  const [isQuoting, setIsQuoting] = useState(false);

  const { swap, isSwapping } = useSwap();
  const { getQuote } = useQuote();
  const { balance: balanceIn } = useTokenBalance(tokenIn?.address);
  const { balance: balanceOut } = useTokenBalance(tokenOut?.address);

  // 获取报价的函数
  const fetchQuote = async (amount: string) => {
    if (!tokenIn || !tokenOut || !amount || parseFloat(amount) === 0) {
      setAmountOut('');
      return;
    }

    setIsQuoting(true);
    try {
      const amountInWei = parseTokenAmount(amount, tokenIn.decimals);
      const result = await getQuote(
        tokenIn.address,
        tokenOut.address,
        amountInWei
      );

      // 检查是否有错误
      if (result.error) {
        toast.error(result.error);
        setAmountOut('');
        return;
      }

      if (result.amountOut > BigInt(0)) {
        const formatted = formatTokenAmount(result.amountOut, tokenOut.decimals);
        setAmountOut(formatted);
      } else {
        setAmountOut('');
      }
    } catch (error) {
      console.error('Failed to get quote:', error);
      setAmountOut('');
    } finally {
      setIsQuoting(false);
    }
  };

  // 当输入金额或代币改变时，获取报价
  useEffect(() => {
    if (!amountIn || !tokenIn || !tokenOut || parseFloat(amountIn) === 0) {
      setAmountOut('');
      return;
    }

    // 使用 setTimeout 实现防抖
    const timer = setTimeout(() => {
      fetchQuote(amountIn);
    }, DEBOUNCE_DELAY);

    // 清理函数
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountIn, tokenIn?.address, tokenOut?.address]);

  const handleSwap = async () => {
    if (!tokenIn || !tokenOut || !amountIn) {
      toast.error('Please fill in all fields');
      return;
    }

    const amountInWei = parseTokenAmount(amountIn, tokenIn.decimals);
    
    if (amountInWei > balanceIn) {
      toast.error('Insufficient balance');
      return;
    }

    const success = await swap(
      tokenIn.address,
      tokenOut.address,
      amountInWei,
      slippage
    );

    if (success) {
      setAmountIn('');
      setAmountOut('');
    }
  };

  const handleSwitchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOut);
    setAmountOut(amountIn);
  };

  const isValid = tokenIn && tokenOut && amountIn && parseFloat(amountIn) > 0;

  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Swap</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <label className="block text-sm font-medium mb-2">
            Slippage Tolerance
          </label>
          <div className="flex gap-2">
            {[0.1, 0.5, 1.0].map((value) => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  slippage === value
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {value}%
              </button>
            ))}
            <input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
              className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              step="0.1"
              min="0"
              max="50"
            />
          </div>
        </div>
      )}

      {/* From Token */}
      <div className="mb-2">
        <div className="flex justify-between mb-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">From</label>
          {tokenIn && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Balance: {formatTokenAmount(balanceIn, tokenIn.decimals)}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={amountIn}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setAmountIn(value);
              }
            }}
            placeholder={tokenIn ? "0.0" : "Select a token first"}
            disabled={!tokenIn}
            className="flex-1 px-4 py-4 text-2xl bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-transparent focus:border-primary-500 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <TokenSelect
            selectedToken={tokenIn}
            onSelect={setTokenIn}
            excludeToken={tokenOut}
          />
        </div>
        {tokenIn && balanceIn > 0 && (
          <button
            onClick={() => setAmountIn(formatTokenAmount(balanceIn, tokenIn.decimals))}
            className="mt-1 text-sm text-primary-500 hover:text-primary-600 font-medium"
          >
            Max
          </button>
        )}
      </div>

      {/* Switch Button */}
      <div className="flex justify-center -my-2 relative z-10">
        <button
          onClick={handleSwitchTokens}
          className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl border-4 border-white dark:border-gray-900 transition-colors"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>

      {/* To Token */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">To (estimated)</label>
          <div className="flex items-center gap-2">
            {tokenOut && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Balance: {formatTokenAmount(balanceOut, tokenOut.decimals)}
              </span>
            )}
            {isQuoting && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Fetching price...
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={amountOut}
            readOnly
            placeholder="0.0"
            className="flex-1 px-4 py-4 text-2xl bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-transparent outline-none cursor-not-allowed"
          />
          <TokenSelect
            selectedToken={tokenOut}
            onSelect={setTokenOut}
            excludeToken={tokenIn}
          />
        </div>
        {amountOut && tokenOut && (
          <div className="mt-2 text-xs text-gray-500">
            ~ {amountOut} {tokenOut.symbol}
          </div>
        )}
      </div>

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={!isValid || isSwapping}
        className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-800 text-white font-bold rounded-xl transition-all disabled:cursor-not-allowed"
      >
        {isSwapping ? 'Swapping...' : !isValid ? 'Enter an amount' : 'Swap'}
      </button>
    </div>
  );
}

