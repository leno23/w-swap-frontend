'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>MetaNodeSwap</h1>
        </div>

        <nav className="nav">
          <Link 
            href="/" 
            className={pathname === '/' ? 'active' : ''}
          >
            Swap
          </Link>
          <Link 
            href="/liquidity" 
            className={pathname === '/liquidity' ? 'active' : ''}
          >
            Liquidity
          </Link>
          <Link 
            href="/positions" 
            className={pathname === '/positions' ? 'active' : ''}
          >
            Positions
          </Link>
        </nav>

        <div className="wallet-section">
          <ConnectButton 
            chainStatus="icon"
            showBalance={false}
          />
        </div>
      </div>
    </header>
  );
}

