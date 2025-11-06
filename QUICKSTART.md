# 🚀 快速开始指南

## 前置要求

- Node.js 18+ 
- pnpm (推荐) 或 npm/yarn
- MetaMask 或其他Web3钱包
- Sepolia测试网ETH

## 安装步骤

### 1. 安装依赖

```bash
cd dex-next
pnpm install
```

### 2. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

### 3. 连接钱包

1. 点击右上角"Connect Wallet"按钮
2. 选择MetaMask或其他钱包
3. 切换到Sepolia测试网
4. 授权连接

## 📱 功能使用

### Swap (代币交易)

1. 访问首页 `/`
2. 选择交易对 (如 MNTokenA → MNTokenB)
3. 输入交易数量
4. 如果是首次交易该代币，需要先点击"Approve"授权
5. 点击"Swap"执行交易

### Liquidity (添加流动性)

1. 访问 `/liquidity`
2. 选择代币对
3. 选择费率 (0.05%, 0.30%, 1.00%)
4. 输入两种代币的数量
5. 点击"Approve"授权两种代币
6. 点击"Add Liquidity"添加流动性

### Positions (管理持仓)

1. 访问 `/positions`
2. 查看所有流动性持仓
3. 可以收取手续费或移除流动性

## 🔧 配置说明

### 合约地址

编辑 `config/contracts.ts`：

```typescript
export const CONTRACTS = {
  SEPOLIA_CHAIN_ID: 11155111,
  tokens: {
    MNTokenA: '0x...',
    MNTokenB: '0x...',
    // ... 更多代币
  },
  PoolManager: '0x...',
  PositionManager: '0x...',
  SwapRouter: '0x...',
};
```

### 网络配置

编辑 `config/wagmi.ts`：

```typescript
export const config = getDefaultConfig({
  appName: 'MetaNodeSwap',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [sepolia],  // 可以添加更多网络
  ssr: true,
});
```

## 🛠️ 开发命令

```bash
# 开发环境
pnpm dev

# 类型检查
pnpm lint

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

## 🐛 常见问题

### Q: 无法连接钱包
A: 确保已安装MetaMask，并且浏览器允许弹出窗口

### Q: 交易失败
A: 
1. 检查是否已授权代币
2. 确认账户有足够的ETH支付gas费
3. 检查池子是否有足够的流动性

### Q: 页面加载缓慢
A: 首次加载会初始化Web3连接，请稍等片刻

### Q: 找不到池子
A: 可能该代币对还没有创建池子，请先在Liquidity页面创建

## 📚 学习资源

- [Next.js文档](https://nextjs.org/docs)
- [Wagmi文档](https://wagmi.sh/)
- [RainbowKit文档](https://www.rainbowkit.com/)
- [Ethers.js文档](https://docs.ethers.org/v6/)
- [Ant Design组件](https://ant.design/components/overview/)

## 🚀 部署

### Vercel (推荐)

1. 推送代码到GitHub
2. 在Vercel导入项目
3. 自动部署

### 其他平台

```bash
# 构建
pnpm build

# 启动
pnpm start
```

## 📝 注意事项

1. **安全性**: 
   - 不要在生产环境暴露私钥
   - 使用环境变量管理敏感信息

2. **Gas费用**:
   - 在Sepolia测试网使用免费测试币
   - 正式网络注意gas价格

3. **滑点设置**:
   - 当前默认5%滑点
   - 可在代码中调整

## 💡 开发技巧

### 调试Web3连接

打开浏览器控制台，查看详细日志：
```
🔄 Token changed, refreshing balances...
💰 Current allowance: xxx
✅ Signer obtained successfully
```

### 热更新

修改代码后，页面会自动刷新。如果钱包状态丢失，重新连接即可。

### 样式调整

编辑 `styles/globals.css` 和 `styles/variables.css`

## 📞 获取帮助

- 查看README.md了解项目架构
- 查看MIGRATION.md了解迁移详情
- 检查控制台日志排查问题

---

祝开发愉快！🎉

