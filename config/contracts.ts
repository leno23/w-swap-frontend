// 合约地址配置 - 从 MetaNodeSwap合约地址.md 读取
export const CONTRACTS = {
  // Sepolia 网络
  SEPOLIA_CHAIN_ID: 11155111,
  
  // 测试用 ERC20 代币
  tokens: {
    MNTokenA: '0x4798388e3adE569570Df626040F07DF71135C48E',
    MNTokenB: '0x5A4eA3a013D42Cfd1B1609d19f6eA998EeE06D30',
    MNTokenC: '0x86B5df6FF459854ca91318274E47F4eEE245CF28',
    MNTokenD: '0x7af86B1034AC4C925Ef5C3F637D1092310d83F03',
  },
  
  // Swap 合约
  PoolManager: '0xddC12b3F9F7C91C79DA7433D8d212FB78d609f7B',
  PositionManager: '0xbe766Bf20eFfe431829C5d5a2744865974A0B610',
  SwapRouter: '0xD2c220143F5784b3bD84ae12747d97C8A36CeCB2',
} as const;

// 代币列表
export const TOKEN_LIST = [
  {
    symbol: 'MNTokenA',
    name: 'MetaNode Token A',
    address: CONTRACTS.tokens.MNTokenA,
    decimals: 18,
  },
  {
    symbol: 'MNTokenB',
    name: 'MetaNode Token B',
    address: CONTRACTS.tokens.MNTokenB,
    decimals: 18,
  },
  {
    symbol: 'MNTokenC',
    name: 'MetaNode Token C',
    address: CONTRACTS.tokens.MNTokenC,
    decimals: 18,
  },
  {
    symbol: 'MNTokenD',
    name: 'MetaNode Token D',
    address: CONTRACTS.tokens.MNTokenD,
    decimals: 18,
  },
];

