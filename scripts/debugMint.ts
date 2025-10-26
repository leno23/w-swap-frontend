import { ethers } from 'ethers';
import PoolManagerABI from '../contracts/abis/PoolManager.json';
import PositionManagerABI from '../contracts/abis/PositionManager.json';
import PoolABI from '../lib/Pool.json';
import ERC20ABI from '../contracts/abis/ERC20.json';

// Replace with your actual values from the error
const RPC_URL = 'https://sepolia.infura.io/v3/YOUR_KEY'; // Update this
const POOL_MANAGER = '0xddC12b3F9F7C91C79DA7433D8d212FB78d609f7B';
const POSITION_MANAGER = '0xbe766Bf20eFfe431829C5d5a2744865974A0B610';
const TOKEN0 = '0x4798388e3adE569570Df626040F07DF71135C48E';
const TOKEN1 = '0x5A4eA3a013D42Cfd1B1609d19f6eA998EeE06D30';
const POOL_INDEX = 0;
const USER_ADDRESS = '0xf0aC9747345c23B6ba451d9103F8C2785800998D';

async function diagnose() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  console.log('='.repeat(60));
  console.log('🔍 DIAGNOSING MINT FAILURE');
  console.log('='.repeat(60));
  
  // 1. Check PoolManager
  console.log('\n1️⃣ Checking PoolManager...');
  const poolManager = new ethers.Contract(POOL_MANAGER, PoolManagerABI, provider);
  
  try {
    const poolAddress = await poolManager.getPool(TOKEN0, TOKEN1, POOL_INDEX);
    console.log(`   ✅ Pool address: ${poolAddress}`);
    
    if (poolAddress === ethers.ZeroAddress) {
      console.log('   ❌ ERROR: Pool address is zero! Pool doesn\'t exist at this index.');
      return;
    }
    
    // 2. Check Pool exists and is initialized
    console.log('\n2️⃣ Checking Pool contract...');
    const poolCode = await provider.getCode(poolAddress);
    if (poolCode === '0x') {
      console.log('   ❌ ERROR: No contract code at pool address!');
      return;
    }
    console.log('   ✅ Pool contract exists');
    
    const pool = new ethers.Contract(poolAddress, PoolABI, provider);
    
    try {
      const sqrtPriceX96 = await pool.sqrtPriceX96();
      const liquidity = await pool.liquidity();
      const factory = await pool.factory();
      const tickLower = await pool.tickLower();
      const tickUpper = await pool.tickUpper();
      const tick = await pool.tick();
      
      console.log('   Pool State:');
      console.log(`     - sqrtPriceX96: ${sqrtPriceX96}`);
      console.log(`     - liquidity: ${liquidity}`);
      console.log(`     - tick: ${tick}`);
      console.log(`     - tickLower: ${tickLower}`);
      console.log(`     - tickUpper: ${tickUpper}`);
      console.log(`     - factory: ${factory}`);
      
      if (sqrtPriceX96 === 0n) {
        console.log('   ❌ ERROR: Pool not initialized (sqrtPriceX96 = 0)');
        return;
      }
      console.log('   ✅ Pool is initialized');
      
      // Check factory matches
      if (factory.toLowerCase() !== POOL_MANAGER.toLowerCase()) {
        console.log(`   ⚠️  WARNING: Pool.factory (${factory}) != PoolManager (${POOL_MANAGER})`);
        console.log('       This could cause callback validation to fail!');
      } else {
        console.log('   ✅ Pool.factory matches PoolManager');
      }
      
    } catch (error: any) {
      console.log(`   ❌ ERROR reading pool state: ${error.message}`);
      return;
    }
    
    // 3. Check PositionManager configuration
    console.log('\n3️⃣ Checking PositionManager...');
    const positionManager = new ethers.Contract(POSITION_MANAGER, PositionManagerABI, provider);
    
    try {
      const pmPoolManager = await positionManager.poolManager();
      console.log(`   PositionManager.poolManager: ${pmPoolManager}`);
      
      if (pmPoolManager.toLowerCase() !== POOL_MANAGER.toLowerCase()) {
        console.log(`   ❌ ERROR: PositionManager points to wrong PoolManager!`);
        console.log(`      Expected: ${POOL_MANAGER}`);
        console.log(`      Actual: ${pmPoolManager}`);
        return;
      }
      console.log('   ✅ PositionManager configured correctly');
    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    // 4. Check token balances and allowances
    console.log('\n4️⃣ Checking token balances and allowances...');
    const token0 = new ethers.Contract(TOKEN0, ERC20ABI, provider);
    const token1 = new ethers.Contract(TOKEN1, ERC20ABI, provider);
    
    const balance0 = await token0.balanceOf(USER_ADDRESS);
    const balance1 = await token1.balanceOf(USER_ADDRESS);
    const allowance0 = await token0.allowance(USER_ADDRESS, POSITION_MANAGER);
    const allowance1 = await token1.allowance(USER_ADDRESS, POSITION_MANAGER);
    
    console.log(`   Token0 balance: ${ethers.formatEther(balance0)}`);
    console.log(`   Token1 balance: ${ethers.formatEther(balance1)}`);
    console.log(`   Token0 allowance: ${ethers.formatEther(allowance0)}`);
    console.log(`   Token1 allowance: ${ethers.formatEther(allowance1)}`);
    
    if (balance0 === 0n && balance1 === 0n) {
      console.log('   ⚠️  WARNING: Both token balances are 0');
    }
    
    // 5. Try to simulate the mint call
    console.log('\n5️⃣ Attempting to find revert reason...');
    console.log('   This will attempt to call mint and decode the error...');
    
    // Try calling mint with staticCall to get the revert reason
    const amount0 = ethers.parseEther('1');
    const amount1 = ethers.parseEther('1');
    const deadline = Math.floor(Date.now() / 1000) + 1200;
    
    const params = {
      token0: TOKEN0,
      token1: TOKEN1,
      index: POOL_INDEX,
      recipient: USER_ADDRESS,
      amount0Desired: amount0,
      amount1Desired: amount1,
      amount0Min: amount0 * 95n / 100n,
      amount1Min: amount1 * 95n / 100n,
      deadline: deadline
    };
    
    try {
      // This will revert but hopefully give us the reason
      await positionManager.mint.staticCall(params, { from: USER_ADDRESS });
      console.log('   ✅ Mint call would succeed!');
    } catch (error: any) {
      console.log('   ❌ Mint would fail with error:');
      
      if (error.data) {
        console.log(`      Raw error data: ${error.data}`);
        
        // Try to decode the error
        try {
          // Try PositionManager errors
          const pmInterface = new ethers.Interface(PositionManagerABI);
          const decodedError = pmInterface.parseError(error.data);
          if (decodedError) {
            console.log(`      Decoded error: ${decodedError.name}`);
            console.log(`      Args: ${JSON.stringify(decodedError.args)}`);
          }
        } catch (e) {
          // Try Pool errors
          try {
            const poolInterface = new ethers.Interface(PoolABI);
            const decodedError = poolInterface.parseError(error.data);
            if (decodedError) {
              console.log(`      Decoded error: ${decodedError.name}`);
              console.log(`      Args: ${JSON.stringify(decodedError.args)}`);
            }
          } catch (e2) {
            console.log('      Could not decode error');
          }
        }
      }
      
      if (error.reason) {
        console.log(`      Reason: ${error.reason}`);
      } else if (error.message) {
        console.log(`      Message: ${error.message}`);
      }
      
      if (error.message?.includes('missing revert data')) {
        console.log('\n   💡 DIAGNOSIS: "Missing revert data" usually means:');
        console.log('      1. Calling a function on a non-existent contract');
        console.log('      2. Out of gas');
        console.log('      3. A low-level call failed');
        console.log('      4. Array index out of bounds (no error message)');
        console.log('\n   🔧 LIKELY CAUSE:');
        console.log('      The poolManager.getPool() might be returning address(0)');
        console.log('      or the pool index is out of bounds.');
        console.log('\n   Try creating the pool first or using index 0.');
      }
    }
    
  } catch (error: any) {
    console.log(`\n❌ FATAL ERROR: ${error.message}`);
    if (error.message?.includes('out of bounds')) {
      console.log('\n💡 The pool index is out of bounds!');
      console.log('   This pool does not exist. You need to create it first.');
    }
  }
  
  console.log('\n' + '='.repeat(60));
}

diagnose().catch(console.error);

