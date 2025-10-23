export const CONTRACT_ADDRESSES = {
  // Sepolia Testnet
  sepolia: {
    poolManager: '0xddC12b3F9F7C91C79DA7433D8d212FB78d609f7B',
    positionManager: '0xbe766Bf20eFfe431829C5d5a2744865974A0B610',
    swapRouter: '0xD2c220143F5784b3bD84ae12747d97C8A36CeCB2',
  }
} as const;

export const TEST_TOKENS = {
  sepolia: {
    MNTokenA: {
      address: '0x4798388e3adE569570Df626040F07DF71135C48E',
      symbol: 'MNA',
      name: 'MetaNode Token A',
      decimals: 18,w
    },
    MNTokenB: {
      address: '0x5A4eA3a013D42Cfd1B1609d19f6eA998EeE06D30',
      symbol: 'MNB',
      name: 'MetaNode Token B',
      decimals: 18,
    },
    MNTokenC: {
      address: '0x86B5df6FF459854ca91318274E47F4eEE245CF28',
      symbol: 'MNC',
      name: 'MetaNode Token C',
      decimals: 18,
    },
    MNTokenD: {
      address: '0x7af86B1034AC4C925Ef5C3F637D1092310d83F03',
      symbol: 'MND',
      name: 'MetaNode Token D',
      decimals: 18,
    },
  }
} as const;

export const SUPPORTED_TOKENS = [
  TEST_TOKENS.sepolia.MNTokenA,
  TEST_TOKENS.sepolia.MNTokenB,
  TEST_TOKENS.sepolia.MNTokenC,
  TEST_TOKENS.sepolia.MNTokenD,
];


