// ERC20 ABI
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const;

// SwapRouter ABI
export const SWAP_ROUTER_ABI = [
  'function exactInput(tuple(address tokenIn, address tokenOut, uint32[] indexPath, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)',
  'function exactOutput(tuple(address tokenIn, address tokenOut, uint32[] indexPath, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountIn)',
  'function quoteExactInput(tuple(address tokenIn, address tokenOut, uint32[] indexPath, uint256 amountIn, uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut)',
  'function quoteExactOutput(tuple(address tokenIn, address tokenOut, uint32[] indexPath, uint256 amountOut, uint160 sqrtPriceLimitX96) params) returns (uint256 amountIn)',
  'event Swap(address indexed sender, bool zeroForOne, uint256 amountIn, uint256 amountInRemaining, uint256 amountOut)',
] as const;

// PositionManager ABI
export const POSITION_MANAGER_ABI = [
  'function mint(tuple(address token0, address token1, uint32 index, uint256 amount0Desired, uint256 amount1Desired, address recipient, uint256 deadline) params) payable returns (uint256 positionId, uint128 liquidity, uint256 amount0, uint256 amount1)',
  'function burn(uint256 positionId) returns (uint256 amount0, uint256 amount1)',
  'function collect(uint256 positionId, address recipient) returns (uint256 amount0, uint256 amount1)',
  'function getAllPositions() view returns (tuple(uint256 id, address owner, address token0, address token1, uint32 index, uint24 fee, uint128 liquidity, int24 tickLower, int24 tickUpper, uint128 tokensOwed0, uint128 tokensOwed1, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128)[])',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function balanceOf(address owner) view returns (uint256)',
] as const;

// PoolManager ABI
export const POOL_MANAGER_ABI = [
  'function createAndInitializePoolIfNecessary(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint160 sqrtPriceX96) params) payable returns (address pool)',
  'function getAllPools() view returns (tuple(address pool, address token0, address token1, uint32 index, uint24 fee, uint8 feeProtocol, int24 tickLower, int24 tickUpper, int24 tick, uint160 sqrtPriceX96, uint128 liquidity)[])',
  'function getPairs() view returns (tuple(address token0, address token1)[])',
  'function getPool(address token0, address token1, uint32 index) view returns (address)',
] as const;

// Pair type for TypeScript
export interface Pair {
  token0: string;
  token1: string;
}

// Pool ABI
export const POOL_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function fee() view returns (uint24)',
  'function tickLower() view returns (int24)',
  'function tickUpper() view returns (int24)',
  'function sqrtPriceX96() view returns (uint160)',
  'function tick() view returns (int24)',
  'function liquidity() view returns (uint128)',
  'function feeGrowthGlobal0X128() view returns (uint256)',
  'function feeGrowthGlobal1X128() view returns (uint256)',
  'function getPosition(address owner) view returns (uint128 _liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
  'event Mint(address sender, address indexed owner, uint128 amount, uint256 amount0, uint256 amount1)',
  'event Burn(address indexed owner, uint128 amount, uint256 amount0, uint256 amount1)',
  'event Collect(address indexed owner, address recipient, uint128 amount0, uint128 amount1)',
] as const;

