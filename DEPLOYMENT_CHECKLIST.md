# ✅ Cloudflare Pages 部署检查清单

## 已完成的配置 ✓

### 1. 文件配置
- [x] `package.json` - 添加了部署脚本
- [x] `next.config.ts` - 添加了 Cloudflare 图片优化配置
- [x] `.node-version` - 指定 Node.js 版本
- [x] `wrangler.toml` - Cloudflare 配置文件
- [x] `.gitignore` - 添加了 Cloudflare 相关忽略项

### 2. 文档
- [x] `CLOUDFLARE_DEPLOY.md` - 完整部署指南
- [x] `QUICKSTART_CLOUDFLARE.md` - 快速开始指南

---

## 部署前需要做的事情

### 步骤 1: 安装必要的依赖包 ⏳

```bash
cd /Users/zhangbin/Desktop/project/learn-web3/dex-next
pnpm add -D @cloudflare/next-on-pages wrangler
```

### 步骤 2: 选择部署方式

#### 选项 A: GitHub 自动部署（推荐新手）
```bash
# 1. 提交代码
git add .
git commit -m "Add Cloudflare Pages configuration"
git push origin main

# 2. 访问 Cloudflare Dashboard 连接 Git
# https://dash.cloudflare.com/
```

#### 选项 B: CLI 手动部署（推荐开发者）
```bash
# 1. 登录
npx wrangler login

# 2. 构建
pnpm run pages:build

# 3. 部署
npx wrangler pages deploy .vercel/output/static --project-name=dex-next
```

---

## 需要配置的环境变量

在 Cloudflare Dashboard 或本地 `.env.local` 中配置：

```env
# 必需（如果使用 WalletConnect）
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# 可选
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_CHAIN_ID=1
NODE_VERSION=18.17.0
```

---

## 构建设置（Cloudflare Dashboard）

当通过 Git 部署时，使用以下设置：

| 设置项 | 值 |
|--------|-----|
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npx @cloudflare/next-on-pages` |
| Build output directory | `.vercel/output/static` |
| Node.js version | 18.17.0 |

---

## 测试清单

### 本地测试
```bash
# 开发模式测试
pnpm dev

# Cloudflare 预览模式测试
pnpm run preview
```

### 部署后测试
- [ ] 页面正常加载
- [ ] 钱包连接正常
- [ ] 样式显示正确
- [ ] 所有路由可访问
- [ ] API 调用正常
- [ ] 控制台无错误

---

## 可能需要调整的地方

### 1. 如果使用了 Node.js API
某些 Node.js API 在 Edge Runtime 不可用，需要替换：
- `fs` → 使用 fetch 或其他方式
- `path` → 使用字符串操作
- `crypto` → 使用 Web Crypto API

### 2. 如果有大文件
Cloudflare Pages 限制：
- 单个文件 < 25MB
- 总部署大小 < 20,000 文件

### 3. 如果需要服务端运行时
某些 Next.js 功能需要 Node.js 运行时，可能需要调整为静态生成或客户端渲染。

---

## 快速命令参考

```bash
# 安装依赖
pnpm add -D @cloudflare/next-on-pages wrangler

# 本地开发
pnpm dev

# 构建
pnpm run pages:build

# 本地预览（模拟 Cloudflare 环境）
pnpm run preview

# 部署
pnpm run deploy

# 查看部署日志
npx wrangler pages deployment tail
```

---

## 下一步

1. ✅ **现在就部署**: 按照上面的步骤开始部署
2. 📚 **详细文档**: 查看 `CLOUDFLARE_DEPLOY.md` 了解更多
3. 🚀 **快速开始**: 查看 `QUICKSTART_CLOUDFLARE.md` 获得简化步骤
4. 🌐 **自定义域名**: 部署成功后，可以绑定自己的域名

---

**准备好了吗？开始部署吧！** 🎉

如有问题，请查阅文档或访问：
- [Cloudflare Community](https://community.cloudflare.com/)
- [Next.js Discord](https://discord.gg/nextjs)

