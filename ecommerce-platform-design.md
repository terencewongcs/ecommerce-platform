# ecommerce-platform 设计文档

## 项目背景

本仓库是 `trendyuniquellc/ecommerce-platform`，为 TrendyUnique LLC 电商平台的**主项目 monorepo**，包含前台商城（storefront）、后台管理面板（dashboard）及后端 API 服务。UI 组件由独立组件库 `@trendyuniquellc/ui-library`（私有 GitHub Packages）提供。

## Tech Stack

### Frontend — Storefront

- **框架**：Vite v6（CSR，初始开发阶段全页面客户端渲染，SSR/SSG 后续按需引入）
- **语言**：TypeScript ^5.5（strict mode）
- **UI**：React ^19.0 + `@trendyuniquellc/ui-library`
- **路由**：React Router v6
- **样式**：Tailwind CSS v3（锁定 v3，兼容 `tailwind.preset.cjs`；v4 删除了 `presets` API）
- **数据请求**：TanStack Query（React Query）v5
- **表单**：React Hook Form v7 + Zod v3

### Frontend — Dashboard

- **框架**：Vite v6（CSR）
- **语言**：TypeScript ^5.5（strict mode）
- **UI**：React ^19.0 + `@trendyuniquellc/ui-library`
- **表格**：TanStack Table v8
- **图表**：Recharts v2
- **富文本**：TipTap v2

### Backend — API

- **运行时**：Node.js v22 LTS
- **框架**：Express v5
- **语言**：TypeScript ^5.5（strict mode）
- **ODM**：Mongoose v8
- **认证**：jsonwebtoken v9 + bcrypt v5
- **队列**：BullMQ v5
- **数据库**：MongoDB Atlas + Atlas Search
- **缓存 / 队列存储**：Redis v7（服务端）+ ioredis ^5（客户端）
- **文件存储**：Cloudflare R2

### Shared Packages

- **`packages/types`**：共享 Zod schema + TypeScript 类型，供 storefront、dashboard、api 统一消费
- **`packages/tsconfig`**：共享 TypeScript 配置基础，各子包继承

### Infrastructure & Tooling

- **容器化**：Docker + Docker Compose（单台 VPS 部署）
- **CDN**：Cloudflare CDN
- **Monorepo 工具**：pnpm v9（workspaces）+ Turborepo v2
- **代码质量**：ESLint v9（flat config）+ Prettier v3
- **CI/CD**：GitHub Actions
- **可观测性**：Sentry ^8
- **性能监控**：Lighthouse CI（storefront）

---

## 目录结构

```
trendyuniquellc/ecommerce-platform/
├── apps/
│   ├── storefront/                  # Vite CSR 前台商城
│   │   ├── src/
│   │   │   ├── main.tsx             # React 挂载入口
│   │   │   ├── App.tsx              # React Router 路由配置
│   │   │   ├── pages/               # 路由页面组件
│   │   │   ├── components/          # 页面级组件（非 ui-library 通用组件）
│   │   │   ├── hooks/               # 页面级自定义 Hooks
│   │   │   └── lib/                 # 工具函数、API client 封装
│   │   ├── index.html               # Vite 入口 HTML
│   │   └── public/                  # 静态资源（不经过 Vite 处理，直接服务）
│   │
│   └── dashboard/                   # Vite CSR 后台管理
│       └── src/
│           ├── pages/               # 路由页面
│           ├── components/          # 管理面板专用组件
│           ├── hooks/               # 自定义 Hooks
│           └── lib/                 # 工具函数
│
├── services/
│   └── api/                         # Express API 服务
│       └── src/
│           ├── routes/              # 路由处理器
│           ├── middleware/          # 中间件（auth、validate、error 等）
│           ├── models/              # Mongoose 模型
│           ├── queues/              # BullMQ 队列定义与 Worker
│           └── lib/                 # 工具（JWT、R2、Redis 等封装）
│
├── packages/
│   ├── types/                       # 共享 Zod schema + TS 类型
│   └── tsconfig/                    # 共享 TypeScript 配置基础
│
├── infra/
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
│
└── .github/
    └── workflows/
```

