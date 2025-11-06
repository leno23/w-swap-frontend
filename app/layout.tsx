import '@ant-design/v5-patch-for-react-19';
import type { Metadata } from 'next';
import Providers from './providers';
import '@rainbow-me/rainbowkit/styles.css';
import 'antd/dist/reset.css';
import '../styles/variables.css';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'MetaNodeSwap - Decentralized Exchange',
  description: 'A modern DEX on Sepolia Testnet',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
