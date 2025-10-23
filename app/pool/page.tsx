"use client"
import AddLiquidityCard from '@/components/AddLiquidityCard';
import PoolList from '@/components/PoolList';

export default function PoolPage() {
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Liquidity Pools</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add liquidity to earn fees or view existing pools
          </p>
        </div>

        {/* Add Liquidity Section */}
        <AddLiquidityCard />
        
        {/* Pool List Section */}
        <PoolList />
      </div>
    </div>
  );
}