---

## TypeScript 跨包引用规范

采用 **TypeScript Project References**（`tsc --build`）+ Turborepo pipeline 编排：

- `packages/tsconfig` 提供基础 `tsconfig.base.json`，各子包的 `tsconfig.json` 通过 `extends` 继承
- `packages/types` 在自身 `tsconfig.json` 中声明为被引用包（`composite: true`）
- `apps/*` 和 `services/api` 的 `tsconfig.json` 通过 `references` 字段指向 `packages/types`
- 优势：增量编译（只重编译变更的包）、跨包跳转到定义、IDE 类型感知无需发布

```jsonc
// apps/storefront/tsconfig.json 示例
{
  "extends": "../../packages/tsconfig/tsconfig.base.json",
  "references": [{ "path": "../../packages/types" }],
  "compilerOptions": {
    "outDir": "dist"
  }
}
```

> **注意**：`packages/types` 必须设置 `"composite": true` 并声明 `"declaration": true`，否则 Project References 无法解析。

---

## Turborepo Pipeline

```jsonc
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],   // 先构建所有依赖包（packages/*）
      "outputs": ["dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"],   // 依赖上游包构建产物
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true         // 并行启动所有 dev server，不等待依赖
    },
    "lint": {
      "outputs": []              // 完全并行，无拓扑依赖
    },
    "test": {
      "outputs": ["coverage/**"] // 完全并行
    }
  }
}
```

**各任务说明：**

| 任务 | 依赖拓扑 | 说明 |
|------|----------|------|
| `build` | `^build`（先上游） | packages → apps / services 顺序构建 |
| `typecheck` | `^build` | 依赖上游包的 `.d.ts` 产物 |
| `dev` | 无（`persistent`） | 各服务并行启动，不阻塞彼此 |
| `lint` | 无 | 完全并行 |
| `test` | 无 | 完全并行 |

---

## 渲染规范（Storefront）

> **初始开发阶段**：所有路由均为 CSR（客户端渲染），使用 Vite 构建为纯静态 SPA。SSR/SSG 在后续阶段按 SEO 需求引入。

| 路由 | 渲染方式 | 说明 |
|------|----------|------|
| `/` | CSR | 当前阶段 CSR；后续可升级为 SSG |
| `/products/:slug` | CSR | 当前阶段 CSR；后续升级为 SSR（SEO 需要） |
| `/search` | CSR | 当前阶段 CSR；后续升级为 SSR（SEO 需要） |
| `/cart` | CSR | 纯客户端状态，无需 SEO |
| `/checkout` | CSR | 支付流程，无需 SEO |
| `/orders/:id` | CSR | 登录后页面，无需 SEO |
| `/account/*` | CSR | 用户私有页面，无需 SEO |
| `/auth/*` | CSR | 登录注册，无需 SEO |

---

## 认证规范

采用 **内存（access token）+ HttpOnly Cookie（refresh token）** 双 token 方案：

| Token | 存储位置 | 有效期（建议） | 说明 |
|-------|----------|----------------|------|
| Access Token | JS 内存（React state / module variable） | 15 分钟 | 不持久化，页面刷新后通过 silent refresh 重新获取 |
| Refresh Token | HttpOnly Cookie（`Secure; SameSite=Strict`） | 7 天 | 服务端负责轮转（rotation），旧 token 一次性失效 |

**关键规则：**

- access token 不写入 `localStorage` / `sessionStorage`，防止 XSS 泄露
- refresh token Cookie 设置 `HttpOnly + Secure + SameSite=Strict`，防止 CSRF 和 JS 读取
- API 每次返回新 access token 时，旧 token 立即丢弃
- Refresh token rotation：每次刷新发放新 refresh token，旧的立即失效；检测到 reuse 时吊销整个 family（检测 token theft）
- 登出时服务端吊销 refresh token，并清除 Cookie

---

## 权限规范（Dashboard）

### 角色矩阵

