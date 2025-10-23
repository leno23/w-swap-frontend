'use client';

import { usePools } from '@/hooks/usePools';
import { Loader2, RefreshCw, Droplets, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PoolList() {
  const { pools, isLoading, error, refetch } = usePools();

  // 计算价格（从 sqrtPriceX96）
  const calculatePrice = (sqrtPriceX96: bigint, decimals0: number, decimals1: number): string => {
    if (sqrtPriceX96 === BigInt(0)) return '0';
    
    try {
      // price = (sqrtPriceX96 / 2^96) ^ 2
      const sqrtPrice = Number(sqrtPriceX96) / Math.pow(2, 96);
      const price = Math.pow(sqrtPrice, 2);
      
      // 调整小数位
      const adjustedPrice = price * Math.pow(10, decimals0 - decimals1);
      
      return adjustedPrice.toFixed(6);
    } catch (e) {
      return 'N/A';
    }
  };

  // 格式化流动性
  const formatLiquidity = (liquidity: bigint): string => {
    if (liquidity === BigInt(0)) return '0';
    return liquidity.toString();
  };

  // 缩短地址显示
  const shortenAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading pools...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Droplets className="w-6 h-6 text-primary-500" />
          <h2 className="text-2xl font-bold">Liquidity Pools</h2>
        </div>
        <button
          onClick={refetch}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 hover:rotate-180 hover:scale-110"
          title="Refresh pools"
        >
          <RefreshCw className="w-5 h-5 transition-transform" />
        </button>
      </div>

      {pools.length === 0 ? (
        <div className="text-center py-12">
          <Droplets className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">No liquidity pools found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Create a pool by adding liquidity above
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pools.map((pool, index) => (
            <div
              key={`${pool.address}-${index}`}
              className="group p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-transparent hover:border-primary-500/50 dark:hover:bg-gray-750 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 cursor-pointer"
            >
              {/* Pool Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {pool.token0Symbol || 'Unknown'}
                    </span>
                    <span className="text-gray-400">/</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {pool.token1Symbol || 'Unknown'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors duration-300">
                    Index: {pool.index}
                  </span>
                </div>
                <TrendingUp className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform duration-300" />
              </div>

              {/* Pool Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="group/item p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Liquidity</p>
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white group-hover/item:text-primary-600 dark:group-hover/item:text-primary-400 transition-colors">
                    {formatLiquidity(pool.liquidity)}
                  </p>
                </div>
                <div className="group/item p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Price ({pool.token1Symbol}/{pool.token0Symbol})
                  </p>
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white group-hover/item:text-primary-600 dark:group-hover/item:text-primary-400 transition-colors">
                    {calculatePrice(pool.sqrtPriceX96, pool.token0Decimals || 18, pool.token1Decimals || 18)}
                  </p>
                </div>
                <div className="group/item p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Tick</p>
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white group-hover/item:text-primary-600 dark:group-hover/item:text-primary-400 transition-colors">
                    {pool.tick}
                  </p>
                </div>
                <div className="group/item p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pool Address</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(pool.address);
                    }}
                    className="text-sm font-mono text-primary-500 hover:text-primary-600 hover:underline hover:scale-105 transition-all duration-200"
                    title="Click to copy"
                  >
                    {shortenAddress(pool.address)}
                  </button>
                </div>
              </div>

              {/* Token Addresses */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Token0: </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(pool.token0);
                      }}
                      className="font-mono text-gray-600 dark:text-gray-300 hover:text-primary-500 hover:underline transition-all duration-200"
                      title="Click to copy"
                    >
                      {shortenAddress(pool.token0)}
                    </button>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Token1: </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(pool.token1);
                      }}
                      className="font-mono text-gray-600 dark:text-gray-300 hover:text-primary-500 hover:underline transition-all duration-200"
                      title="Click to copy"
                    >
                      {shortenAddress(pool.token1)}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {pools.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total Pools</span>
            <span className="font-bold text-gray-900 dark:text-white">{pools.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}

