import { Suspense } from 'react';
import Liquidity from '../../components/Liquidity';

function LiquidityContent() {
  return <Liquidity />;
}

export default function LiquidityPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LiquidityContent />
    </Suspense>
  );
}

