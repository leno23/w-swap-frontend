'use client';

import { useState, useEffect } from 'react';
import { formatUnits, Contract } from 'ethers';
import { usePoolManager, useEthersSigner } from '../hooks/useContract';
import { TOKEN_LIST } from '../config/contracts';
import { ERC20_ABI } from '../config/abis';
import { Card, Button, Table, Typography, Row, Col, Tag, Empty, Statistic, Space, Divider, Progress, Tooltip, Modal } from 'antd';
import { ReloadOutlined, InfoCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getPriceRangeFromTicks, formatPrice as formatPriceUtil } from '../utils/priceUtils';
import CreatePool from './CreatePool';

const { Text, Title } = Typography;

// 费率选项映射
const FEE_TIER_MAP: Record<number, string> = {
  0: '0.05%',
  1: '0.30%',
  2: '1.00%',
};

// 原始池子数据（从合约获取，包含 BigInt）
interface PoolRaw {
  pool: string;
  token0: string;
  token1: string;
  index: number | bigint;
  fee: number | bigint;
  feeProtocol: number | bigint;
  tickLower: number | bigint;
  tickUpper: number | bigint;
  tick: number | bigint;
  sqrtPriceX96: bigint;
  liquidity: bigint;
}

// 序列化安全的池子数据（用于 React 状态）
interface Pool {
  pool: string;
  token0: string;
  token1: string;
  index: number;
  fee: number;
  feeProtocol: number;
  tickLower: number;
  tickUpper: number;
  tick: number;
  sqrtPriceX96: string; // BigInt 转为字符串
  liquidity: string; // BigInt 转为字符串
  token0BalanceStr?: string;
  token1BalanceStr?: string;
  balanceFetchError?: boolean; // 标记余额获取是否失败
}

interface PoolListProps {
  refreshKey?: number; // 用于触发外部刷新
}

