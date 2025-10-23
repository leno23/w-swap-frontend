'use client';

import { useAccount } from 'wagmi';
import dynamic from 'next/dynamic';
import { Wallet, Droplet } from 'lucide-react';
import { usePositions } from '@/hooks/usePositions';
import PositionCard from '@/components/PositionCard';

const ConnectButton = dynamic(
  () => import('@rainbow-me/rainbowkit').then((mod) => mod.ConnectButton),
  { ssr: false }
);

export default function PositionsPage() {
  const { address } = useAccount();
  const { positions, loading } = usePositions();

  if (!address) {
    return (
      <div className="py-12">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect your wallet to view your liquidity positions
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Positions</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your liquidity positions and collect fees
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 animate-shimmer"
                style={{ height: '280px' }}
              />
            ))}
          </div>
        ) : positions.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Droplet className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">No positions yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add liquidity to a pool to create your first position
            </p>
            <a
              href="/pool"
              className="inline-block px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-lg transition-all"
            >
              Add Liquidity
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {positions.map((position) => (
              <PositionCard key={position.id.toString()} position={position} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

