'use client';

import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { Contract } from 'ethers';
import { BrowserProvider } from 'ethers';
import ERC20ABI from '@/contracts/abis/ERC20.json';

export function useTokenBalance(tokenAddress: string | undefined) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined' || !window.ethereum) {
      return;
    }

    if (!tokenAddress || !address || !publicClient) {
      setBalance(BigInt(0));
      return;
    }

    const fetchBalance = async () => {
      setLoading(true);
      try {
        const provider = new BrowserProvider(window.ethereum as any);
        const tokenContract = new Contract(tokenAddress, ERC20ABI, provider);
        const bal = await tokenContract.balanceOf(address);
        setBalance(bal);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(BigInt(0));
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();

    // Refresh balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [tokenAddress, address, publicClient]);

  return { balance, loading };
}

