'use client';

import { useState, useEffect } from 'react';
import { Contract } from 'ethers';
import { BrowserProvider } from 'ethers';
import { CONTRACT_ADDRESSES, SUPPORTED_TOKENS } from '@/contracts/addresses';
import PoolManagerABI from '@/contracts/abis/PoolManager.json';
import PoolABI from '@/lib/Pool.json';
import ERC20ABI from '@/contracts/abis/ERC20.json';

/**
 * 池子信息接口
 * 包含池子的完整状态和代币信息
 */
export interface PoolInfo {
  address: string;           // 池子合约地址
  token0: string;            // Token0 合约地址（按字典序排序后较小的地址）
  token1: string;            // Token1 合约地址（按字典序排序后较大的地址）
  index: number;             // 池子索引（同一对代币可以有多个池子）
  liquidity: bigint;         // 当前流动性数量
  sqrtPriceX96: bigint;      // 当前价格的平方根（Q96 格式，price = (sqrtPriceX96 / 2^96)^2）
  tick: number;              // 当前 tick 值（表示价格区间）
  token0Symbol?: string;     // Token0 的符号（如 MNA、ETH），可选
  token1Symbol?: string;     // Token1 的符号（如 MNB、USDT），可选
  token0Decimals?: number;   // Token0 的精度（通常为 18），可选
  token1Decimals?: number;   // Token1 的精度（通常为 18），可选
}

/**
 * 获取所有流动性池子的信息
 * @returns {Object} 包含池子列表、加载状态、错误信息和刷新函数
 */
export function usePools() {
  const [pools, setPools] = useState<PoolInfo[]>([]);      // 池子列表
  const [isLoading, setIsLoading] = useState(false);       // 加载状态
  const [error, setError] = useState<string | null>(null); // 错误信息

  /**
   * 从本地代币列表查找代币信息
   * @param address 代币合约地址
   * @returns 代币信息对象，如果未找到则返回 undefined
   */
  const findTokenInfo = (address: string) => {
    const token = SUPPORTED_TOKENS.find(
      (t) => t.address.toLowerCase() === address.toLowerCase()
    );
    return token;
  };

  /**
   * 从链上获取所有池子的信息
   * 包括池子状态和代币信息
   */
  const fetchPools = async () => {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined' || !window.ethereum) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new BrowserProvider(window.ethereum as any);
      const poolManager = new Contract(
        CONTRACT_ADDRESSES.sepolia.poolManager,
        PoolManagerABI,
        provider
      );

      console.log('Fetching all pools...');
      const allPools = await poolManager.getAllPools();
      console.log('Total pools found:', allPools.length);

      // 并行获取每个池子的详细信息
      const poolsWithDetails = await Promise.all(
        allPools.map(async (pool: any) => {
          try {
            const poolContract = new Contract(pool.pool, PoolABI, provider);
            
            // 并行获取池子的核心状态数据
            const [liquidity, sqrtPriceX96, tick] = await Promise.all([
              poolContract.liquidity(),     // 当前流动性
              poolContract.sqrtPriceX96(),  // 当前价格（平方根格式）
              poolContract.tick(),          // 当前 tick
            ]);

            // 初始化代币信息为默认值
            let token0Symbol = 'Unknown';     // Token0 符号
            let token1Symbol = 'Unknown';     // Token1 符号
            let token0Decimals = 18;          // Token0 精度（默认 18）
            let token1Decimals = 18;          // Token1 精度（默认 18）

            // 策略 1: 优先从本地代币列表获取（最快、最可靠）
            const localToken0 = findTokenInfo(pool.token0);
            const localToken1 = findTokenInfo(pool.token1);

            // Token0 信息获取
            if (localToken0) {
              // ✅ 从本地列表获取成功
              token0Symbol = localToken0.symbol;
              token0Decimals = localToken0.decimals;
              console.log('Found token0 in local list:', { symbol: token0Symbol, decimals: token0Decimals });
            } else {
              // 策略 2: 本地没有，尝试从链上合约获取
              try {
                const token0Contract = new Contract(pool.token0, ERC20ABI, provider);
                token0Symbol = await token0Contract.symbol();
                token0Decimals = await token0Contract.decimals();
                console.log('Fetched token0 from chain:', { symbol: token0Symbol, decimals: token0Decimals });
              } catch (e: any) {
                console.error('Failed to get token0 info from chain:', pool.token0, e.message);
                // 保持默认值 'Unknown' 和 18
              }
            }

            // Token1 信息获取
            if (localToken1) {
              // ✅ 从本地列表获取成功
              token1Symbol = localToken1.symbol;
              token1Decimals = localToken1.decimals;
              console.log('Found token1 in local list:', { symbol: token1Symbol, decimals: token1Decimals });
            } else {
              // 策略 2: 本地没有，尝试从链上合约获取
              try {
                const token1Contract = new Contract(pool.token1, ERC20ABI, provider);
                token1Symbol = await token1Contract.symbol();
                token1Decimals = await token1Contract.decimals();
                console.log('Fetched token1 from chain:', { symbol: token1Symbol, decimals: token1Decimals });
              } catch (e: any) {
                console.error('Failed to get token1 info from chain:', pool.token1, e.message);
                // 保持默认值 'Unknown' 和 18
              }
            }

            return {
              address: pool.pool,              // 池子合约地址
              token0: pool.token0,              // Token0 合约地址（按字典序排序后较小的地址）
              token1: pool.token1,              // Token1 合约地址（按字典序排序后较大的地址）
              index: Number(pool.index),        // 池子索引（同一对代币可以有多个池子）
              liquidity,                        // 当前流动性数量
              sqrtPriceX96,                     // 当前价格的平方根（Q96 格式）
              tick: Number(tick),               // 当前 tick 值（表示价格区间）
              token0Symbol,                     // Token0 的符号（如 MNA、ETH）
              token1Symbol,                     // Token1 的符号（如 MNB、USDT）
              token0Decimals: Number(token0Decimals),  // Token0 的精度（通常为 18）
              token1Decimals: Number(token1Decimals),  // Token1 的精度（通常为 18）
            };
          } catch (error) {
            console.error('Error fetching pool details:', pool.pool, error);
            // 返回默认值以避免整个列表失败
            return {
              address: pool.pool,              // 池子合约地址
              token0: pool.token0,              // Token0 合约地址
              token1: pool.token1,              // Token1 合约地址
              index: Number(pool.index),        // 池子索引
              liquidity: BigInt(0),             // 默认流动性为 0
              sqrtPriceX96: BigInt(0),          // 默认价格为 0
              tick: 0,                          // 默认 tick 为 0
            };
          }
        })
      );

      console.log('Pools with details:', poolsWithDetails);
      setPools(poolsWithDetails);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error fetching pools:', error);
      setError(error.message || 'Failed to fetch pools');
      setIsLoading(false);
    }
  };

  // 组件挂载时自动获取池子列表
  useEffect(() => {
    fetchPools();
  }, []);

  return {
    pools,                 // 池子列表数组
    isLoading,            // 是否正在加载
    error,                // 错误信息（如果有）
    refetch: fetchPools,  // 手动刷新函数
  };
}

