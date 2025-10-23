import { sepolia } from 'wagmi/chains';

// Chain configuration
export const SUPPORTED_CHAINS = [sepolia];

// Transaction settings
export const DEFAULT_SLIPPAGE = 0.5; // 0.5%
export const DEFAULT_DEADLINE = 20; // 20 minutes

// Pool settings
export const DEFAULT_FEE_TIER = 3000; // 0.3%
export const FEE_TIERS = [500, 3000, 10000]; // 0.05%, 0.3%, 1%

// Tick settings
export const DEFAULT_TICK_LOWER = -887200;
export const DEFAULT_TICK_UPPER = 887200;

// Price limits (using sqrt price in Q96 format)
// 注意：合约要求严格不等式，所以我们使用稍微安全的值
export const MIN_SQRT_PRICE = BigInt('4295128739');
export const MAX_SQRT_PRICE = BigInt('1461446703485210103287273052203988822378723970342');

// 用于交易的安全价格限制（满足严格不等式）
export const MIN_SQRT_PRICE_LIMIT = MIN_SQRT_PRICE + BigInt(1);
export const MAX_SQRT_PRICE_LIMIT = MAX_SQRT_PRICE - BigInt(1);

// UI Constants
export const DEBOUNCE_DELAY = 500; // ms
export const MAX_DECIMALS_DISPLAY = 6;

