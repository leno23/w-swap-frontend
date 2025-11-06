# 在 Cloudflare Pages 上部署 Next.js 项目

## 方法一：通过 Git 自动部署（推荐）

### 1. 准备项目

#### 1.1 安装 Cloudflare 适配器
```bash
pnpm add -D @cloudflare/next-on-pages
```

#### 1.2 更新 package.json 脚本
添加以下脚本到 `package.json`:
```json
{
  "scripts": {
    "pages:build": "npx @cloudflare/next-on-pages",
    "preview": "npm run pages:build && wrangler pages dev",
    "deploy": "npm run pages:build && wrangler pages deploy"
  }
}
```

#### 1.3 创建 `.node-version` 文件
在项目根目录创建 `.node-version` 文件，指定 Node.js 版本：
```
18.17.0
```

### 2. 推送代码到 Git

确保代码已推送到 GitHub/GitLab/Bitbucket：
```bash
git add .
git commit -m "Prepare for Cloudflare Pages deployment"
git push origin main
```

### 3. 在 Cloudflare Pages 创建项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**
3. 选择您的 Git 仓库
4. 配置构建设置：
   - **Framework preset**: Next.js (Static HTML Export) 或选择 None
   - **Build command**: `npx @cloudflare/next-on-pages`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/dex-next` (如果是 monorepo)
   - **Node version**: 18.17.0 或更高

5. 添加环境变量（如果需要）：
   - 点击 **Environment variables**
   - 添加您的环境变量（如 API keys 等）

6. **重要**: 设置兼容性标志
   - 在部署后，进入项目 **Settings** → **Functions**
   - 在 **Compatibility Flags** 部分，添加 `nodejs_compat`
   - 或者在部署时，在构建设置中添加环境变量：
     - Key: `COMPATIBILITY_FLAGS`
     - Value: `nodejs_compat`

7. 点击 **Save and Deploy**

### 4. 等待部署完成

Cloudflare Pages 会自动构建和部署您的项目。部署完成后，您会获得一个 `.pages.dev` 域名。

---

## 方法二：使用 Wrangler CLI 手动部署

### 1. 安装 Wrangler
```bash
pnpm add -D wrangler
# 或全局安装
npm install -g wrangler
```

### 2. 登录 Cloudflare
```bash
wrangler login
```

### 3. 构建项目
```bash
pnpm run pages:build
```

### 4. 部署到 Cloudflare Pages
```bash
wrangler pages deploy .vercel/output/static --project-name=dex-next
```

---

## Next.js 配置注意事项

### 1. 兼容性调整

Cloudflare Pages 运行在 Edge Runtime 上，某些 Next.js 功能可能需要调整。

#### 更新 `next.config.ts`:
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Cloudflare Pages 配置
  images: {
    unoptimized: true, // Cloudflare 使用自己的图片优化
  },
  
  // 如果使用静态导出
  // output: 'export',
  
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
```

### 2. 创建 `wrangler.toml`（可选）

在项目根目录创建 `wrangler.toml`:
```toml
name = "dex-next"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[build]
command = "npx @cloudflare/next-on-pages"

[env.production]
vars = { NODE_ENV = "production" }
```

---

## 常见问题

### 1. 构建失败
- 确保 Node.js 版本 >= 18.17.0
- 检查 `pnpm-lock.yaml` 是否已提交
- 确认所有依赖已安装

### 2. 运行时错误
- 检查是否使用了 Node.js 特定 API（如 fs, path）
- 确保所有 API 路由兼容 Edge Runtime
- 查看 Cloudflare Pages 部署日志

### 3. 环境变量
- 在 Cloudflare Dashboard 中配置环境变量
- 使用 `process.env.NEXT_PUBLIC_*` 前缀的变量会暴露到浏览器

### 4. 自定义域名
1. 进入项目 > **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入域名并按提示配置 DNS

---

## 性能优化建议

1. **启用 Cloudflare CDN**: 自动启用，无需配置
2. **图片优化**: 使用 Cloudflare Images 或 unoptimized: true
3. **缓存策略**: 配置 `_headers` 和 `_redirects` 文件
4. **代码分割**: Next.js 自动处理

---

## 监控和调试

- **部署日志**: Cloudflare Dashboard > 项目 > Deployments
- **实时日志**: 使用 `wrangler pages deployment tail`
- **分析**: Cloudflare Dashboard > Web Analytics

---

## 有用的链接

- [Cloudflare Pages 官方文档](https://developers.cloudflare.com/pages/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

---

## 快速部署命令

```bash
# 1. 安装依赖
pnpm add -D @cloudflare/next-on-pages wrangler

# 2. 构建
pnpm run pages:build

# 3. 本地预览
pnpm run preview

# 4. 部署
pnpm run deploy
```

