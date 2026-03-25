# Storefront

TrendyUnique 电商平台的前台商城，面向终端消费者。

## 技术栈

| 技术 | 用途 |
|------|------|
| React 19 + TypeScript | UI 框架 |
| Vite 6 | 构建工具，开发服务器 |
| React Router v6 | 客户端路由 |
| TanStack Query v5 | 服务端状态管理 / API 请求缓存 |
| React Hook Form v7 | 表单处理 |
| Tailwind CSS v3 | 样式 |
| MUI v6 (Icons) | 图标组件 |
| Zod v3 | 环境变量校验 |

## 项目结构

```
src/
├── pages/
│   ├── home/           # 首页
│   ├── products/       # 商品列表页、商品详情页
│   ├── search/         # 搜索结果页
│   ├── cart/           # 购物车页
│   ├── checkout/       # 结账页
│   └── auth/           # 登录页、注册页
├── components/         # 可复用 UI 组件（每个组件独立一个文件）
├── hooks/
│   ├── useProducts.ts  # 商品 API 请求（React Query）
│   └── useAuth.tsx     # 认证状态管理（登录 / 注册 / 登出）
├── contexts/
│   └── CartContext.tsx # 购物车全局状态（React Context）
└── lib/
    ├── apiClient.ts    # 通用 fetch 封装（自动刷新 JWT）
    ├── apiTypes.ts     # API 返回类型 + 适配器函数
    └── env.ts          # 环境变量（Zod 校验）
```

## 页面路由

| 路径 | 页面 |
|------|------|
| `/` | 首页 |
| `/women` `/men` `/accessories` `/new-arrivals` `/sale` | 分类商品列表 |
| `/products/:slug` | 商品详情 |
| `/search?q=keyword` | 搜索结果 |
| `/cart` | 购物车 |
| `/checkout` | 结账 |
| `/auth/login` | 登录 |
| `/auth/signup` | 注册 |

## 快速开始

### 前置条件

- Node.js v22+
- pnpm v9+
- 后端 API 服务已启动（见 `services/api`）

### 1. 安装依赖

在项目根目录执行（monorepo 统一安装）：

```bash
pnpm install
```

### 2. 配置环境变量

复制示例文件并填入后端地址：

```bash
cp .env.example .env
```

`.env` 内容：

```env
VITE_API_URL=http://localhost:3001
```

### 3. 启动开发服务器

```bash
# 在 apps/storefront 目录下
pnpm dev
```

或从根目录启动（同时启动所有服务）：

```bash
pnpm dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)

## 常用命令

```bash
pnpm dev          # 启动开发服务器（端口 3000）
pnpm build        # 生产构建，输出到 dist/
pnpm preview      # 预览生产构建
pnpm typecheck    # TypeScript 类型检查
pnpm lint         # ESLint 代码检查
pnpm clean        # 清理 dist/
```

## 认证机制

- 登录 / 注册成功后，后端颁发 **Access Token**（15 分钟有效）和 **Refresh Token**（HttpOnly Cookie，7 天有效）
- `apiClient.ts` 在请求返回 401 时自动调用 `/auth/refresh` 静默刷新，无需用户重新登录
- 用户信息缓存在 `sessionStorage`，页面刷新后通过 Refresh Token 自动恢复登录状态

## 购物车

购物车基于 React Context（`CartContext`），数据存储在内存中，**刷新页面后清空**（未接入持久化 / 后端）。

## 依赖的后端接口

| 接口 | 用途 |
|------|------|
| `GET /products` | 商品列表（支持 `category`、`page`、`limit`） |
| `GET /products/:slug` | 商品详情 |
| `POST /auth/register` | 注册 |
| `POST /auth/login` | 登录 |
| `POST /auth/refresh` | 刷新 Token |
| `POST /auth/logout` | 登出 |