| 操作 | Admin | Vendor |
|------|-------|--------|
| 查看所有商品 | ✅ | ✅（仅自己） |
| 上架 / 下架商品 | ✅ | ✅（仅自己） |
| 修改库存 | ✅ | ✅（仅自己） |
| 查看所有订单 | ✅ | ❌ |
| 修改订单状态 | ✅ | ✅（含自己商品的订单） |
| 管理用户 | ✅ | ❌ |

### 实现要点

- 权限校验在 API 层（middleware）执行，前端仅控制 UI 展示，不作为安全边界
- Vendor 资源隔离：所有 Vendor 请求自动附加 `vendorId` 过滤条件，不依赖前端传参
- 路由级别的权限守卫：dashboard 前端在路由跳转时检查 token 中的 `role` claim，非授权角色重定向到 403 页面

---

## 异步队列规范（BullMQ）

使用 BullMQ v5 + Redis v7 处理需要异步执行或重试的任务。

### Queue 定义

| Queue 名称 | 用途 | 重试策略 |
|------------|------|----------|
| `notification` | 订单确认邮件、发货通知、账户相关邮件 | 最多 3 次，指数退避 |

> **扩展占位**：支付回调处理、图片压缩上传至 R2 等场景后续按需新增 Queue。

### Worker 规范

- Worker 与 API server 进程分离，独立部署（docker-compose 独立 service）
- 每个 Queue 对应一个 `src/queues/{queueName}.queue.ts`（Queue 定义 + Job 类型）和 `src/queues/{queueName}.worker.ts`（Worker 处理逻辑）
- Job payload 使用 Zod schema 验证（复用 `packages/types` 中的共享类型）
- 失败 Job 进入 `failed` 状态，保留 72 小时供排查；不自动删除

---

## 支付集成

> **占位**：支付网关尚未选定，此节待确认后补充。集成时需覆盖：Webhook 签名验证、幂等性处理、订单状态机流转。

---

## 代码规范

### TypeScript

- 全项目 strict mode，禁止使用 `any`，禁止绕过类型检查
- 每个模块导出类型时使用 `export type`，避免运行时副作用
- API 路由的 Request / Response 类型统一从 `packages/types` 导入

### 导入规范

优先使用 barrel import，禁止使用深度路径导入


### 环境变量

- 所有环境变量通过 Zod schema 在启动时验证，缺失或格式错误立即 fail-fast
- 变量定义在各子包的 `lib/env.ts`（storefront）或 `src/lib/env.ts`（dashboard、api）中集中管理，不散落在业务代码里
- `.env.example` 随代码一起提交，`.env` 加入 `.gitignore`

### API 错误处理

- Express 使用统一 error handler middleware，所有错误经由 `next(err)` 传递
- HTTP 错误使用自定义 `AppError` 类（携带 `statusCode` + `code` + `message`）
- 4xx 错误记录 warn 级别日志；5xx 错误记录 error 级别并上报 Sentry

---

## a11y 要求

- 所有交互元素必须可键盘访问，且有可见焦点环
- 使用语义化 HTML（`<button>`、`<a>`、`<nav>`、`<main>` 等），禁用 `<div onClick>`
- 缺少视觉上下文时提供 `aria-label` 或 `aria-labelledby`
- MUI 对 modal、menu 等复合组件已内置 ARIA 角色，无充分理由不得覆盖
- 测试中优先使用 `getByRole`、`getByLabelText`，避免用 `getByTestId` 测试交互元素

---

## SEO 规范（Storefront）

> **初始开发阶段为 CSR SPA，SEO 规范在引入 SSR/SSG 时生效。当前阶段以下为预备规范，编码时提前遵守以降低后续迁移成本。**

- 标题层级（`h1`–`h6`）由页面消费方控制，不在组件内硬编码
- `<img>` 必须提供 `alt`，不得为空字符串（装饰性图片除外，需显式 `alt=""`）
- 通过 `react-helmet-async` 或类似方案为每个路由声明 `<title>` 和 `<meta name="description">`（为后续 SSR 兼容做准备）

---

## 测试规范

### 测试分层

