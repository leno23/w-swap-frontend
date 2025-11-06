import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'ethers';
import { useEthersProvider } from './useContract';

export function useEthBalance() {
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const provider = useEthersProvider();

  const fetchBalance = useCallback(async () => {
    if (!isConnected || !address || !provider) {
      setBalance('0');
      return;
    }

    try {
      setLoading(true);
      const bal = await provider.getBalance(address);
      const formattedBalance = formatEther(bal);
      setBalance(formattedBalance);
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, provider]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    refetch: fetchBalance,
  };
}

