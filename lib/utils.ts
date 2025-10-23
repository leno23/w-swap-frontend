import { formatUnits, parseUnits } from 'ethers';
import { MAX_DECIMALS_DISPLAY } from './constants';

/**
 * Format token amount for display
 */
export function formatTokenAmount(
  amount: bigint | string,
  decimals: number = 18,
  maxDecimals: number = MAX_DECIMALS_DISPLAY
): string {
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return '0';
  
  // For very small numbers, use scientific notation
  if (num < 0.000001) {
    return num.toExponential(4);
  }
  
  // For regular numbers, limit decimal places
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Parse user input to token amount
 */
export function parseTokenAmount(
  amount: string,
  decimals: number = 18
): bigint {
  try {
    return parseUnits(amount || '0', decimals);
  } catch {
    return BigInt(0);
  }
}

/**
 * Calculate slippage amount
 */
export function calculateSlippage(
  amount: bigint,
  slippagePercent: number,
  isMinimum: boolean = true
): bigint {
  const slippageBps = BigInt(Math.floor(slippagePercent * 100));
  const adjustment = (amount * slippageBps) / BigInt(10000);
  
  return isMinimum ? amount - adjustment : amount + adjustment;
}

/**
 * Calculate deadline timestamp
 */
export function calculateDeadline(minutesFromNow: number = 20): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + minutesFromNow * 60);
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format USD price
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): string {
  if (total === 0) return '0';
  return ((value / total) * 100).toFixed(2);
}

/**
 * Sort tokens by address
 */
export function sortTokens(tokenA: string, tokenB: string): [string, string] {
  return tokenA.toLowerCase() < tokenB.toLowerCase() 
    ? [tokenA, tokenB] 
    : [tokenB, tokenA];
}

/**
 * Validate address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Calculate price from sqrtPriceX96
 */
export function sqrtPriceX96ToPrice(sqrtPriceX96: bigint, decimals0: number, decimals1: number): number {
  const Q96 = BigInt(2) ** BigInt(96);
  const price = (sqrtPriceX96 * sqrtPriceX96 * BigInt(10 ** decimals0)) / (Q96 * Q96 * BigInt(10 ** decimals1));
  return Number(price) / 10 ** decimals0;
}

/**
 * Calculate sqrtPriceX96 from price
 */
export function priceToSqrtPriceX96(price: number): bigint {
  const Q96 = BigInt(2) ** BigInt(96);
  const sqrtPrice = Math.sqrt(price);
  return BigInt(Math.floor(sqrtPrice * Number(Q96)));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Class name utility
 */
export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}


