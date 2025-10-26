#!/bin/bash

# Script to deploy contracts and update frontend addresses
# Usage: ./scripts/deploy-and-update.sh

set -e  # Exit on error

echo "=================================================="
echo "🚀 Deploying MetaNodeSwap Contracts to Sepolia"
echo "=================================================="

# Navigate to contract directory
cd "$(dirname "$0")/.."

# Compile contracts
echo ""
echo "📦 Compiling contracts..."
npx hardhat compile

# Deploy contracts
echo ""
echo "🌐 Deploying to Sepolia testnet..."
echo "⚠️  Make sure you have:"
echo "   1. Set SEPOLIA_RPC_URL in .env"
echo "   2. Set PRIVATE_KEY in .env"
echo "   3. Have enough Sepolia ETH for gas"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

npx hardhat ignition deploy ignition/modules/MetaNodeSwap.ts --network sepolia > deployment-output.txt 2>&1

# Extract deployment addresses (you'll need to parse the output)
echo ""
echo "✅ Deployment complete!"
echo ""
echo "=================================================="
echo "📝 Next Steps:"
echo "=================================================="
echo ""
echo "1. Check deployment-output.txt for contract addresses"
echo ""
echo "2. Update ../contracts/addresses.ts with new addresses:"
echo "   - PoolManager address"
echo "   - PositionManager address"  
echo "   - SwapRouter address"
echo ""
echo "3. Copy ABIs to frontend (if needed):"
echo "   cp artifacts/contracts/MetaNodeSwap/PoolManager.sol/PoolManager.json ../contracts/abis/"
echo "   cp artifacts/contracts/MetaNodeSwap/PositionManager.sol/PositionManager.json ../contracts/abis/"
echo "   cp artifacts/contracts/MetaNodeSwap/SwapRouter.sol/SwapRouter.json ../contracts/abis/"
echo "   cp artifacts/contracts/MetaNodeSwap/Pool.sol/Pool.json ../lib/"
echo ""
echo "4. Test the deployment:"
echo "   npx tsx ../scripts/debugMint.ts"
echo ""
echo "=================================================="

cat deployment-output.txt

