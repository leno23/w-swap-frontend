/**
 * Script to fetch the complete Pool contract ABI from a deployed pool
 * Run with: npx ts-node scripts/fetchPoolABI.ts
 */

import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../contracts/addresses.js';

const SEPOLIA_RPC = 'https://eth-sepolia.g.alchemy.com/v2/mXqbqtme85tkvSUbAWZYV-9Y2IqTwL';

async function fetchPoolABI() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  
  // Get a pool address from PoolManager
  const poolManagerABI = [
    "function getAllPools() view returns (tuple(address pool, address token0, address token1, uint32 index, uint24 fee, uint8 feeProtocol, int24 tickLower, int24 tickUpper, int24 tick, uint160 sqrtPriceX96, uint128 liquidity)[] poolsInfo)"
  ];
  
  const poolManager = new ethers.Contract(
    CONTRACT_ADDRESSES.sepolia.poolManager,
    poolManagerABI,
    provider
  );
  
  console.log('Fetching pools from PoolManager...');
  const pools = await poolManager.getAllPools();
  
  if (pools.length === 0) {
    console.error('No pools found!');
    return;
  }
  
  const firstPool = pools[0];
  console.log('First pool address:', firstPool.pool);
  console.log('Pool token0:', firstPool.token0);
  console.log('Pool token1:', firstPool.token1);
  
  // Get the bytecode to verify it's deployed
  const code = await provider.getCode(firstPool.pool);
  console.log('Pool bytecode length:', code.length);
  
  if (code === '0x' || code.length <= 2) {
    console.error('Pool contract not deployed!');
    return;
  }
  
  console.log('\n=== IMPORTANT ===');
  console.log('The Pool contract is deployed but we need its complete ABI.');
  console.log('Options to get the complete ABI:');
  console.log('1. From your smart contract source code (recommended)');
  console.log('2. From Etherscan if the contract is verified');
  console.log('3. Ask your smart contract developer for the Pool.sol ABI');
  console.log('\nThe Pool ABI should include functions like:');
  console.log('- mint(address to, int24 tickLower, int24 tickUpper, uint128 liquidity, bytes calldata data)');
  console.log('- burn(int24 tickLower, int24 tickUpper, uint128 liquidity)');
  console.log('- swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96, bytes calldata data)');
}

fetchPoolABI().catch(console.error);

