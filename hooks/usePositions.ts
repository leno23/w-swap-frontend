'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { Contract } from 'ethers';
import { BrowserProvider } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/contracts/addresses';
import PositionManagerABI from '@/contracts/abis/PositionManager.json';
import { Position } from '@/types';

export function usePositions() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined' || !window.ethereum) {
      return;
    }

    if (!address || !publicClient) {
      setPositions([]);
      return;
    }

    const fetchPositions = async () => {
      setLoading(true);
      try {
        const provider = new BrowserProvider(window.ethereum as any);
        const positionManager = new Contract(
          CONTRACT_ADDRESSES.sepolia.positionManager,
          PositionManagerABI,
          provider
        );

        const allPositions = await positionManager.getAllPositions();
        
        // Filter positions owned by current user
        const userPositions = allPositions
          .filter((pos: any) => pos.owner.toLowerCase() === address.toLowerCase())
          .map((pos: any) => ({
            id: pos.id,                          // 头寸ID
            owner: pos.owner,                    // 头寸所有者地址
            token0: pos.token0,                  // 代币0地址
            token1: pos.token1,                  // 代币1地址
            index: Number(pos.index),            // 头寸在池子中的索引
            fee: Number(pos.fee),                // 手续费率（如3000表示0.3%）
            liquidity: pos.liquidity,            // 流动性数量
            tickLower: Number(pos.tickLower),    // 价格区间下界tick值
            tickUpper: Number(pos.tickUpper),    // 价格区间上界tick值
            tokensOwed0: pos.tokensOwed0,        // 待领取的代币0手续费
            tokensOwed1: pos.tokensOwed1,        // 待领取的代币1手续费
            feeGrowthInside0LastX128: pos.feeGrowthInside0LastX128,  // 代币0的内部手续费增长（X128定点数）
            feeGrowthInside1LastX128: pos.feeGrowthInside1LastX128,  // 代币1的内部手续费增长（X128定点数）
          }));

        setPositions(userPositions);
      } catch (error) {
        console.error('Error fetching positions:', error);
        setPositions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();

    // Refresh positions every 15 seconds
    const interval = setInterval(fetchPositions, 15000);
    return () => clearInterval(interval);
  }, [address, publicClient]);

  return { positions, loading };
}

