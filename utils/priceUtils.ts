/**
 * Utility functions for price and tick conversions in Uniswap V3 style pools
 */

// Constants
const Q96 = 2n ** 96n;
const MIN_TICK = -887272;
const MAX_TICK = 887272;
const MIN_SQRT_RATIO = 4295128739n;
const MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342n;

/**
 * Convert price to sqrtPriceX96
 * @param price - The price as a number (token1/token0)
 * @returns sqrtPriceX96 as bigint
 */
export function priceToSqrtPriceX96(price: number): bigint {
  if (price <= 0) {
    throw new Error('Price must be positive');
  }
  
  const sqrtPrice = Math.sqrt(price);
  // Convert to fixed point: sqrtPrice * 2^96
  const sqrtPriceX96 = BigInt(Math.floor(sqrtPrice * Number(Q96)));
  
  // Ensure it's within valid bounds
  if (sqrtPriceX96 < MIN_SQRT_RATIO) {
    return MIN_SQRT_RATIO;
  }
  if (sqrtPriceX96 > MAX_SQRT_RATIO) {
    return MAX_SQRT_RATIO;
  }
  
  return sqrtPriceX96;
}

/**
 * Convert sqrtPriceX96 to price
 * @param sqrtPriceX96 - The sqrtPriceX96 as bigint
 * @returns price as number (token1/token0)
 */
export function sqrtPriceX96ToPrice(sqrtPriceX96: bigint): number {
  if (sqrtPriceX96 === 0n) return 0;
  
  // price = (sqrtPriceX96 / 2^96)^2
  const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);
  return sqrtPrice * sqrtPrice;
}

/**
 * Convert tick to price
 * @param tick - The tick value
 * @returns price as number
 */
export function tickToPrice(tick: number): number {
  // price = 1.0001^tick
  return Math.pow(1.0001, Number(tick));
}

/**
 * Convert price to tick
 * @param price - The price as a number
 * @returns tick value
 */
export function priceToTick(price: number): number {
  if (price <= 0) {
    throw new Error('Price must be positive');
  }
  
  // tick = log_{1.0001}(price) = ln(price) / ln(1.0001)
  const tick = Math.log(price) / Math.log(1.0001);
  
  // Round to nearest integer and clamp to valid range
  const roundedTick = Math.round(tick);
  
  if (roundedTick < MIN_TICK) return MIN_TICK;
  if (roundedTick > MAX_TICK) return MAX_TICK;
  
  return roundedTick;
}

/**
 * Calculate tick spacing based on fee tier
 * @param fee - The fee in basis points (e.g., 500 for 0.05%)
 * @returns tick spacing
 */
export function getTickSpacing(fee: number): number {
  if (fee === 500) return 10;      // 0.05%
  if (fee === 3000) return 60;     // 0.30%
  if (fee === 10000) return 200;   // 1.00%
  return 60; // default
}

/**
 * Round tick to nearest valid tick for given spacing
 * @param tick - The tick value
 * @param tickSpacing - The tick spacing
 * @returns rounded tick
 */
export function roundTickToSpacing(tick: number, tickSpacing: number): number {
  const rounded = Math.round(tick / tickSpacing) * tickSpacing;
  
  if (rounded < MIN_TICK) return MIN_TICK;
  if (rounded > MAX_TICK) return MAX_TICK;
  
  return rounded;
}

/**
 * Format price for display
 * @param price - The price as a number
 * @param decimals - Number of decimal places (default 6)
 * @returns formatted price string
 */
export function formatPrice(price: number, decimals: number = 6): string {
  if (price === 0) return '0';
  if (price < 0.000001) return '<0.000001';
  if (price < 1) return price.toFixed(decimals);
  if (price < 1000) return price.toFixed(4);
  if (price < 1000000) return (price / 1000).toFixed(2) + 'K';
  return (price / 1000000).toFixed(2) + 'M';
}

/**
 * Get price limits for display based on tick range
 * @param tickLower - Lower tick bound
 * @param tickUpper - Upper tick bound
 * @returns object with minPrice and maxPrice
 */
export function getPriceRangeFromTicks(tickLower: number, tickUpper: number) {
  return {
    minPrice: tickToPrice(tickLower),
    maxPrice: tickToPrice(tickUpper),
  };
}

/**
 * Calculate suggested tick range based on current price and range percentage
 * @param currentPrice - Current price
 * @param rangePercentage - Range percentage (e.g., 10 for ±10%)
 * @param tickSpacing - Tick spacing
 * @returns object with tickLower and tickUpper
 */
export function calculateTickRange(
  currentPrice: number,
  rangePercentage: number,
  tickSpacing: number
) {
  const minPrice = currentPrice * (1 - rangePercentage / 100);
  const maxPrice = currentPrice * (1 + rangePercentage / 100);
  
  const tickLower = roundTickToSpacing(priceToTick(minPrice), tickSpacing);
  const tickUpper = roundTickToSpacing(priceToTick(maxPrice), tickSpacing);
  
  return {
    tickLower,
    tickUpper,
    minPrice: tickToPrice(tickLower),
    maxPrice: tickToPrice(tickUpper),
  };
}

/**
 * Validate tick range
 * @param tickLower - Lower tick
 * @param tickUpper - Upper tick
 * @param tickSpacing - Tick spacing
 * @returns validation result
 */
export function validateTickRange(
  tickLower: number,
  tickUpper: number,
  tickSpacing: number
): { valid: boolean; error?: string } {
  if (tickLower >= tickUpper) {
    return { valid: false, error: 'Lower tick must be less than upper tick' };
  }
  
  if (tickLower < MIN_TICK || tickUpper > MAX_TICK) {
    return { valid: false, error: 'Tick out of valid range' };
  }
  
  if (tickLower % tickSpacing !== 0 || tickUpper % tickSpacing !== 0) {
    return { valid: false, error: `Ticks must be multiples of ${tickSpacing}` };
  }
  
  return { valid: true };
}

// Export constants for use in components
export const TICK_CONSTANTS = {
  MIN_TICK,
  MAX_TICK,
  MIN_SQRT_RATIO,
  MAX_SQRT_RATIO,
  Q96,
};

