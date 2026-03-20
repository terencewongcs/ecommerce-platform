# 开发计划

## 阶段一：Storefront 核心购物页面

不涉及后端，继续用静态数据，把用户最常走的路径做完。

### 路由（App.tsx）

```
/                    → HomePage（已完成）
/women               → ProductListPage
/men                 → ProductListPage
/accessories         → ProductListPage
/new-arrivals        → ProductListPage
/sale                → ProductListPage
/products/:slug      → ProductDetailPage
/search              → SearchResultsPage
/cart                → CartPage
/checkout            → CheckoutPage
/auth/login          → LoginPage
/auth/signup         → SignupPage
/account/*           → AccountPage（后续）
/orders/:id          → OrderDetailPage（后续）
```

### ProductListPage（`/women`、`/men` 等）

文件：`src/pages/products/ProductListPage.tsx`

组件：
- `ProductGrid.tsx` — 商品卡片网格
- `FilterSidebar.tsx` — 分类、价格、尺码筛选（静态 UI）
- `SortSelect.tsx` — 排序下拉框

### ProductDetailPage（`/products/:slug`）

文件：`src/pages/products/ProductDetailPage.tsx`

组件：
- `ProductImages.tsx` — 主图 + 缩略图列表
- `ProductInfo.tsx` — 名称、价格、描述、尺码选择
- `AddToCartButton.tsx` — 加入购物袋按钮

### CartPage（`/cart`）

文件：`src/pages/cart/CartPage.tsx`

状态管理：React Context + useReducer（无需后端）
- `src/contexts/CartContext.tsx` — add / remove / update 数量
- `CartItemList.tsx` — 商品列表
- `CartSummary.tsx` — 小计、税费、结账按钮

---

## 阶段二：API 后端基础

### Express 入口
- `services/api/src/app.ts` — CORS、JSON、error handler
- `services/api/src/index.ts` — 启动服务、连接 MongoDB

### Mongoose 模型
- `services/api/src/models/User.ts`
- `services/api/src/models/Product.ts`
- `services/api/src/models/Order.ts`

### 认证路由
- `services/api/src/routes/auth.ts` — register、login、refresh、logout
- `services/api/src/middleware/auth.ts` — JWT 验证
- 双 Token 方案（内存 access token + HttpOnly Cookie refresh token）

### 商品路由
- `services/api/src/routes/products.ts` — GET /products、/products/:slug

---

## 阶段三：Storefront 接入 API

- `src/lib/apiClient.ts` — fetch 封装，自动带 access token
- `src/hooks/useProducts.ts` — TanStack Query hooks
- `src/hooks/useAuth.ts` — 登录态管理
- 替换静态数据为真实 API 调用