| 层级 | 工具 | 覆盖范围 |
|------|------|----------|
| 单元测试 | Vitest v2 | 纯逻辑、自定义 Hooks、工具函数 |
| 组件测试 | React Testing Library ^16 | 渲染、交互、a11y |
| API 集成测试 | Vitest v2 + Supertest | Express 路由、middleware |
| E2E | 暂不引入，后续补充 | — |

> **注意：`@testing-library/jest-dom` matchers 需手动挂载到 Vitest。**
> 在 `vitest.config.ts` 中配置：
> ```ts
> test: {
>   setupFiles: ['./vitest.setup.ts'],
> }
> ```
> 并在 `vitest.setup.ts` 中：
> ```ts
> import '@testing-library/jest-dom';
> ```
> 否则 `toBeInTheDocument()` 等断言在运行时会报错。

### CI 中的测试执行

- PR 触发：lint → typecheck → test（三者并行，均通过才可合并）
- storefront 的 Lighthouse CI 在 PR 合并后的 staging 环境运行

---

## CI/CD 规范

### GitHub Actions Workflows

| Workflow | 触发条件 | 主要步骤 |
|----------|----------|----------|
| `ci.yml` | PR、push to main | lint → typecheck → test（Turborepo 并行） |
| `deploy-staging.yml` | push to main | build → Docker 构建 → 推送镜像 → VPS 部署 staging |
| `deploy-prod.yml` | 手动触发 / tag | build → Docker 构建 → 推送镜像 → VPS 滚动更新 |
| `lighthouse.yml` | staging 部署完成后 | Lighthouse CI 跑 storefront 性能评分 |

### 构建缓存

- Turborepo remote cache：GitHub Actions 中启用，加速跨 PR 的增量构建
- Docker layer cache：使用 `actions/cache` 缓存 Docker build context

---

## 部署规范

### Docker Compose 服务划分

```
services:
  storefront       # Nginx 静态文件服务（Vite 构建产物，CSR SPA）
  dashboard        # Nginx 静态文件服务（Vite 构建产物）
  api              # Express API server
  worker           # BullMQ Worker（独立进程）
  redis            # Redis v7
```

> MongoDB 和 Cloudflare R2 使用托管服务，不进 docker-compose。

### 关键规则

- 每个服务容器只运行单一进程，不在 API 容器内启动 Worker
- 环境变量通过 `.env` 文件注入（生产环境通过 VPS 的 secret 管理，不提交明文）
- 健康检查：所有服务配置 `healthcheck`，避免依赖服务未就绪时提前接流量
- 日志：所有服务输出到 stdout / stderr，由 Docker 统一收集；Sentry 捕获异常

---

## 本地开发

### 启动全栈

```bash
# 安装依赖
pnpm install

# 启动所有服务（storefront、dashboard、api、worker）
pnpm dev

# 单独启动某个服务
pnpm --filter storefront dev
pnpm --filter api dev
```

### 联调本地 ui-library

ui-library 是独立 repo，本地同时修改组件库和消费方时，使用 `pnpm link` 建立符号链接：

```bash
# 1. 在 ui-library 根目录构建并注册全局 link
cd path/to/ui-library
pnpm build
pnpm link --global

# 2. 在消费方目录链接本地版本
cd path/to/ecommerce-platform/apps/storefront
pnpm link --global @trendyuniquellc/ui-library
```

联调结束后恢复线上版本：

```bash
pnpm unlink @trendyuniquellc/ui-library
pnpm install
```

**注意事项：**
- ui-library 每次修改后需重新执行 `pnpm build`，link 本身不会热更新
- storefront 的 Vite dev server 需重启才能感知重新构建的产物
- 联调完成后务必及时 `unlink`，避免意外引用本地路径

---

## 常用命令

```bash
# 全量构建（按拓扑顺序）
pnpm build

# 类型检查
pnpm typecheck

# Lint
pnpm lint

# 测试
pnpm test

# 清理所有构建产物
pnpm clean
```

---

## 详细文档（待补充）

- 数据库设计（Collection schema、索引策略）
- API 规范（路由列表、请求 / 响应类型）
- 部署流程（VPS 初始化、Docker 镜像发布、滚动更新）
- 支付集成（网关选型确认后补充）
- E2E 测试方案（后续补充）