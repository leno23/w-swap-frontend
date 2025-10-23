'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { Contract } from 'ethers';
import { BrowserProvider } from 'ethers';
import toast from 'react-hot-toast';
import { CONTRACT_ADDRESSES } from '@/contracts/addresses';
import SwapRouterABI from '@/contracts/abis/SwapRouter.json';
import ERC20ABI from '@/contracts/abis/ERC20.json';
import { calculateDeadline, calculateSlippage } from '@/lib/utils';
import { MIN_SQRT_PRICE_LIMIT, MAX_SQRT_PRICE_LIMIT } from '@/lib/constants';

export function useSwap() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isSwapping, setIsSwapping] = useState(false);

  const approveToken = async (
    tokenAddress: string,
    amount: bigint
  ): Promise<boolean> => {
    if (!walletClient || !address) return false;

    try {
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const tokenContract = new Contract(tokenAddress, ERC20ABI, signer);

      const tx = await tokenContract.approve(
        CONTRACT_ADDRESSES.sepolia.swapRouter,
        amount
      );
      
      toast.loading('Approving token...', { id: 'approve' });
      await tx.wait();
      toast.success('Token approved!', { id: 'approve' });
      
      return true;
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Approval failed', { id: 'approve' });
      return false;
    }
  };

  const checkAllowance = async (
    tokenAddress: string,
    amount: bigint
  ): Promise<boolean> => {
    if (!address || !publicClient) return false;

    try {
      const provider = new BrowserProvider(walletClient as any);
      const tokenContract = new Contract(tokenAddress, ERC20ABI, provider);
      
      const allowance = await tokenContract.allowance(
        address,
        CONTRACT_ADDRESSES.sepolia.swapRouter
      );
      
      return allowance >= amount;
    } catch (error) {
      console.error('Check allowance error:', error);
      return false;
    }
  };

  const swap = async (
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    slippagePercent: number,
    indexPath: number[] = [0]
  ): Promise<boolean> => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    setIsSwapping(true);

    try {
      // Check and approve if needed
      const hasAllowance = await checkAllowance(tokenIn, amountIn);
      if (!hasAllowance) {
        const approved = await approveToken(tokenIn, amountIn);
        if (!approved) {
          setIsSwapping(false);
          return false;
        }
      }

      // Prepare swap
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const swapRouter = new Contract(
        CONTRACT_ADDRESSES.sepolia.swapRouter,
        SwapRouterABI,
        signer
      );

      const amountOutMinimum = calculateSlippage(amountIn, slippagePercent, true);
      const deadline = calculateDeadline(20);

      // 确定交换方向：如果 tokenIn < tokenOut，则是从 token0 到 token1
      const zeroForOne = tokenIn.toLowerCase() < tokenOut.toLowerCase();
      
      // 根据交换方向设置正确的价格限制
      // 合约要求严格不等式：
      // - zeroForOne = true: sqrtPriceLimitX96 > MIN_SQRT_PRICE (使用 MIN + 1)
      // - zeroForOne = false: sqrtPriceLimitX96 < MAX_SQRT_PRICE (使用 MAX - 1)
      const sqrtPriceLimitX96 = zeroForOne ? MIN_SQRT_PRICE_LIMIT : MAX_SQRT_PRICE_LIMIT;
      
      console.log('Swap params:', {
        tokenIn,
        tokenOut,
        zeroForOne,
        sqrtPriceLimitX96: sqrtPriceLimitX96.toString(),
        amountIn: amountIn.toString()
      });

      const params = {
        tokenIn,
        tokenOut,
        indexPath,
        recipient: address,
        deadline,
        amountIn,
        amountOutMinimum,
        sqrtPriceLimitX96,
      };

      toast.loading('Swapping tokens...', { id: 'swap' });
      const tx = await swapRouter.exactInput(params);
      await tx.wait();
      
      toast.success('Swap successful!', { id: 'swap' });
      setIsSwapping(false);
      return true;
    } catch (error: any) {
      console.error('Swap error:', error);
      
      // 提供更友好的错误消息
      let errorMessage = 'Swap failed';
      
      if (error.message?.includes('SPL')) {
        errorMessage = 'Price limit error. Please try again.';
      } else if (error.message?.includes('insufficient')) {
        errorMessage = 'Insufficient balance';
      } else if (error.message?.includes('allowance')) {
        errorMessage = 'Token approval required';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction rejected';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: 'swap' });
      setIsSwapping(false);
      return false;
    }
  };

  return {
    swap,
    approveToken,
    checkAllowance,
    isSwapping,
  };
}

