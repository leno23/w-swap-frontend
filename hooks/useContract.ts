import { usePublicClient, useWalletClient } from 'wagmi';
import { Contract, BrowserProvider } from 'ethers';
import { useMemo, useEffect, useState, useRef } from 'react';
import { 
  SWAP_ROUTER_ABI, 
  POSITION_MANAGER_ABI, 
  POOL_MANAGER_ABI, 
  ERC20_ABI 
} from '../config/abis';
import { CONTRACTS } from '../config/contracts';

export function useEthersProvider() {
  const publicClient = usePublicClient();
  
  return useMemo(() => {
    if (!publicClient) return null;
    const { chain, transport } = publicClient;
    const network = {
      chainId: chain.id,
      name: chain.name,
      ensAddress: chain.contracts?.ensRegistry?.address,
    };
    return new BrowserProvider(transport, network);
  }, [publicClient]);
}

export function useEthersSigner() {
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = useState<any>(null);

  useEffect(() => {
    if (!walletClient) {
      setSigner(null);
      return;
    }

    const getSigner = async () => {
      try {
        // 使用 walletClient 的 transport 创建 provider
        // 这是 wagmi v2 + ethers v6 的正确做法
        const { account, chain, transport } = walletClient;
        const network = {
          chainId: chain.id,
          name: chain.name,
          ensAddress: chain.contracts?.ensRegistry?.address,
        };
        const provider = new BrowserProvider(transport, network);
        
        // 从 provider 获取 signer
        const s = await provider.getSigner(account.address);
        
        setSigner(s);
      } catch (error) {
        console.error('❌ Error getting signer:', error);
        setSigner(null);
      }
    };

    getSigner();
  }, [walletClient]);

  return signer;
}

export function useSwapRouter() {
  const provider = useEthersProvider();
  const signer = useEthersSigner();

  return useMemo(() => {
    // 优先使用 signer（可以发送交易）
    if (signer) {
      return new Contract(CONTRACTS.SwapRouter, SWAP_ROUTER_ABI, signer);
    }
    // 降级使用 provider（只读）
    if (provider) {
      return new Contract(CONTRACTS.SwapRouter, SWAP_ROUTER_ABI, provider);
    }
    return null;
  }, [provider, signer]);
}

export function usePositionManager() {
  const provider = useEthersProvider();
  const signer = useEthersSigner();

  return useMemo(() => {
    // 优先使用 signer（可以发送交易）
    if (signer) {
      return new Contract(CONTRACTS.PositionManager, POSITION_MANAGER_ABI, signer);
    }
    // 降级使用 provider（只读）
    if (provider) {
      return new Contract(CONTRACTS.PositionManager, POSITION_MANAGER_ABI, provider);
    }
    return null;
  }, [provider, signer]);
}

export function usePoolManager() {
  const provider = useEthersProvider();
  const signer = useEthersSigner();

  return useMemo(() => {
    // 优先使用 signer（可以发送交易）
    if (signer) {
      return new Contract(CONTRACTS.PoolManager, POOL_MANAGER_ABI, signer);
    }
    // 降级使用 provider（只读）
    if (provider) {
      return new Contract(CONTRACTS.PoolManager, POOL_MANAGER_ABI, provider);
    }
    return null;
  }, [provider, signer]);
}

export function useTokenContract(tokenAddress: string | null) {
  const provider = useEthersProvider();
  const signer = useEthersSigner();
  const contractRef = useRef<any>(null);
  const lastTokenRef = useRef<string | null>(null);
  const lastSignerRef = useRef<any>(null);

  return useMemo(() => {
    if (!tokenAddress) return null;
    
    // 如果 token 地址和 signer 都没变，返回缓存的合约
    if (
      contractRef.current &&
      lastTokenRef.current === tokenAddress &&
      lastSignerRef.current === signer
    ) {
      return contractRef.current;
    }
    
    // 优先使用 signer（可以发送交易）
    if (signer) {
      const contract = new Contract(tokenAddress, ERC20_ABI, signer);
      contractRef.current = contract;
      lastTokenRef.current = tokenAddress;
      lastSignerRef.current = signer;
      return contract;
    }
    // 降级使用 provider（只读）
    if (provider) {
      const contract = new Contract(tokenAddress, ERC20_ABI, provider);
      contractRef.current = contract;
      lastTokenRef.current = tokenAddress;
      lastSignerRef.current = null;
      return contract;
    }
    return null;
  }, [tokenAddress, provider, signer]);
}

