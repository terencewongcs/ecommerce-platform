# Specifications and Requirements

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
