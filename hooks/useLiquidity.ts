'use client';

import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Contract } from 'ethers';
import { BrowserProvider } from 'ethers';
import toast from 'react-hot-toast';
import { CONTRACT_ADDRESSES } from '@/contracts/addresses';
import PositionManagerABI from '@/contracts/abis/PositionManager.json';
import PoolManagerABI from '@/contracts/abis/PoolManager.json';
import ERC20ABI from '@/contracts/abis/ERC20.json';
import { calculateDeadline, sortTokens } from '@/lib/utils';
import { DEFAULT_TICK_LOWER, DEFAULT_TICK_UPPER, DEFAULT_FEE_TIER } from '@/lib/constants';
import { analyzePoolABI } from '@/lib/diagnostics';

export function useLiquidity() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const approveTokens = async (
    token0: string,
    token1: string,
    amount0: bigint,
    amount1: bigint
  ): Promise<boolean> => {
    if (!walletClient || !address) return false;

    try {
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();

      // Approve token0
      if (amount0 > 0) {
        const token0Contract = new Contract(token0, ERC20ABI, signer);
        
        toast.loading('Approving token 0...', { id: 'approve0' });
        const tx0 = await token0Contract.approve(
          CONTRACT_ADDRESSES.sepolia.positionManager,
          amount0
        );
        console.log('Token0 approve tx sent:', tx0.hash);
        
        toast.loading('Waiting for token 0 approval confirmation...', { id: 'approve0' });
        const receipt0 = await tx0.wait();
        console.log('Token0 approved, block:', receipt0.blockNumber);
        toast.success('Token 0 approved! ✓', { id: 'approve0', duration: Infinity });
        
        // 等待一下确保状态同步
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Approve token1
      if (amount1 > 0) {
        const token1Contract = new Contract(token1, ERC20ABI, signer);
        
        toast.loading('Approving token 1...', { id: 'approve1' });
        const tx1 = await token1Contract.approve(
          CONTRACT_ADDRESSES.sepolia.positionManager,
          amount1
        );
        console.log('Token1 approve tx sent:', tx1.hash);
        
        toast.loading('Waiting for token 1 approval confirmation...', { id: 'approve1' });
        const receipt1 = await tx1.wait();
        console.log('Token1 approved, block:', receipt1.blockNumber);
        toast.success('Token 1 approved! ✓', { id: 'approve1', duration: Infinity });
        
        // 等待一下确保状态同步
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      return true;
    } catch (error: any) {
      console.error('Approval error:', error);
      
      let errorMsg = 'Approval failed';
      if (error.message?.includes('user rejected')) {
        errorMsg = 'User rejected the approval';
      } else if (error.message?.includes('network')) {
        errorMsg = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg, { id: 'approve0', duration: 8000 });
      toast.dismiss('approve1');
      return false;
    }
  };

  const addLiquidity = async (
    tokenA: string,
    tokenB: string,
    amountADesired: bigint,
    amountBDesired: bigint,
    poolIndex?: number
  ): Promise<boolean> => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    setIsAdding(true);

    try {
      // 🔍 诊断：检查 Pool ABI 是否完整
      const abiAnalysis = analyzePoolABI();
      if (abiAnalysis.missingMint) {
        console.error('');
        console.error('╔═══════════════════════════════════════════════════════════╗');
        console.error('║  ❌ CRITICAL ERROR: Pool ABI is INCOMPLETE!              ║');
        console.error('╚═══════════════════════════════════════════════════════════╝');
        console.error('');
        console.error('The Pool.json file is missing the mint() function and other');
        console.error('state-changing functions. This is why you\'re getting');
        console.error('"missing revert data" errors.');
        console.error('');
        console.error('SOLUTION:');
        console.error('1. Get the complete Pool.sol ABI from your contract source');
        console.error('2. Update lib/Pool.json with the complete ABI');
        console.error('3. The Pool ABI should include: mint(), burn(), swap(), etc.');
        console.error('');
        
        toast.error(
          'Pool ABI is incomplete! Check console for details.',
          { id: 'addLiquidity', duration: 15000 }
        );
        setIsAdding(false);
        return false;
      }
      
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();

      // 1. 排序代币（确保 token0 < token1）
      const [token0, token1] = sortTokens(tokenA, tokenB);
      const [amount0Desired, amount1Desired] = tokenA.toLowerCase() < tokenB.toLowerCase()
        ? [amountADesired, amountBDesired]
        : [amountBDesired, amountADesired];

      console.log('Sorted tokens:', { token0, token1, amount0Desired, amount1Desired });

      // 2. 检查池子是否存在
      const poolManager = new Contract(
        CONTRACT_ADDRESSES.sepolia.poolManager,
        PoolManagerABI,
        provider
      );

      let poolAddress = null;
      let actualPoolIndex: number | null = null;
      
      try {
        // 先获取所有池子，检查是否有我们需要的池子
        const allPools = await poolManager.getAllPools();
        console.log('All pools:', allPools.length);
        
        // 查找匹配的池子
        const matchingPool = allPools.find(
          (pool: any) => 
            pool.token0.toLowerCase() === token0.toLowerCase() && 
            pool.token1.toLowerCase() === token1.toLowerCase() &&
            (poolIndex === undefined || pool.index === poolIndex)
        );
        
        if (matchingPool) {
          poolAddress = matchingPool.pool;
          actualPoolIndex = Number(matchingPool.index);
          console.log('Found pool:', { address: poolAddress, index: actualPoolIndex });
        } else {
          console.log('Pool not found, will create');
        }
      } catch (error) {
        console.log('Error checking pools:', error);
        poolAddress = null;
      }

      // 3. 如果池子不存在，创建并初始化
      if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') {
        toast.loading('Creating pool...', { id: 'createPool' });
        
        const poolManagerWithSigner = new Contract(
          CONTRACT_ADDRESSES.sepolia.poolManager,
          PoolManagerABI,
          signer
        );

        // 创建池子，使用默认价格 sqrt(1) * 2^96 = 79228162514264337593543950336
        const sqrtPriceX96 = BigInt('79228162514264337593543950336'); // 1:1 价格
        
        const createTx = await poolManagerWithSigner.createAndInitializePoolIfNecessary({
          token0,
          token1,
          fee: DEFAULT_FEE_TIER,
          tickLower: DEFAULT_TICK_LOWER,
          tickUpper: DEFAULT_TICK_UPPER,
          sqrtPriceX96
        });
        
        const receipt = await createTx.wait();
        console.log('Pool creation receipt:', receipt);
        
        // 从交易日志中解析 PoolCreated 事件获取池子地址和 index
        if (receipt?.logs && receipt.logs.length > 0) {
          try {
            const iface = poolManagerWithSigner.interface;
            
            for (const log of receipt.logs) {
              try {
                const parsedLog = iface.parseLog({
                  topics: [...log.topics],
                  data: log.data
                });
                
                if (parsedLog && parsedLog.name === 'PoolCreated' && parsedLog.args.pool) {
                  poolAddress = parsedLog.args.pool;
                  actualPoolIndex = Number(parsedLog.args.index);
                  console.log('Pool created from event:', { 
                    address: poolAddress, 
                    index: actualPoolIndex 
                  });
                  toast.success('Pool created!', { id: 'createPool' });
                  break;
                }
              } catch (e) {
                // 跳过无法解析的日志
                continue;
              }
            }
          } catch (error) {
            console.log('Error parsing event logs:', error);
          }
        }
        
        // 如果从事件中解析失败，尝试通过 getAllPools 查找
        if (!poolAddress || actualPoolIndex === null) {
          console.log('Failed to parse pool from event, querying getAllPools...');
          
          // 等待一下确保状态同步
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const allPools = await poolManager.getAllPools();
          console.log('Total pools after creation:', allPools.length);
          
          // 查找匹配的池子（不限制 index）
          const newPool = allPools.find(
            (pool: any) => 
              pool.token0.toLowerCase() === token0.toLowerCase() && 
              pool.token1.toLowerCase() === token1.toLowerCase()
          );
          
          if (newPool) {
            poolAddress = newPool.pool;
            actualPoolIndex = Number(newPool.index);
            console.log('Pool found via getAllPools:', { 
              address: poolAddress, 
              index: actualPoolIndex 
            });
            toast.success('Pool created!', { id: 'createPool' });
          } else {
            console.error('Pool not found after creation. All pools:', allPools);
            toast.error('Pool created but not found. Please refresh and try again.', { id: 'createPool', duration: 5000 });
            setIsAdding(false);
            return false;
          }
        }
      }

      // 确保我们有有效的池子 index
      if (actualPoolIndex === null) {
        toast.error('Failed to get pool index. Please try again.', { id: 'addLiquidity' });
        setIsAdding(false);
        return false;
      }

      // 4. 检查池子状态
      const Pool = await import('@/lib/Pool.json');
      const poolContract = new Contract(poolAddress, Pool.default, provider);
      
      try {
        const sqrtPriceX96 = await poolContract.sqrtPriceX96();
        const liquidity = await poolContract.liquidity();
        console.log('Pool state:', {
          address: poolAddress,
          index: actualPoolIndex,
          sqrtPriceX96: sqrtPriceX96.toString(),
          liquidity: liquidity.toString()
        });
        
        // 如果 sqrtPriceX96 是 0，说明池子未初始化
        if (sqrtPriceX96 === BigInt(0)) {
          toast.error('Pool is not initialized. Please contact support.', { id: 'addLiquidity' });
          setIsAdding(false);
          return false;
        }
      } catch (error) {
        console.error('Error checking pool state:', error);
      }

      // 5. 批准代币
      const approved = await approveTokens(token0, token1, amount0Desired, amount1Desired);
      if (!approved) {
        setIsAdding(false);
        return false;
      }

      // 6. 验证批准和余额
      toast.loading('Verifying approvals and balances...', { id: 'verify' });
      const token0Contract = new Contract(token0, ERC20ABI, provider);
      const token1Contract = new Contract(token1, ERC20ABI, provider);
      
      // 检查余额
      const balance0 = await token0Contract.balanceOf(address);
      const balance1 = await token1Contract.balanceOf(address);
      
      console.log('Token Balances:', {
        balance0: balance0.toString(),
        balance1: balance1.toString(),
        needed0: amount0Desired.toString(),
        needed1: amount1Desired.toString()
      });

      // 检查余额是否足够
      if (balance0 < amount0Desired) {
        toast.error(`Insufficient Token 0 balance. Have: ${balance0.toString()}, Need: ${amount0Desired.toString()}`, { 
          id: 'verify',
          duration: 8000 
        });
        setIsAdding(false);
        return false;
      }

      if (balance1 < amount1Desired) {
        toast.error(`Insufficient Token 1 balance. Have: ${balance1.toString()}, Need: ${amount1Desired.toString()}`, { 
          id: 'verify',
          duration: 8000 
        });
        setIsAdding(false);
        return false;
      }
      
      // 检查授权
      const allowance0 = await token0Contract.allowance(
        address,
        CONTRACT_ADDRESSES.sepolia.positionManager
      );
      const allowance1 = await token1Contract.allowance(
        address,
        CONTRACT_ADDRESSES.sepolia.positionManager
      );
      
      console.log('Allowances:', {
        allowance0: allowance0.toString(),
        allowance1: allowance1.toString(),
        needed0: amount0Desired.toString(),
        needed1: amount1Desired.toString()
      });

      if (allowance0 < amount0Desired || allowance1 < amount1Desired) {
        toast.error('Insufficient allowance. Please try approving again.', { id: 'verify' });
        setIsAdding(false);
        return false;
      }
      toast.dismiss('verify');

      // 7. 添加流动性
      const positionManager = new Contract(
        CONTRACT_ADDRESSES.sepolia.positionManager,
        PositionManagerABI,
        signer
      );

      // 再次确认池子地址
      console.log('Pool address for mint:', poolAddress);
      console.log('PositionManager address:', CONTRACT_ADDRESSES.sepolia.positionManager);
      
      // 验证池子地址确实有效
      if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') {
        toast.error('Invalid pool address. Please try again.', { id: 'addLiquidity' });
        setIsAdding(false);
        return false;
      }

      const params = {
        token0,
        token1,
        index: actualPoolIndex,  // ✅ 使用从池子查询或事件中获取的实际 index
        recipient: address,
        amount0Desired: Number(amount0Desired),
        amount1Desired: Number(amount1Desired),
        // amount0Min: (amount0Desired * BigInt(95)) / BigInt(100), // 5% slippage
        // amount1Min: (amount1Desired * BigInt(95)) / BigInt(100),
        deadline: Number(calculateDeadline(20)),
      };

      console.log('Mint params:', params);
      console.log('Using pool index:', actualPoolIndex, '(requested:', poolIndex, ')');
      
      // 验证 deadline
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const deadlineSeconds = Number(params.deadline);
      console.log('Deadline check:', {
        current: currentTimestamp,
        deadline: deadlineSeconds,
        timeRemaining: deadlineSeconds - currentTimestamp,
        isValid: deadlineSeconds > currentTimestamp
      });
      
      if (deadlineSeconds <= currentTimestamp) {
        toast.error('Deadline has passed! Please try again.', { id: 'addLiquidity' });
        setIsAdding(false);
        return false;
      }
      
      // 解码并显示实际编码的数据
      try {
        const encodedData = positionManager.interface.encodeFunctionData('mint', [params]);
        console.log('Encoded transaction data:', encodedData);
        console.log('Encoded data length:', encodedData.length);
        
        // 解码验证
        const decoded = positionManager.interface.decodeFunctionData('mint', encodedData);
        console.log('Decoded params (verification):', {
          token0: decoded[0].token0,
          token1: decoded[0].token1,
          index: decoded[0].index.toString(),
          recipient: decoded[0].recipient,
          amount0Desired: decoded[0].amount0Desired.toString(),
          amount1Desired: decoded[0].amount1Desired.toString(),
          deadline: decoded[0].deadline.toString()
        });
      } catch (e) {
        console.error('Failed to encode/decode:', e);
      }

      toast.loading('Adding liquidity...', { id: 'addLiquidity' });
      
      // 最后一次验证：尝试直接调用 poolManager.getPool 确认池子存在
      try {
        const verifyPoolAddress = await poolManager.getPool(token0, token1, actualPoolIndex);
        console.log('Verified pool address from poolManager.getPool:', verifyPoolAddress);
        
        if (verifyPoolAddress === '0x0000000000000000000000000000000000000000') {
          toast.error('Pool does not exist in PoolManager', { id: 'addLiquidity' });
          setIsAdding(false);
          return false;
        }
        
        if (verifyPoolAddress.toLowerCase() !== poolAddress.toLowerCase()) {
          console.warn('Pool address mismatch!', {
            expected: poolAddress,
            actual: verifyPoolAddress
          });
        }
        
        // 再次检查池子状态
        const Pool = await import('@/lib/Pool.json');
        const verifyPoolContract = new Contract(verifyPoolAddress, Pool.default, provider);
        const verifySqrtPriceX96 = await verifyPoolContract.sqrtPriceX96();
        const verifyLiquidity = await verifyPoolContract.liquidity();
        const verifyTickLower = await verifyPoolContract.tickLower();
        const verifyTickUpper = await verifyPoolContract.tickUpper();
        const verifyTick = await verifyPoolContract.tick();
        
        console.log('Final pool verification:', {
          address: verifyPoolAddress,
          sqrtPriceX96: verifySqrtPriceX96.toString(),
          liquidity: verifyLiquidity.toString(),
          tickLower: verifyTickLower.toString(),
          tickUpper: verifyTickUpper.toString(),
          tick: verifyTick.toString()
        });
        
        // 计算当前价格
        const currentPrice = (Number(verifySqrtPriceX96) / (2 ** 96)) ** 2;
        const desiredRatio = Number(amount1Desired) / Number(amount0Desired);
        const priceDifference = Math.abs(currentPrice - desiredRatio);
        const priceTolerancePercent = 0.05; // 5% 容差
        
        console.log('Price analysis:', {
          currentPoolPrice: currentPrice.toFixed(6),
          desiredRatio: desiredRatio.toFixed(6),
          priceDifference: priceDifference.toFixed(6),
          priceMismatch: priceDifference > currentPrice * priceTolerancePercent ? 'WARNING: Large difference!' : 'OK'
        });
        
        // 如果价格差异太大，给出警告并调整
        if (priceDifference > currentPrice * priceTolerancePercent) {
          console.warn('⚠️ RATIO MISMATCH DETECTED ⚠️');
          console.warn(`Pool price is ${currentPrice.toFixed(6)}, but you're trying to add at ratio ${desiredRatio.toFixed(6)}`);
          console.warn('The transaction will likely fail.');
          console.warn(`You should add tokens at ratio ~${currentPrice.toFixed(6)}:1`);
          
          toast.error(
            `Price mismatch! Pool price is ${currentPrice.toFixed(2)}:1, but you're adding ${desiredRatio.toFixed(2)}:1. Please adjust your amounts.`,
            { id: 'addLiquidity', duration: 10000 }
          );
          setIsAdding(false);
          return false;
        }
        
        if (verifySqrtPriceX96 === BigInt(0)) {
          toast.error('Pool is not initialized (sqrtPriceX96 = 0)', { id: 'addLiquidity', duration: 5000 });
          setIsAdding(false);
          return false;
        }
        
        // 再次检查余额和授权
        const finalBalance0 = await token0Contract.balanceOf(address);
        const finalBalance1 = await token1Contract.balanceOf(address);
        const finalAllowance0 = await token0Contract.allowance(address, CONTRACT_ADDRESSES.sepolia.positionManager);
        const finalAllowance1 = await token1Contract.allowance(address, CONTRACT_ADDRESSES.sepolia.positionManager);
        
        console.log('Final balances and allowances:', {
          balance0: finalBalance0.toString(),
          balance1: finalBalance1.toString(),
          allowance0: finalAllowance0.toString(),
          allowance1: finalAllowance1.toString(),
          needed0: amount0Desired.toString(),
          needed1: amount1Desired.toString(),
          approvedTo: CONTRACT_ADDRESSES.sepolia.positionManager,
          poolAddress: verifyPoolAddress
        });
        
        console.warn('IMPORTANT: Tokens are approved to PositionManager, NOT to Pool');
        console.warn('PositionManager will call transferFrom in the mintCallback');
        
        if (finalBalance0 < amount0Desired || finalBalance1 < amount1Desired) {
          toast.error('Insufficient balance', { id: 'addLiquidity' });
          setIsAdding(false);
          return false;
        }
        
        if (finalAllowance0 < amount0Desired || finalAllowance1 < amount1Desired) {
          toast.error('Insufficient allowance', { id: 'addLiquidity' });
          setIsAdding(false);
          return false;
        }
        
      } catch (verifyError: any) {
        console.error('Failed to verify pool with poolManager.getPool:', verifyError);
        toast.error('Pool verification failed. The pool may not exist.', { id: 'addLiquidity' });
        setIsAdding(false);
        return false;
      }
      
      // 诊断：检查合约配置
      console.log('=== DIAGNOSTIC: Checking Contract Configuration ===');
      
      // 检查 PositionManager 是否有代码（是否正确部署）
      const positionManagerCode = await provider.getCode(CONTRACT_ADDRESSES.sepolia.positionManager);
      console.log('PositionManager bytecode length:', positionManagerCode.length);
      if (positionManagerCode === '0x' || positionManagerCode.length <= 2) {
        toast.error('PositionManager contract not deployed at the specified address!', { id: 'addLiquidity', duration: 10000 });
        setIsAdding(false);
        return false;
      }
      
      // 检查 Pool 的 factory
      try {
        const Pool = await import('@/lib/Pool.json');
        const poolContract = new Contract(poolAddress, Pool.default, provider);
        const poolFactory = await poolContract.factory();
        console.log('Pool factory address:', poolFactory);
        console.log('Expected PoolManager address:', CONTRACT_ADDRESSES.sepolia.poolManager);
        console.log('Factory matches PoolManager:', poolFactory.toLowerCase() === CONTRACT_ADDRESSES.sepolia.poolManager.toLowerCase());
        
        // 如果 factory 不匹配，这可能是问题所在
        if (poolFactory.toLowerCase() !== CONTRACT_ADDRESSES.sepolia.poolManager.toLowerCase()) {
          toast.error(
            `Pool factory mismatch! Pool was created by ${poolFactory} but PoolManager is ${CONTRACT_ADDRESSES.sepolia.poolManager}`,
            { id: 'addLiquidity', duration: 10000 }
          );
          console.error('⚠️ CRITICAL: Pool factory does not match PoolManager!');
          console.error('This pool may not accept calls from PositionManager');
          setIsAdding(false);
          return false;
        }
      } catch (factoryError) {
        console.log('Could not verify pool factory (this might be OK if Pool contract has no factory() method):', factoryError);
      }
      
      // 尝试验证 PositionManager 是否知道 PoolManager
      try {
        // PositionManager 应该有一个 poolManager 或类似的 getter
        const positionManagerContract = new Contract(
          CONTRACT_ADDRESSES.sepolia.positionManager,
          PositionManagerABI,
          provider
        );
        
        // 检查 PositionManager 的 ABI 中是否有 poolManager getter
        const hasPoolManagerGetter = PositionManagerABI.some((item: any) => 
          item.type === 'function' && 
          item.name === 'poolManager' && 
          item.stateMutability === 'view'
        );
        
        if (hasPoolManagerGetter) {
          const pmPoolManager = await positionManagerContract.poolManager();
          console.log('PositionManager.poolManager():', pmPoolManager);
          console.log('Actual PoolManager:', CONTRACT_ADDRESSES.sepolia.poolManager);
          
          if (pmPoolManager.toLowerCase() !== CONTRACT_ADDRESSES.sepolia.poolManager.toLowerCase()) {
            toast.error(
              `PositionManager configuration error! It points to ${pmPoolManager} but should point to ${CONTRACT_ADDRESSES.sepolia.poolManager}`,
              { id: 'addLiquidity', duration: 10000 }
            );
            console.error('⚠️ CRITICAL: PositionManager poolManager address mismatch!');
            setIsAdding(false);
            return false;
          }
        }
      } catch (pmError) {
        console.log('Could not verify PositionManager configuration:', pmError);
      }
      
      // 额外检查：尝试直接在 Pool 上计算流动性
      console.log('=== Testing Liquidity Calculation ===');
      try {
        const Pool = await import('@/lib/Pool.json');
        const poolContract = new Contract(poolAddress, Pool.default, provider);
        
        // 从池子获取当前价格
        const currentSqrtPriceX96 = await poolContract.sqrtPriceX96();
        const currentLiquidity = await poolContract.liquidity();
        const poolTickLower = await poolContract.tickLower();
        const poolTickUpper = await poolContract.tickUpper();
        
        console.log('Pool parameters for liquidity calculation:', {
          sqrtPriceX96: currentSqrtPriceX96.toString(),
          liquidity: currentLiquidity.toString(),
          tickLower: poolTickLower.toString(),
          tickUpper: poolTickUpper.toString(),
          amount0Desired: amount0Desired.toString(),
          amount1Desired: amount1Desired.toString()
        });
        
        // 检查价格范围是否有效
        if (poolTickLower >= poolTickUpper) {
          console.error('❌ Invalid tick range: tickLower >= tickUpper');
          toast.error('Pool has invalid tick range configuration', { id: 'addLiquidity', duration: 10000 });
          setIsAdding(false);
          return false;
        }
        
        // 检查当前 tick 是否在范围内
        const currentTick = await poolContract.tick();
        console.log('Current tick:', currentTick.toString());
        console.log('Tick in range?', currentTick >= poolTickLower && currentTick <= poolTickUpper);
        
      } catch (calcError: any) {
        console.error('Failed to calculate expected liquidity:', calcError);
      }
      
      // 检查 PositionManager ABI 是否包含必要的函数
      console.log('=== Checking PositionManager ABI ===');
      const mintFunction = PositionManagerABI.find((item: any) => 
        item.type === 'function' && item.name === 'mint'
      );
      console.log('mint() function found in ABI:', !!mintFunction);
      if (mintFunction) {
        console.log('mint() inputs:', JSON.stringify(mintFunction.inputs, null, 2));
      }
      
      // 最后一次确认：重新检查授权（防止时间过长导致状态变化）
      console.log('=== Final Allowance Check (right before staticCall) ===');
      const lastMinuteAllowance0 = await token0Contract.allowance(address, CONTRACT_ADDRESSES.sepolia.positionManager);
      const lastMinuteAllowance1 = await token1Contract.allowance(address, CONTRACT_ADDRESSES.sepolia.positionManager);
      console.log('Final token0 allowance:', lastMinuteAllowance0.toString(), 'needed:', amount0Desired.toString());
      console.log('Final token1 allowance:', lastMinuteAllowance1.toString(), 'needed:', amount1Desired.toString());
      
      if (lastMinuteAllowance0 < amount0Desired) {
        console.error('❌ Token0 allowance insufficient at final check!');
        toast.error('Token 0 allowance lost. Please try again.', { id: 'addLiquidity', duration: 10000 });
        setIsAdding(false);
        return false;
      }
      
      if (lastMinuteAllowance1 < amount1Desired) {
        console.error('❌ Token1 allowance insufficient at final check!');
        toast.error('Token 1 allowance lost. Please try again.', { id: 'addLiquidity', duration: 10000 });
        setIsAdding(false);
        return false;
      }
      
      // 先用 staticCall 模拟执行，获取具体的 revert 原因
      console.log('=== Simulating transaction with staticCall ===');
      console.log('Transaction will call: PositionManager.mint()');
      console.log('Which will call: Pool.mint()');
      console.log('Which will callback: PositionManager.mintCallback()');
      console.log('Which will transferFrom: User -> Pool');
      console.log('Full params:', JSON.stringify({
        token0: params.token0,
        token1: params.token1,
        index: params.index.toString(),
        recipient: params.recipient,
        amount0Desired: params.amount0Desired.toString(),
        amount1Desired: params.amount1Desired.toString(),
        deadline: params.deadline.toString()
      }, null, 2));
      // console.log('Encoded call data:', positionManager.interface.encodeFunctionData('mint', [params]));
      
      try {
        const result = await positionManager.mint(params);
        console.log('✅ StaticCall result (transaction would succeed):', result);
        console.log('Expected return: positionId, liquidity, amount0, amount1');
      } catch (staticError: any) {
        console.error('❌ StaticCall failed (transaction would revert):', staticError);
        
        // 尝试解析 revert 原因
        let revertReason = 'Unknown error';
        
        if (staticError.reason) {
          revertReason = staticError.reason;
        } else if (staticError.data) {
          // 尝试解析 revert 数据
          try {
            const iface = positionManager.interface;
            const decodedError = iface.parseError(staticError.data);
            if (decodedError) {
              revertReason = `${decodedError.name}: ${JSON.stringify(decodedError.args)}`;
            }
          } catch (e) {
            // 无法解析，尝试直接显示 data
            revertReason = `Revert data: ${staticError.data}`;
          }
        } else if (staticError.message) {
          revertReason = staticError.message;
        }
        
        console.error('Contract would revert with reason:', revertReason);
        
        // ⚠️ 如果是 "missing revert data"，提供更多帮助信息
        if (staticError.message?.includes('missing revert data')) {
          console.error('=== DEBUGGING MISSING REVERT DATA ===');
          console.error('This usually means:');
          console.error('1. Pool.mint() is reverting with require() without error message');
          console.error('2. Pool might be checking msg.sender and rejecting PositionManager');
          console.error('3. Callback validation is failing');
          console.error('4. There might be a low-level call failure in the Pool contract');
          
          toast.error(
            'Transaction would fail. This might be a Pool contract configuration issue. Please check if the Pool was created correctly by the PoolManager.',
            { id: 'addLiquidity', duration: 10000 }
          );
          setIsAdding(false);
          return false;
        }
        
        // 其他错误也直接返回，不再尝试发送交易
        toast.error(`Transaction would fail: ${revertReason}`, { id: 'addLiquidity', duration: 10000 });
        setIsAdding(false);
        return false;
      }
      
      // ✅ StaticCall 通过，现在发送真实交易
      toast.loading('Sending transaction...', { id: 'addLiquidity' });
      
      try {
        const tx = await positionManager.mint(params);
        
        console.log('Transaction sent:', tx.hash);
        toast.loading('Transaction sent, waiting for confirmation...', { id: 'addLiquidity' });
        
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);
        
        // 关闭 approve 提示
        toast.dismiss('approve0');
        toast.dismiss('approve1');
        
        toast.success('Liquidity added successfully!', { id: 'addLiquidity' });
        setIsAdding(false);
        return true;
      } catch (txError: any) {
        console.error('Transaction failed:', txError);
        console.error('Transaction error details:', {
          code: txError.code,
          message: txError.message,
          reason: txError.reason,
          data: txError.data,
          error: txError.error,
          transaction: txError.transaction
        });
        
        // 尝试解析具体的错误原因
        let specificError = 'Transaction failed';
        
        if (txError.reason) {
          specificError = `Error: ${txError.reason}`;
        } else if (txError.error?.message) {
          specificError = txError.error.message;
        } else if (txError.message) {
          if (txError.message.includes('user rejected')) {
            specificError = 'User rejected the transaction';
          } else if (txError.message.includes('insufficient funds')) {
            specificError = 'Insufficient ETH for gas';
          } else {
            specificError = txError.message.substring(0, 150);
          }
        }
        
        // 关闭 approve 提示
        toast.dismiss('approve0');
        toast.dismiss('approve1');
        
        toast.error(specificError, { id: 'addLiquidity', duration: 10000 });
        setIsAdding(false);
        return false;
      }
    } catch (error: any) {
      console.error('Add liquidity error:', error);
      
      // 提供更详细的错误信息
      let errorMessage = 'Failed to add liquidity';
      if (error.message?.includes('INITIALIZED')) {
        errorMessage = 'Pool already initialized';
      } else if (error.message?.includes('SPL')) {
        errorMessage = 'Price limit error';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // 关闭 approve 提示
      toast.dismiss('approve0');
      toast.dismiss('approve1');
      
      toast.error(errorMessage, { id: 'addLiquidity' });
      setIsAdding(false);
      return false;
    }
  };

  const removeLiquidity = async (positionId: bigint): Promise<boolean> => {
    if (!walletClient || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    setIsRemoving(true);

    try {
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const positionManager = new Contract(
        CONTRACT_ADDRESSES.sepolia.positionManager,
        PositionManagerABI,
        signer
      );

      toast.loading('Removing liquidity...', { id: 'removeLiquidity' });
      const burnTx = await positionManager.burn(positionId);
      await burnTx.wait();

      toast.loading('Collecting tokens...', { id: 'removeLiquidity' });
      const collectTx = await positionManager.collect(positionId, address);
      await collectTx.wait();

      toast.success('Liquidity removed successfully!', { id: 'removeLiquidity' });
      setIsRemoving(false);
      return true;
    } catch (error: any) {
      console.error('Remove liquidity error:', error);
      toast.error(error.message || 'Failed to remove liquidity', { id: 'removeLiquidity' });
      setIsRemoving(false);
      return false;
    }
  };

  return {
    addLiquidity,
    removeLiquidity,
    isAdding,
    isRemoving,
  };
}

