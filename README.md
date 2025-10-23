# MetaNodeSwap Frontend

A decentralized exchange (DEX) frontend built with Next.js, inspired by Uniswap V3.

## Features

- 🔄 Token Swapping
- 💧 Liquidity Pool Management
- 📊 Position Management (NFT-based)
- 🏊 Pool Creation
- 💼 Wallet Integration (Rainbow Kit)

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: ethers.js, wagmi, RainbowKit
- **Network**: Sepolia Testnet

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- MetaMask or other Web3 wallet
- Sepolia testnet ETH

### Installation

```bash
# Install dependencies
npm install
# or
pnpm install

# Run development server
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Contract Addresses (Sepolia)

### Test Tokens
- MNTokenA: `0x4798388e3adE569570Df626040F07DF71135C48E`
- MNTokenB: `0x5A4eA3a013D42Cfd1B1609d19f6eA998EeE06D30`
- MNTokenC: `0x86B5df6FF459854ca91318274E47F4eEE245CF28`
- MNTokenD: `0x7af86B1034AC4C925Ef5C3F637D1092310d83F03`

### Core Contracts
- PoolManager: `0xddC12b3F9F7C91C79DA7433D8d212FB78d609f7B`
- PositionManager: `0xbe766Bf20eFfe431829C5d5a2744865974A0B610`
- SwapRouter: `0xD2c220143F5784b3bD84ae12747d97C8A36CeCB2`

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── swap/              # Swap page
│   ├── pool/              # Pool management
│   ├── positions/         # Position management
│   └── layout.tsx         # Root layout
├── components/            # React components
├── contracts/             # Contract ABIs and addresses
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
└── types/                 # TypeScript types
```

## Usage

### Swap Tokens
1. Connect your wallet
2. Select tokens to swap
3. Enter amount
4. Review and confirm transaction

### Add Liquidity
1. Go to Pool page
2. Select token pair
3. Enter amounts for both tokens
4. Set price range
5. Confirm and add liquidity

### Manage Positions
1. View your liquidity positions
2. Collect fees
3. Remove liquidity

## License

GPL-2.0-or-later


