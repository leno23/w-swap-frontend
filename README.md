# MetaNodeSwap - Next.js Version

这是MetaNodeSwap DEX项目的Next.js版本，从原始的Vite + React项目迁移而来。

## 🚀 技术栈

- **框架**: Next.js 16 (App Router)
- **React**: 19.2
- **Web3**: 
  - Wagmi 2.19
  - RainbowKit 2.2
  - Ethers.js 6.15
  - Viem 2.38
- **UI**: Ant Design 5.27
- **查询**: TanStack Query 5.90

## 📁 项目结构

```
dex-next/
├── app/                    # Next.js App Router页面
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页 (Swap)
│   ├── liquidity/         # 流动性页面
│   └── positions/         # 持仓页面
├── components/            # React组件
│   ├── Header.tsx         # 导航栏
│   ├── Swap.tsx          # Swap组件
│   ├── Liquidity.tsx     # 流动性组件
│   ├── Positions.tsx     # 持仓组件
│   ├── PoolList.tsx      # 池子列表
│   └── Providers.tsx     # Provider包装器
├── config/               # 配置文件
│   ├── abis.ts          # 合约ABI
│   ├── contracts.ts     # 合约地址
│   └── wagmi.ts         # Wagmi配置
├── hooks/               # 自定义Hooks
│   ├── useContract.ts   # 合约相关Hooks
│   ├── useTokenBalance.ts
│   └── useEthBalance.ts
└── styles/              # 样式文件
    ├── globals.css      # 全局样式
    └── variables.css    # CSS变量

```

## 🔧 主要改动

### 1. 路由系统
- ✅ 从 `react-router-dom` 迁移到 Next.js App Router
- ✅ 使用 `useRouter` 和 `usePathname` 替代 `useNavigate` 和 `useLocation`
- ✅ 使用 `useSearchParams` 传递页面参数

### 2. 组件改造
- ✅ 所有客户端组件添加 `'use client'` 指令
- ✅ 使用 Next.js `Link` 组件替代 `react-router-dom` 的 `Link`
- ✅ 使用 URL 参数替代 React Router 的 state 传递

### 3. SSR适配
- ✅ Wagmi配置启用 `ssr: true`
- ✅ 使用 `Suspense` 包装需要 `useSearchParams` 的组件
- ✅ 配置 Webpack 排除不兼容的包

## 🛠️ 开发指南

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
pnpm build
pnpm start
```

## 🌐 网络配置

- **网络**: Sepolia Testnet
- **Chain ID**: 11155111
- **合约地址**: 见 `config/contracts.ts`

## 📝 功能特性

### ✅ Swap (交易)
- 代币兑换
- 实时报价
- 智能授权检查（避免重复授权）
- 多费率池选择 (0.05%, 0.30%, 1.00%)

### ✅ Liquidity (流动性)
- 添加流动性
- 创建新池子
- 多费率支持
- 池子列表查看

### ✅ Positions (持仓)
- 查看所有持仓
- 收取手续费
- 移除流动性

## 🔍 关键差异

### URL参数传递示例

**原来 (React Router)**:
```tsx
navigate('/liquidity', {
  state: { token0, token1, feeIndex }
});
```

**现在 (Next.js)**:
```tsx
const params = new URLSearchParams({
  token0: pool.token0,
  token1: pool.token1,
  feeIndex: pool.index.toString(),
});
router.push(`/liquidity?${params.toString()}`);
```

### 组件使用参数

**原来**:
```tsx
const location = useLocation();
const state = location.state;
```

**现在**:
```tsx
const searchParams = useSearchParams();
const token0 = searchParams.get('token0');
```

## 🐛 已知问题

- Next.js 19的React版本可能导致某些依赖出现peer dependency警告，但不影响使用
- 需要使用 `Suspense` 包装使用 `useSearchParams` 的页面

## 📦 依赖说明

项目使用pnpm作为包管理器。关键依赖:
- `@rainbow-me/rainbowkit`: 钱包连接UI
- `wagmi`: React Hooks for Ethereum
- `ethers`: 以太坊库
- `antd`: UI组件库

## 🚀 部署

### Cloudflare Pages（推荐）

本项目已配置好 Cloudflare Pages 部署支持。

#### 快速开始
```bash
# 安装依赖
pnpm add -D @cloudflare/next-on-pages wrangler

# 一键部署
npx wrangler login
pnpm run deploy
```

#### ⚠️ 重要：修复 Node.JS Compatibility Error

如果部署后遇到 `Node.JS Compatibility Error`，请查看：
- 📖 [快速修复指南](./FIX_NODEJS_COMPAT_ERROR.md) - 3 分钟解决
- 🔧 [完整故障排除](./TROUBLESHOOTING.md) - 所有常见问题

#### 📚 完整部署文档
- [快速开始](./QUICKSTART_CLOUDFLARE.md) - 最简单的部署方法
- [完整指南](./CLOUDFLARE_DEPLOY.md) - 详细配置说明
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md) - 确保不遗漏任何步骤

### 其他平台

也可以部署到：
- Vercel
- Netlify
- 自托管服务器

```bash
pnpm build
pnpm start
```

## 📄 License

MIT

---

**迁移完成时间**: 2025年10月
**迁移版本**: Next.js 16 + React 19
