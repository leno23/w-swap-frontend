'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import { parseUnits, MaxUint256, Contract } from 'ethers';
import { usePositionManager, useEthersSigner } from '../hooks/useContract';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { TOKEN_LIST } from '../config/contracts';
import { CONTRACTS } from '../config/contracts';
import { ERC20_ABI } from '../config/abis';
import { Card, Button, InputNumber, Select, Space, Spin, message, Typography, Row, Col, Segmented, Divider, Alert, Modal } from 'antd';
import { PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import PoolList from './PoolList';

const { Text } = Typography;

// 费率选项
const FEE_TIERS = [
  { label: '0.05%', value: 500, index: 0 },
  { label: '0.30%', value: 3000, index: 1 },
  { label: '1.00%', value: 10000, index: 2 },
];

export default function Liquidity() {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const [token0, setToken0] = useState(TOKEN_LIST[0]);
  const [token1, setToken1] = useState(TOKEN_LIST[1]);
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFee, setSelectedFee] = useState(FEE_TIERS[1].value); // 默认 0.30%
  const [fromPool, setFromPool] = useState(false); // 标记是否来自池子列表
  const [poolRefreshKey, setPoolRefreshKey] = useState(0); // 用于触发 PoolList 刷新
  const [showAddLiquidityModal, setShowAddLiquidityModal] = useState(false);

  const { balance: balance0, refetch: refetchBalance0, loading: loadingBalance0 } = useTokenBalance(token0.address);
  const { balance: balance1, refetch: refetchBalance1, loading: loadingBalance1 } = useTokenBalance(token1.address);
  const positionManager = usePositionManager();
  const signer = useEthersSigner();
  
  // 检查 signer 是否准备好
  const isSignerReady = !!signer;

  // ✅ 处理从 PoolList 传递过来的参数
  useEffect(() => {
    const token0Addr = searchParams.get('token0');
    const token1Addr = searchParams.get('token1');
    const feeIndex = searchParams.get('feeIndex');
    
    if (token0Addr && token1Addr) {
      const t0 = TOKEN_LIST.find(t => t.address.toLowerCase() === token0Addr.toLowerCase());
      const t1 = TOKEN_LIST.find(t => t.address.toLowerCase() === token1Addr.toLowerCase());
      
      if (t0 && t1) {
        setToken0(t0);
        setToken1(t1);
        
        if (feeIndex) {
          const feeTier = FEE_TIERS.find(tier => tier.index === parseInt(feeIndex));
          if (feeTier) {
            setSelectedFee(feeTier.value);
          }
        }
        
        setFromPool(true);
        message.success(`Pre-filled for ${t0.symbol}/${t1.symbol} pool`);
      }
    }
  }, [searchParams]);


  // 使用 useRef 保存 refetch 函数，避免依赖问题
  const refetchBalance0Ref = useRef(refetchBalance0);
  const refetchBalance1Ref = useRef(refetchBalance1);
  
  // 更新 ref
  refetchBalance0Ref.current = refetchBalance0;
  refetchBalance1Ref.current = refetchBalance1;

  // ✅ 当代币切换时强制刷新余额（不依赖 refetch 函数）
  useEffect(() => {
    // 使用 ref 访问最新的 refetch 函数
    refetchBalance0Ref.current();
    refetchBalance1Ref.current();
  }, [token0.address, token1.address]); // ✅ 只依赖地址，不依赖函数

  // 授权代币
  const approveTokens = async () => {
    if (!isConnected) {
      message.warning('Please connect wallet first');
      return;
    }

    if (!signer) {
      message.warning('Wallet is initializing, please wait a moment...');
      return;
    }

    try {
      setLoading(true);

      // 使用 signer 创建合约实例，确保可以发送交易
      const token0ContractWithSigner = new Contract(token0.address, ERC20_ABI, signer);
      const token1ContractWithSigner = new Contract(token1.address, ERC20_ABI, signer);

      // 授权 token0
      const tx0 = await token0ContractWithSigner.approve(CONTRACTS.PositionManager, MaxUint256);
      await tx0.wait();

      // 授权 token1
      const tx1 = await token1ContractWithSigner.approve(CONTRACTS.PositionManager, MaxUint256);
      await tx1.wait();

      message.success('Approval successful!');
    } catch (error) {
      console.error('Error approving:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error(`Approval failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 添加流动性
  const addLiquidity = async () => {
    if (!amount0 || !amount1) {
      message.warning('Please enter amounts');
      return;
    }

    if (!isConnected) {
      message.warning('Please connect wallet first');
      return;
    }

    if (!positionManager) {
      message.error('Position manager not found. Please wait a moment and try again.');
      return;
    }

    try {
      setLoading(true);
      const amount0Wei = parseUnits(amount0, 18);
      const amount1Wei = parseUnits(amount1, 18);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      const selectedFeeTier = FEE_TIERS.find(fee => fee.value === selectedFee);

      const tx = await positionManager.mint({
        token0: token0.address,
        token1: token1.address,
        index: selectedFeeTier?.index ?? 1, // 使用选择的费率对应的索引
        amount0Desired: amount0Wei,
        amount1Desired: amount1Wei,
        recipient: address,
        deadline: deadline,
      });

      await tx.wait();
      message.success('Liquidity added successfully!');
      setAmount0('');
      setAmount1('');
      // 刷新余额
      refetchBalance0();
      refetchBalance1();
      // 触发 PoolList 刷新
      setPoolRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error adding liquidity:', error);
      
      // 提供更友好的错误提示
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes('UNSUPPORTED_OPERATION')) {
          errorMessage = 'Please make sure your wallet is connected and unlocked.';
        } else if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected.';
        }
      }
      
      message.error(`Add liquidity failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 池子列表 */}
      <PoolList refreshKey={poolRefreshKey} />

      {/* Add Liquidity Modal (保留用于从 URL 参数自动打开) */}
      <Modal
        title="Add Liquidity"
        open={showAddLiquidityModal}
        onCancel={() => {
          setShowAddLiquidityModal(false);
          setAmount0('');
          setAmount1('');
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 来自池子列表的提示 */}
          {fromPool ? (
            <Alert
              message="Pool Pre-selected"
              description={`Adding liquidity to ${token0.symbol}/${token1.symbol} pool`}
              type="info"
              showIcon
              closable
              onClose={() => setFromPool(false)}
            />
          ) : (
            <Alert
              message="Add Liquidity to Pool"
              description="Select token pair, fee tier, and specify the amounts you want to provide."
              type="info"
              showIcon
            />
          )}

          {/* 费率选择 */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Fee Tier</Text>
            <Segmented
              options={FEE_TIERS.map(fee => ({
                label: fee.label,
                value: fee.value,
              }))}
              value={selectedFee}
              onChange={(val) => setSelectedFee(val as number)}
              block
              disabled={loading}
            />
          </div>
          
          {/* Token 0 Input */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Token 0</Text>
            <Card size="small" style={{ marginBottom: 8 }}>
              <Row gutter={12} align="middle">
                <Col flex="auto">
                  <InputNumber
                    style={{ width: '100%', fontSize: 24, fontWeight: 600 }}
                    bordered={false}
                    placeholder="0.0"
                    value={amount0 ? parseFloat(amount0) : undefined}
                    onChange={(val) => setAmount0(val?.toString() || '')}
                    disabled={loading}
                    controls={false}
                    min={0}
                    stringMode
                  />
                </Col>
                <Col>
                  <Select
                    value={token0.address}
                    onChange={(val) => setToken0(TOKEN_LIST.find(t => t.address === val) || TOKEN_LIST[0])}
                    disabled={loading}
                    style={{ width: 120 }}
                    size="large"
                  >
                    {TOKEN_LIST.map((token) => (
                      <Select.Option key={token.address} value={token.address}>
                        {token.symbol}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            </Card>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Balance: {loadingBalance0 ? (
                <Spin size="small" />
              ) : (
                <Text strong>{parseFloat(balance0).toFixed(4)}</Text>
              )}
            </Text>
          </div>

          <Divider style={{ margin: '8px 0' }}>
            <PlusOutlined style={{ color: '#999' }} />
          </Divider>

          {/* Token 1 Input */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Token 1</Text>
            <Card size="small" style={{ marginBottom: 8 }}>
              <Row gutter={12} align="middle">
                <Col flex="auto">
                  <InputNumber
                    style={{ width: '100%', fontSize: 24, fontWeight: 600 }}
                    bordered={false}
                    placeholder="0.0"
                    value={amount1 ? parseFloat(amount1) : undefined}
                    onChange={(val) => setAmount1(val?.toString() || '')}
                    disabled={loading}
                    controls={false}
                    min={0}
                    stringMode
                  />
                </Col>
                <Col>
                  <Select
                    value={token1.address}
                    onChange={(val) => setToken1(TOKEN_LIST.find(t => t.address === val) || TOKEN_LIST[1])}
                    disabled={loading}
                    style={{ width: 120 }}
                    size="large"
                  >
                    {TOKEN_LIST.map((token) => (
                      <Select.Option key={token.address} value={token.address}>
                        {token.symbol}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            </Card>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Balance: {loadingBalance1 ? (
                <Spin size="small" />
              ) : (
                <Text strong>{parseFloat(balance1).toFixed(4)}</Text>
              )}
            </Text>
          </div>

          <Divider />

          {!isConnected ? (
            <Button type="primary" size="large" block disabled>
              Connect Wallet
            </Button>
          ) : !isSignerReady ? (
            <Button type="primary" size="large" block disabled loading>
              Initializing Wallet...
            </Button>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="default"
                size="large" 
                onClick={approveTokens}
                disabled={loading}
                block
                icon={<CheckCircleOutlined />}
              >
                Approve Tokens
              </Button>
              <Button 
                type="primary"
                size="large" 
                onClick={addLiquidity}
                disabled={loading || !amount0 || !amount1}
                block
                loading={loading}
                icon={<PlusOutlined />}
              >
                Add Liquidity
              </Button>
            </Space>
          )}
        </Space>
      </Modal>
    </div>
  );
}
