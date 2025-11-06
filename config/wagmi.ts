import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'MetaNodeSwap',
  projectId: 'e01cebcfbc5e8353d1736bfc6293918b', // WalletConnect Cloud Project ID
  chains: [sepolia],
  ssr: true, // Next.js SSR enabled
});

