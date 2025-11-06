'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// 动态导入Providers组件，禁用SSR
const ProvidersComponent = dynamic(
  () => import('../components/Providers'),
  { ssr: false }
);

export default function Providers({ children }: { children: ReactNode }) {
  return <ProvidersComponent>{children}</ProvidersComponent>;
}

