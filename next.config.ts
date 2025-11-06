import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 添加空的turbopack配置以使用默认的Turbopack
  turbopack: {},
  
  // Cloudflare Pages 配置
  images: {
    unoptimized: true, // Cloudflare 使用自己的图片优化
  },
  
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
