'use client';

import { useState } from 'react';
import { Trash2, DollarSign, TrendingUp } from 'lucide-react';
import { Position } from '@/types';
import { useLiquidity } from '@/hooks/useLiquidity';
import { formatTokenAmount, shortenAddress } from '@/lib/utils';
import { SUPPORTED_TOKENS } from '@/contracts/addresses';

interface PositionCardProps {
  position: Position;
  onRemoved?: () => void;
}

export default function PositionCard({ position, onRemoved }: PositionCardProps) {
  const { removeLiquidity, isRemoving } = useLiquidity();
  const [showConfirm, setShowConfirm] = useState(false);

  const token0 = SUPPORTED_TOKENS.find(t => t.address === position.token0);
  const token1 = SUPPORTED_TOKENS.find(t => t.address === position.token1);

  const handleRemove = async () => {
    const success = await removeLiquidity(position.id);
    if (success && onRemoved) {
      onRemoved();
    }
    setShowConfirm(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold ring-2 ring-white dark:ring-gray-900">
              {token0?.symbol.charAt(0)}
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold ring-2 ring-white dark:ring-gray-900">
              {token1?.symbol.charAt(0)}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold">
              {token0?.symbol} / {token1?.symbol}
            </h3>
            <p className="text-sm text-gray-500">
              Position #{position.id.toString()}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-sm font-medium">
          {Number(position.fee) / 10000}% Fee
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Liquidity</span>
          </div>
          <p className="text-xl font-bold">
            {formatTokenAmount(position.liquidity, 18, 4)}
          </p>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Range</span>
          </div>
          <p className="text-sm font-medium">
            {position.tickLower} → {position.tickUpper}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {token0?.symbol} Owed
          </span>
          <span className="font-medium">
            {formatTokenAmount(position.tokensOwed0, token0?.decimals || 18)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {token1?.symbol} Owed
          </span>
          <span className="font-medium">
            {formatTokenAmount(position.tokensOwed1, token1?.decimals || 18)}
          </span>
        </div>
      </div>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={position.liquidity === BigInt(0)}
          className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          Remove Liquidity
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            Are you sure you want to remove this position?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              {isRemoving ? 'Removing...' : 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


