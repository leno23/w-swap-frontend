# 🚀 Cloudflare Pages 快速部署指南

## 方法一：通过 GitHub 自动部署（最简单）

### 步骤 1: 安装依赖包
```bash
cd /Users/zhangbin/Desktop/project/learn-web3/dex-next
pnpm add -D @cloudflare/next-on-pages wrangler
```

### 步骤 2: 提交代码到 GitHub
```bash
# 如果还没有 Git 仓库，先初始化
git init
git add .
git commit -m "Add Cloudflare Pages config"

# 创建 GitHub 仓库并推送
git remote add origin https://github.com/你的用户名/dex-next.git
git branch -M main
git push -u origin main
```

### 步骤 3: 在 Cloudflare 部署

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击 **Workers & Pages**
3. 点击 **Create application** → **Pages** → **Connect to Git**
4. 授权并选择您的仓库
5. 配置构建设置：

**框架预设**: Next.js (Static HTML Export)

**构建配置**:
- Build command: `npx @cloudflare/next-on-pages`
- Build output directory: `.vercel/output/static`
- Root directory: (留空或选择 `dex-next`)
- Environment variables: 
  - `NODE_VERSION`: `18.17.0`
  - 添加其他环境变量（如 API keys）

6. 点击 **Save and Deploy**

✅ 完成！您的网站将在几分钟内上线，获得 `https://dex-next.pages.dev` 域名

---

## 方法二：使用 Wrangler CLI 手动部署

### 步骤 1: 安装依赖
```bash
cd /Users/zhangbin/Desktop/project/learn-web3/dex-next
pnpm add -D @cloudflare/next-on-pages wrangler
```

### 步骤 2: 登录 Cloudflare
```bash
npx wrangler login
```
这会打开浏览器进行授权。

### 步骤 3: 构建项目
```bash
pnpm run pages:build
```

### 步骤 4: 首次部署
```bash
npx wrangler pages deploy .vercel/output/static --project-name=dex-next
```

### 后续更新部署
```bash
# 一键构建并部署
pnpm run deploy
```

✅ 完成！您会看到部署链接，类似 `https://dex-next.pages.dev`

---

## 方法三：本地预览（测试部署效果）

```bash
# 安装依赖
pnpm add -D @cloudflare/next-on-pages wrangler

# 构建并预览
pnpm run preview
```

访问 `http://localhost:8788` 查看效果

---

## ⚙️ 环境变量配置

### 在 Cloudflare Dashboard 配置：

1. 进入您的项目
2. 点击 **Settings** → **Environment variables**
3. 添加变量：
   - `NODE_VERSION`: `18.17.0`
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: 您的项目 ID
   - 其他需要的环境变量

### 本地开发配置：

创建 `.env.local` 文件：
```bash
cp .env.example .env.local
# 然后编辑 .env.local 填入真实值
```

---

## 🔧 常见问题

### 1. 构建失败 "Module not found"
```bash
# 清理并重新安装依赖
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 2. 部署后页面空白
- 检查浏览器控制台错误
- 确认环境变量是否正确配置
- 查看 Cloudflare Pages 部署日志

### 3. API 路由不工作
- 确保 API 路由兼容 Edge Runtime
- 避免使用 Node.js 特定 API（如 fs, path）
- 参考 [Next.js Edge Runtime 文档](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)

### 4. 图片加载慢
- 已配置 `images.unoptimized: true`
- 可考虑使用 Cloudflare Images 服务

---

## 🌐 自定义域名

1. 在 Cloudflare Dashboard 进入项目
2. 点击 **Custom domains** → **Set up a custom domain**
3. 输入域名（如 `dex.yourdomain.com`）
4. 按提示配置 DNS 记录（CNAME 或 A 记录）
5. 等待 DNS 生效（通常几分钟）

---

## 📊 监控和分析

### 查看部署日志
```bash
npx wrangler pages deployment list
npx wrangler pages deployment tail
```

### 访问统计
在 Cloudflare Dashboard → 项目 → **Analytics** 查看访问数据

---

## 🎯 一键部署命令

```bash
# 从零开始部署
pnpm add -D @cloudflare/next-on-pages wrangler && \
npx wrangler login && \
pnpm run pages:build && \
npx wrangler pages deploy .vercel/output/static --project-name=dex-next
```

---

## 📚 更多资源

- [完整部署文档](./CLOUDFLARE_DEPLOY.md)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [@cloudflare/next-on-pages GitHub](https://github.com/cloudflare/next-on-pages)

---

**祝部署顺利！🎉**

