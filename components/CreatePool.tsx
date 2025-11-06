'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'ethers';
import { usePoolManager, useEthersSigner } from '../hooks/useContract';
import { TOKEN_LIST } from '../config/contracts';
import { 
  Card, 
  Button, 
  InputNumber, 
  Select, 
  Space, 
  message, 
  Typography, 
  Row, 
  Col, 
  Segmented,
  Divider,
  Alert,
  Slider,
  Form,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  InfoCircleOutlined, 
  ThunderboltOutlined,
  WarningOutlined 
} from '@ant-design/icons';
import { 
  priceToSqrtPriceX96, 
  priceToTick, 
  roundTickToSpacing, 
  getTickSpacing,
  calculateTickRange,
  validateTickRange,
  formatPrice,
  tickToPrice,
  getPriceRangeFromTicks
} from '../utils/priceUtils';

const { Text, Title } = Typography;

// 费率选项
const FEE_TIERS = [
  { label: '0.05%', value: 500, index: 0, description: 'Best for stable pairs' },
  { label: '0.30%', value: 3000, index: 1, description: 'Best for most pairs' },
  { label: '1.00%', value: 10000, index: 2, description: 'Best for exotic pairs' },
];

// 预设价格范围
const PRESET_RANGES = [
  { label: 'Narrow (±5%)', value: 5 },
  { label: 'Medium (±10%)', value: 10 },
  { label: 'Wide (±25%)', value: 25 },
  { label: 'Very Wide (±50%)', value: 50 },
];

interface CreatePoolProps {
  onPoolCreated?: () => void;
}

