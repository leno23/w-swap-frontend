'use client';

import '@ant-design/v5-patch-for-react-19';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { ConfigProvider, theme } from 'antd';
import { config } from '../config/wagmi';
import { ReactNode, useState } from 'react';
import Header from './Header';

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#7c3aed',
          colorBgContainer: '#1e293b',
          colorBgElevated: '#2a2640',
          colorBgLayout: '#0f172a',
          colorBorder: '#334155',
          colorBorderSecondary: '#475569',
          colorText: '#f1f5f9',
          colorTextSecondary: '#94a3b8',
          colorTextTertiary: '#64748b',
          borderRadius: 12,
          fontSize: 14,
        },
        components: {
          Card: {
            colorBgContainer: '#1e293b',
            colorBorderSecondary: '#334155',
          },
          Input: {
            colorBgContainer: '#0f172a',
            colorBorder: '#334155',
          },
          InputNumber: {
            colorBgContainer: '#0f172a',
            colorBorder: '#334155',
          },
          Select: {
            colorBgContainer: '#1e293b',
            colorBgElevated: '#2a2640',
            colorBorder: '#334155',
          },
          Segmented: {
            colorBgLayout: '#0f172a',
            trackBg: '#0f172a',
          },
          Button: {
            colorBorder: '#334155',
          },
        },
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider 
            theme={darkTheme({
              accentColor: '#7c3aed',
              accentColorForeground: 'white',
              borderRadius: 'medium',
              fontStack: 'system',
            })}
          >
            <div className="app">
              <Header />
              <main className="main-content">
                {children}
              </main>
              <footer className="footer">
                <p>MetaNodeSwap - Decentralized Exchange on Sepolia</p>
                <p className="network-info">Network: Sepolia Testnet</p>
              </footer>
            </div>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ConfigProvider>
  );
}

