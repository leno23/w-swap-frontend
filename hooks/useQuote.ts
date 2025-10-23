'use client';

import { useState } from 'react';
import { Contract, ZeroAddress } from 'ethers';
import { BrowserProvider } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/contracts/addresses';
import SwapRouterABI from '@/contracts/abis/SwapRouter.json';
import PoolManagerABI from '@/contracts/abis/PoolManager.json';
import PoolABI from '@/lib/Pool.json';
import { MIN_SQRT_PRICE_LIMIT, MAX_SQRT_PRICE_LIMIT } from '@/lib/constants';

export interface QuoteResult {
  amountOut: bigint;
  error?: string;
}

export function useQuote() {
  const [isLoading, setIsLoading] = useState(false);

  const getQuote = async (
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    indexPath: number[] = [0]
  ): Promise<QuoteResult> => {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined' || !window.ethereum) {
      return { amountOut: BigInt(0), error: 'No wallet connected' };
    }

    if (!tokenIn || !tokenOut || amountIn === BigInt(0)) {
      return { amountOut: BigInt(0), error: 'Invalid parameters' };
    }

    setIsLoading(true);

    try {
      const provider = new BrowserProvider(window.ethereum as any);
      
      // 1️⃣ 先检查池子是否存在
      const poolManager = new Contract(
        CONTRACT_ADDRESSES.sepolia.poolManager,
        PoolManagerABI,
        provider
      );
      
      console.log('Checking pool existence for:', {
        tokenIn,
        tokenOut,
        index: indexPath[0]
      });
      
      const poolAddress = await poolManager.getPool(
        tokenIn,
        tokenOut,
        indexPath[0]
      );
      
      console.log('Pool address:', poolAddress);
      
      if (poolAddress === ZeroAddress) {
        setIsLoading(false);
        return { 
          amountOut: BigInt(0), 
          error: 'Pool does not exist. Please create the pool first.' 
        };
      }

      // 2️⃣ 检查池子是否有流动性
      const pool = new Contract(poolAddress, PoolABI, provider);
      const liquidity = await pool.liquidity();
      
      console.log('Pool liquidity:', liquidity.toString());
      
      if (liquidity === BigInt(0)) {
        setIsLoading(false);
        return { 
          amountOut: BigInt(0), 
          error: 'Pool has no liquidity. Please add liquidity first.' 
        };
      }

      // 3️⃣ 调用报价
      const swapRouter = new Contract(
        CONTRACT_ADDRESSES.sepolia.swapRouter,
        SwapRouterABI,
        provider
      );

      // 确定交换方向
      const zeroForOne = tokenIn.toLowerCase() < tokenOut.toLowerCase();
      const sqrtPriceLimitX96 = zeroForOne ? MIN_SQRT_PRICE_LIMIT : MAX_SQRT_PRICE_LIMIT;

      const params = {
        tokenIn,
        tokenOut,
        indexPath,
        amountIn,
        sqrtPriceLimitX96,
      };

      console.log('Getting quote with params:', {
        ...params,
        amountIn: amountIn.toString(),
        sqrtPriceLimitX96: sqrtPriceLimitX96.toString()
      });

      // 使用 staticCall 来模拟调用，不发送实际交易
      // quoteExactInput 会调用 exactInput，但 recipient 是 address(0)
      // 这会在 callback 中 revert 并返回预估值
      try {
        const result = await swapRouter.quoteExactInput.staticCall(params);
        console.log('Quote result:', result.toString());
        setIsLoading(false);
        return { amountOut: result };
      } catch (error: any) {
        console.log('Quote call error:', error);
        
        // 4️⃣ 处理报价特定的 revert（正常行为）
        // Uniswap 的 Quoter 合约会通过 revert 返回数据
        if (error.data) {
          try {
            // 解码错误数据
            const iface = swapRouter.interface;
            const decodedError = iface.parseError(error.data);
            console.log('Decoded error:', decodedError);
          } catch (e) {
            console.log('Cannot decode error');
          }
        }
        
        // 如果是预期的 revert，尝试提取数值
        if (error.revert && error.revert.args) {
          const amountOut = error.revert.args[0];
          setIsLoading(false);
          return { amountOut: BigInt(amountOut) };
        }
        
        // 检查是否是池子不存在的错误（作为兜底检查）
        if (error.message?.includes('Pool not found')) {
          setIsLoading(false);
          return { 
            amountOut: BigInt(0), 
            error: 'Pool not found' 
          };
        }
        
        setIsLoading(false);
        return { 
          amountOut: BigInt(0), 
          error: error.reason || error.message || 'Quote failed' 
        };
      }
    } catch (error: any) {
      console.error('Quote error:', error);
      setIsLoading(false);
      return { 
        amountOut: BigInt(0), 
        error: error.message || 'Unknown error' 
      };
    }
  };

  return { getQuote, isLoading };
}