export default function CreatePool({ onPoolCreated }: CreatePoolProps) {
  const { address, isConnected } = useAccount();
  const [token0, setToken0] = useState(TOKEN_LIST[0]);
  const [token1, setToken1] = useState(TOKEN_LIST[1]);
  const [selectedFee, setSelectedFee] = useState(FEE_TIERS[1].value);
  const [currentPrice, setCurrentPrice] = useState<string>('1');
  const [rangePercentage, setRangePercentage] = useState(10); // ±10%
  const [customTickLower, setCustomTickLower] = useState<string>('');
  const [customTickUpper, setCustomTickUpper] = useState<string>('');
  const [useCustomTicks, setUseCustomTicks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculatedRange, setCalculatedRange] = useState<{
    tickLower: number;
    tickUpper: number;
    minPrice: number;
    maxPrice: number;
  } | null>(null);

  const poolManager = usePoolManager();
  const signer = useEthersSigner();
  const isSignerReady = !!signer;

  // 计算价格范围
  useEffect(() => {
    if (!currentPrice || parseFloat(currentPrice) <= 0) {
      setCalculatedRange(null);
      return;
    }

    try {
      const price = parseFloat(currentPrice);
      const tickSpacing = getTickSpacing(selectedFee);
      const range = calculateTickRange(price, rangePercentage, tickSpacing);
      setCalculatedRange(range);
    } catch (error) {
      console.error('Error calculating range:', error);
      setCalculatedRange(null);
    }
  }, [currentPrice, rangePercentage, selectedFee]);

  // 获取最终的 tick 范围
  const getFinalTickRange = (): { tickLower: number; tickUpper: number } | null => {
    if (useCustomTicks) {
      if (!customTickLower || !customTickUpper) return null;
      return {
        tickLower: parseInt(customTickLower),
        tickUpper: parseInt(customTickUpper),
      };
    }
    
    if (!calculatedRange) return null;
    return {
      tickLower: calculatedRange.tickLower,
      tickUpper: calculatedRange.tickUpper,
    };
  };

  // 验证输入
  const validateInputs = (): { valid: boolean; error?: string } => {
    if (!currentPrice || parseFloat(currentPrice) <= 0) {
      return { valid: false, error: 'Please enter a valid current price' };
    }

    const tickRange = getFinalTickRange();
    if (!tickRange) {
      return { valid: false, error: 'Invalid tick range' };
    }

    const tickSpacing = getTickSpacing(selectedFee);
    const validation = validateTickRange(
      tickRange.tickLower,
      tickRange.tickUpper,
      tickSpacing
    );

    return validation;
  };

  // 创建池子
  const createPool = async () => {
    if (!isConnected) {
      message.warning('Please connect wallet first');
      return;
    }

    if (!poolManager) {
      message.error('Pool manager not found');
      return;
    }

    const validation = validateInputs();
    if (!validation.valid) {
      message.error(validation.error || 'Invalid inputs');
      return;
    }

    try {
      setLoading(true);

      const price = parseFloat(currentPrice);
      const sqrtPriceX96 = priceToSqrtPriceX96(price);
      const tickRange = getFinalTickRange()!;
      const selectedFeeTier = FEE_TIERS.find(fee => fee.value === selectedFee);

      // 确保 token0 < token1 (按地址排序)
      const [sortedToken0, sortedToken1] = 
        token0.address.toLowerCase() < token1.address.toLowerCase()
          ? [token0, token1]
          : [token1, token0];

      const tx = await poolManager.createAndInitializePoolIfNecessary({
        token0: sortedToken0.address,
        token1: sortedToken1.address,
        fee: selectedFee,
        tickLower: tickRange.tickLower,
        tickUpper: tickRange.tickUpper,
        sqrtPriceX96: sqrtPriceX96,
      });

      await tx.wait();
      
      message.success(
        `Pool created successfully! Price range: ${formatPrice(calculatedRange?.minPrice || 0)} - ${formatPrice(calculatedRange?.maxPrice || 0)}`
      );
      
      // Reset form
      setCurrentPrice('1');
      setRangePercentage(10);
      setCustomTickLower('');
      setCustomTickUpper('');
      setUseCustomTicks(false);
      
      // Notify parent
      if (onPoolCreated) {
        onPoolCreated();
      }
    } catch (error: any) {
      console.error('Error creating pool:', error);
      
      let errorMessage = error.message || 'Unknown error';
      if (error.message?.includes('Pool already exists')) {
        errorMessage = 'A pool with these parameters already exists';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected';
      }
      
      message.error(`Failed to create pool: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      style={{ borderRadius: 16 }}
      className="create-pool-card"
    >
      <Title level={3} style={{ marginBottom: 24 }}>
        <Space>
          <ThunderboltOutlined />
          Create New Pool
        </Space>
      </Title>

      <Alert
        message="Create a new liquidity pool"
        description="Specify the token pair, fee tier, current price, and price range. Once created, pools cannot be modified or deleted."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Token Selection */}
      <Form layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Token 0">
              <Select
                value={token0.address}
                onChange={(val) => setToken0(TOKEN_LIST.find(t => t.address === val) || TOKEN_LIST[0])}
                disabled={loading}
                size="large"
              >
                {TOKEN_LIST.map((token) => (
                  <Select.Option key={token.address} value={token.address}>
                    {token.symbol}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Token 1">
              <Select
                value={token1.address}
                onChange={(val) => setToken1(TOKEN_LIST.find(t => t.address === val) || TOKEN_LIST[1])}
                disabled={loading}
                size="large"
              >
                {TOKEN_LIST.map((token) => (
                  <Select.Option key={token.address} value={token.address}>
                    {token.symbol}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Fee Tier */}
        <Form.Item 
          label={
            <Space>
              Fee Tier
              <Tooltip title="Different fee tiers are suitable for different pair volatilities">
                <InfoCircleOutlined style={{ color: '#999' }} />
              </Tooltip>
            </Space>
          }
        >
          <Segmented
            options={FEE_TIERS.map(fee => ({
              label: (
                <Tooltip title={fee.description}>
                  <div>{fee.label}</div>
                </Tooltip>
              ),
              value: fee.value,
            }))}
            value={selectedFee}
            onChange={(val) => setSelectedFee(val as number)}
            block
            disabled={loading}
          />
        </Form.Item>

        <Divider />

        {/* Current Price */}
        <Form.Item 
          label={
            <Space>
              Current Price ({token1.symbol} per {token0.symbol})
              <Tooltip title="The initial price at which the pool will be created">
                <InfoCircleOutlined style={{ color: '#999' }} />
              </Tooltip>
            </Space>
          }
        >
          <InputNumber
            style={{ width: '100%' }}
            value={currentPrice ? parseFloat(currentPrice) : undefined}
            onChange={(val) => setCurrentPrice(val?.toString() || '')}
            disabled={loading}
            placeholder="1.0"
            min={0.000001}
            step={0.1}
            size="large"
            stringMode
          />
        </Form.Item>

        <Divider />

        {/* Price Range Mode */}
        <Form.Item label="Price Range Mode">
          <Segmented
            options={[
              { label: 'Preset Range', value: false },
              { label: 'Custom Ticks', value: true },
            ]}
            value={useCustomTicks}
            onChange={(val) => setUseCustomTicks(val as boolean)}
            block
            disabled={loading}
          />
        </Form.Item>

        {!useCustomTicks ? (
          <>
            {/* Preset Range */}
            <Form.Item 
              label={
                <Space>
                  Price Range (±%)
                  <Tooltip title="Select how wide the price range should be around the current price">
                    <InfoCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                </Space>
              }
            >
              <Row gutter={16} align="middle">
                <Col flex="auto">
                  <Slider
                    min={1}
                    max={100}
                    value={rangePercentage}
                    onChange={setRangePercentage}
                    disabled={loading}
                    marks={{
                      5: '5%',
                      10: '10%',
                      25: '25%',
                      50: '50%',
                      100: '100%',
                    }}
                  />
                </Col>
                <Col>
                  <InputNumber
                    value={rangePercentage}
                    onChange={(val) => setRangePercentage(val || 10)}
                    disabled={loading}
                    min={1}
                    max={100}
                    formatter={value => `±${value}%`}
                    parser={value => value?.replace(/[^\d]/g, '') as any}
                  />
                </Col>
              </Row>
            </Form.Item>

            {/* Quick Select Presets */}
            <Form.Item label="Quick Select">
              <Space wrap>
                {PRESET_RANGES.map((preset) => (
                  <Button
                    key={preset.value}
                    size="small"
                    onClick={() => setRangePercentage(preset.value)}
                    type={rangePercentage === preset.value ? 'primary' : 'default'}
                    disabled={loading}
                  >
                    {preset.label}
                  </Button>
                ))}
              </Space>
            </Form.Item>
          </>
        ) : (
          <>
            {/* Custom Ticks */}
            <Alert
              message="Advanced Mode"
              description={`Tick spacing for ${FEE_TIERS.find(f => f.value === selectedFee)?.label} fee: ${getTickSpacing(selectedFee)}`}
              type="warning"
              icon={<WarningOutlined />}
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Tick Lower">
                  <InputNumber
                    style={{ width: '100%' }}
                    value={customTickLower ? parseInt(customTickLower) : undefined}
                    onChange={(val) => setCustomTickLower(val?.toString() || '')}
                    disabled={loading}
                    placeholder="-60"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Tick Upper">
                  <InputNumber
                    style={{ width: '100%' }}
                    value={customTickUpper ? parseInt(customTickUpper) : undefined}
                    onChange={(val) => setCustomTickUpper(val?.toString() || '')}
                    disabled={loading}
                    placeholder="60"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {/* Price Range Display */}
        {calculatedRange && !useCustomTicks && (
          <Card 
            size="small" 
            style={{ 
              marginBottom: 24,
              background: 'rgba(124, 58, 237, 0.05)',
              borderColor: '#7c3aed'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row justify="space-between">
                <Text type="secondary">Min Price:</Text>
                <Text strong>{formatPrice(calculatedRange.minPrice)}</Text>
              </Row>
              <Row justify="space-between">
                <Text type="secondary">Max Price:</Text>
                <Text strong>{formatPrice(calculatedRange.maxPrice)}</Text>
              </Row>
              <Divider style={{ margin: '8px 0' }} />
              <Row justify="space-between">
                <Text type="secondary">Tick Lower:</Text>
                <Text code>{calculatedRange.tickLower}</Text>
              </Row>
              <Row justify="space-between">
                <Text type="secondary">Tick Upper:</Text>
                <Text code>{calculatedRange.tickUpper}</Text>
              </Row>
            </Space>
          </Card>
        )}

        {useCustomTicks && customTickLower && customTickUpper && (
          <Card 
            size="small" 
            style={{ 
              marginBottom: 24,
              background: 'rgba(124, 58, 237, 0.05)',
              borderColor: '#7c3aed'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row justify="space-between">
                <Text type="secondary">Min Price:</Text>
                <Text strong>{formatPrice(tickToPrice(parseInt(customTickLower)))}</Text>
              </Row>
              <Row justify="space-between">
                <Text type="secondary">Max Price:</Text>
                <Text strong>{formatPrice(tickToPrice(parseInt(customTickUpper)))}</Text>
              </Row>
            </Space>
          </Card>
        )}

        {/* Action Buttons */}
        {!isConnected ? (
          <Button type="primary" size="large" block disabled>
            Connect Wallet
          </Button>
        ) : !isSignerReady ? (
          <Button type="primary" size="large" block disabled loading>
            Initializing Wallet...
          </Button>
        ) : (
          <Button 
            type="primary"
            size="large" 
            onClick={createPool}
            disabled={loading || !currentPrice || parseFloat(currentPrice) <= 0}
            block
            loading={loading}
            icon={<PlusOutlined />}
          >
            {loading ? 'Creating Pool...' : 'Create Pool'}
          </Button>
        )}
      </Form>
    </Card>
  );
}