export default function PoolList({ refreshKey }: PoolListProps) {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreatePoolModal, setShowCreatePoolModal] = useState(false);
  
  const poolManager = usePoolManager();
  const signer = useEthersSigner();
  
  // 将包含 BigInt 的池子数据转换为序列化安全的格式
  const serializePool = (pool: PoolRaw): Pool => {
    return {
      pool: pool.pool,
      token0: pool.token0,
      token1: pool.token1,
      index: Number(pool.index),
      fee: Number(pool.fee),
      feeProtocol: Number(pool.feeProtocol),
      tickLower: Number(pool.tickLower),
      tickUpper: Number(pool.tickUpper),
      tick: Number(pool.tick),
      sqrtPriceX96: pool.sqrtPriceX96.toString(),
      liquidity: pool.liquidity.toString(),
    };
  };

  // 根据地址查找代币符号
  const getTokenSymbol = (address: string): string => {
    const token = TOKEN_LIST.find(t => t.address.toLowerCase() === address?.toLowerCase());
    return token?.symbol || `${address?.slice(0, 6)}...${address?.slice(-4)}`;
  };

  // 验证池子数据是否有效
  const isValidPool = (pool: PoolRaw): boolean => {
    try {
      return !!(
        pool &&
        pool.pool &&
        pool.token0 &&
        pool.token1 &&
        typeof pool.index !== 'undefined' &&
        typeof pool.fee !== 'undefined'
      );
    } catch {
      return false;
    }
  };

  // 获取池子的token余额
  const fetchPoolBalances = async (pool: Pool): Promise<Pool> => {
    if (!signer) {
      return pool;
    }

    // 验证池子地址是否有效
    if (!pool.pool || pool.pool === '0x0000000000000000000000000000000000000000') {
      console.warn('Invalid pool address:', pool.pool);
      return { ...pool, balanceFetchError: true };
    }

    try {
      const token0Contract = new Contract(pool.token0, ERC20_ABI, signer);
      const token1Contract = new Contract(pool.token1, ERC20_ABI, signer);

      const [balance0, balance1] = await Promise.all([
        token0Contract.balanceOf(pool.pool),
        token1Contract.balanceOf(pool.pool),
      ]);

      return {
        ...pool,
        // 只存储字符串版本，避免BigInt序列化问题
        token0BalanceStr: balance0.toString(),
        token1BalanceStr: balance1.toString(),
        balanceFetchError: false,
      };
    } catch (error) {
      console.error('Error fetching pool balances for pool:', pool.pool, error);
      // 即使获取余额失败，也返回池子基本信息，但标记为获取失败
      return { ...pool, balanceFetchError: true };
    }
  };

  // 获取所有流动池
  const fetchPools = async () => {
    if (!poolManager) {
      return;
    }

    setLoading(true);
    try {
      const allPools = await poolManager.getAllPools();
      
      // 过滤有效的池子
      const validPools: PoolRaw[] = Array.isArray(allPools) 
        ? allPools.filter(isValidPool)
        : [];
      
      // 转换为序列化安全的格式
      const serializedPools = validPools.map(serializePool);
      
      // 获取每个池子的token余额
      if (serializedPools.length > 0 && signer) {
        const poolsWithBalances = await Promise.all(
          serializedPools.map(pool => fetchPoolBalances(pool))
        );
        setPools(poolsWithBalances);
      } else {
        setPools(serializedPools);
      }
    } catch (error) {
      console.error('❌ [PoolList] Error fetching pools:', error);
      setPools([]); // 出错时设置为空数组
    } finally {
      setLoading(false);
    }
  };

  // 初始加载时获取池子数据
  useEffect(() => {
    fetchPools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolManager, signer]);

  // 监听外部刷新请求
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      fetchPools();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // 计算价格（从 sqrtPriceX96 字符串）
  const calculatePrice = (sqrtPriceX96Str: string): string => {
    try {
      if (!sqrtPriceX96Str) return '0';
      const sqrtPriceX96 = BigInt(sqrtPriceX96Str);
      if (sqrtPriceX96 === 0n) return '0';
      
      // price = (sqrtPriceX96 / 2^96)^2
      const Q96 = 2n ** 96n;
      const price = (sqrtPriceX96 * sqrtPriceX96 * 10n ** 18n) / (Q96 * Q96);
      return formatUnits(price, 18);
    } catch (error) {
      console.error('Error calculating price:', error);
      return '0';
    }
  };

  // 安全地格式化流动性
  const formatLiquidity = (liquidityStr: string | undefined): string => {
    try {
      if (!liquidityStr) return '0';
      const liquidity = BigInt(liquidityStr);
      if (liquidity === 0n) return '0';
      return parseFloat(formatUnits(liquidity, 18)).toFixed(2);
    } catch (error) {
      console.error('Error formatting liquidity:', error);
      return '0';
    }
  };

  // 安全地格式化价格显示
  const formatPriceDisplay = (sqrtPriceX96Str: string | undefined): string => {
    try {
      const price = calculatePrice(sqrtPriceX96Str || '0');
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || !isFinite(numPrice)) return '0.000000';
      return numPrice.toFixed(6);
    } catch (error) {
      console.error('Error formatting price display:', error);
      return '0.000000';
    }
  };

  // 安全地获取费率显示
  const getFeeDisplay = (pool: Pool): string => {
    try {
      const indexNum = Number(pool.index);
      if (pool.index !== undefined && FEE_TIER_MAP[indexNum]) {
        return FEE_TIER_MAP[indexNum];
      }
      if (pool.fee !== undefined && Number(pool.fee) > 0) {
        return `${(Number(pool.fee) / 10000).toFixed(2)}%`;
      }
      return 'N/A';
    } catch (error) {
      console.error('Error getting fee display:', error);
      return 'N/A';
    }
  };

  // 定义表格列
  const columns: ColumnsType<Pool> = [
    {
      title: '#',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_value, _record, index: number) => index + 1,
    },
    {
      title: 'Token Pair & Reserves',
      key: 'pairAndReserves',
      width: 180,
      render: (_value, pool: Pool) => (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          {/* Token Reserves */}
          {pool.balanceFetchError ? (
            <Tooltip title="无法获取此池子的代币余额">
              <Tag color="warning" style={{ fontSize: 11 }}>余额获取失败</Tag>
            </Tooltip>
          ) : (pool.token0BalanceStr || pool.token1BalanceStr) ? (
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              <Row justify="space-between" align="middle">
                <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{getTokenSymbol(pool.token0)}</Tag>
                <Text style={{ fontSize: 12 }}>
                  {pool.token0BalanceStr ? parseFloat(formatUnits(BigInt(pool.token0BalanceStr), 18)).toFixed(2) : '0'}
                </Text>
              </Row>
              <Row justify="space-between" align="middle">
                <Tag color="cyan" style={{ fontSize: 10, margin: 0 }}>{getTokenSymbol(pool.token1)}</Tag>
                <Text style={{ fontSize: 12 }}>
                  {pool.token1BalanceStr ? parseFloat(formatUnits(BigInt(pool.token1BalanceStr), 18)).toFixed(2) : '0'}
                </Text>
              </Row>
            </Space>
          ) : (
            <Text type="secondary" style={{ fontSize: 11 }}>暂无余额数据</Text>
          )}
           {/* Pool Address */}
           <Text type="secondary" style={{ fontSize: 11 }} copyable={{ text: pool.pool }}>
            {pool.pool.slice(0, 6)}...{pool.pool.slice(-4)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Fee Tier',
      key: 'fee',
      width: 100,
      align: 'center',
      render: (_value, pool: Pool) => (
        <Tag color="purple">{getFeeDisplay(pool)}</Tag>
      ),
    },
    {
      title: 'Liquidity',
      key: 'liquidity',
      width: 100,
      align: 'right',
      sorter: (a: Pool, b: Pool) => {
        const aLiq = parseFloat(formatLiquidity(a.liquidity));
        const bLiq = parseFloat(formatLiquidity(b.liquidity));
        return aLiq - bLiq;
      },
      render: (_value, pool: Pool) => (
        <Text strong>{formatLiquidity(pool.liquidity)}</Text>
      ),
    },
    {
      title: 'Current Price',
      key: 'price',
      width: 140,
      align: 'right',
      render: (_value, pool: Pool) => (
        <Text>{formatPriceDisplay(pool.sqrtPriceX96)}</Text>
      ),
    },
    {
      title: 'Price Range',
      key: 'priceRange',
      width: 320,
      render: (_value, pool: Pool) => {
        const currentPrice = parseFloat(formatPriceDisplay(pool.sqrtPriceX96));
        const tickLower = Number(pool.tickLower ?? 0);
        const tickUpper = Number(pool.tickUpper ?? 0);
        const { minPrice, maxPrice } = getPriceRangeFromTicks(tickLower, tickUpper);
        const position = ((currentPrice - minPrice) / (maxPrice - minPrice)) * 100;
        const isInRange = currentPrice >= minPrice && currentPrice <= maxPrice;
        
        return (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Row justify="space-between" style={{ width: '100%' }}>
              <Text style={{ fontSize: 11 }}>
                <Tag color="blue" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>Min</Tag>
                {' '}{formatPriceUtil(minPrice)}
              </Text>
              <Text style={{ fontSize: 11 }}>
                <Tag color="green" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>Max</Tag>
                {' '}{formatPriceUtil(maxPrice)}
              </Text>
            </Row>
            <Tooltip title={`Current price is ${isInRange ? 'within' : 'outside'} the active range`}>
              <Progress 
                percent={Math.min(100, Math.max(0, position))}
                showInfo={false}
                strokeColor={isInRange ? '#52c41a' : '#ff4d4f'}
                size="small"
              />
            </Tooltip>
            <Row justify="space-between" style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 10 }}>
                Tick: {tickLower}
              </Text>
              <Text type="secondary" style={{ fontSize: 10 }}>
                Current: {Number(pool.tick ?? 0)}
              </Text>
              <Text type="secondary" style={{ fontSize: 10 }}>
                {tickUpper}
              </Text>
            </Row>
          </Space>
        );
      },
    },
  ];

  return (
    <Card 
      style={{ borderRadius: 16 }}
      className="pool-list-card"
    >
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <Space>
              <InfoCircleOutlined />
              Liquidity Pools
            </Space>
          </Title>
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => setShowCreatePoolModal(true)}
              size="small"
            >
              Create Pool
            </Button>
            <Button 
              onClick={fetchPools} 
              disabled={loading}
              icon={<ReloadOutlined spin={loading} />}
              size="small"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 统计摘要 */}
      {pools.length > 0 && !loading && (
        <Card 
          size="small" 
          style={{ 
            marginBottom: 16, 
            background: 'rgba(124, 58, 237, 0.05)',
            borderRadius: 8
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Row gutter={16} justify="center">
              <Col>
                <Statistic
                  title="Total Pools"
                  value={pools.length}
                  prefix={<InfoCircleOutlined />}
                  valueStyle={{ fontSize: 20, color: '#7c3aed' }}
                />
              </Col>
              <Col>
                <Statistic
                  title="Total Liquidity"
                  value={(() => {
                    try {
                      const total = pools.reduce((sum, pool) => {
                    try {
                      if (!pool || !pool.liquidity) return sum;
                      const liquidity = parseFloat(formatUnits(BigInt(pool.liquidity), 18));
                      return sum + (isNaN(liquidity) ? 0 : liquidity);
                    } catch (error) {
                      console.error('Error calculating pool liquidity:', error);
                      return sum;
                    }
                      }, 0);
                      return total.toFixed(2);
                    } catch (error) {
                      console.error('Error calculating total liquidity:', error);
                      return '0.00';
                    }
                  })()}
                  valueStyle={{ fontSize: 20, color: '#7c3aed' }}
                />
              </Col>
              <Col>
                <Statistic
                  title="Active Pairs"
                  value={(() => {
                    try {
                      const pairs = pools
                        .filter(p => p && p.token0 && p.token1)
                        .map(p => `${p.token0}-${p.token1}`);
                      return new Set(pairs).size;
                    } catch (error) {
                      console.error('Error calculating active pairs:', error);
                      return 0;
                    }
                  })()}
                  valueStyle={{ fontSize: 20, color: '#7c3aed' }}
                />
              </Col>
            </Row>
            
            {/* Token Reserves Summary */}
            {pools.some(p => (p.token0BalanceStr || p.token1BalanceStr) && !p.balanceFetchError) && (
              <>
                <Divider style={{ margin: 0 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Total Token Reserves</Text>
                </Divider>
                <Row gutter={16} justify="center">
                  {(() => {
                    // 统计所有token的总储备量（排除获取失败的池子）
                    const tokenTotals: Record<string, bigint> = {};
                    
                    pools.forEach(pool => {
                      if (!pool.balanceFetchError) {
                        if (pool.token0BalanceStr) {
                          const symbol = getTokenSymbol(pool.token0);
                          tokenTotals[symbol] = (tokenTotals[symbol] || 0n) + BigInt(pool.token0BalanceStr);
                        }
                        if (pool.token1BalanceStr) {
                          const symbol = getTokenSymbol(pool.token1);
                          tokenTotals[symbol] = (tokenTotals[symbol] || 0n) + BigInt(pool.token1BalanceStr);
                        }
                      }
                    });
                    
                    return Object.entries(tokenTotals).map(([symbol, total]) => (
                      <Col key={symbol}>
                        <Statistic
                          title={symbol}
                          value={parseFloat(formatUnits(total, 18)).toFixed(2)}
                          valueStyle={{ fontSize: 16, color: '#7c3aed' }}
                        />
                      </Col>
                    ));
                  })()}
                </Row>
              </>
            )}
          </Space>
        </Card>
      )}

      <Table<Pool>
        columns={columns}
        dataSource={pools}
        loading={loading}
        rowKey={(record) => record.pool}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} pools`,
          pageSizeOptions: ['5', '10', '20', '50'],
        }}
        scroll={{ x: 1100 }}
        sticky={{ offsetHeader: 70 }}
        locale={{
          emptyText: (
            <Empty 
              description="No liquidity pools found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Text type="secondary">
                Create your first pool using the Create Pool button above
              </Text>
            </Empty>
          ),
        }}
      />

      {/* Create Pool Modal */}
      <Modal
        title="Create Pool"
        open={showCreatePoolModal}
        onCancel={() => setShowCreatePoolModal(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <CreatePool 
          onPoolCreated={() => {
            fetchPools();
            setShowCreatePoolModal(false);
          }} 
        />
      </Modal>
    </Card>
  );
}

