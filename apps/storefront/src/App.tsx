import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import ProductListPage from './pages/products/ProductListPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import CartPage from './pages/cart/CartPage';
import SearchResultsPage from './pages/search/SearchResultsPage';
import CheckoutPage from './pages/checkout/CheckoutPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import AccountPage from './pages/account/AccountPage';
import ResetPasswordPage from './pages/account/ResetPasswordPage';
import OrderConfirmationPage from './pages/orders/OrderConfirmationPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Product list pages — all use the same component, category from URL param */}
      <Route path="/women" element={<ProductListPage />} />
      <Route path="/men" element={<ProductListPage />} />
      <Route path="/accessories" element={<ProductListPage />} />
      <Route path="/new-arrivals" element={<ProductListPage />} />
      <Route path="/sale" element={<ProductListPage />} />

      <Route path="/products/:slug" element={<ProductDetailPage />} />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/account/reset-password" element={<ResetPasswordPage />} />
      <Route path="/orders/:orderId" element={<OrderConfirmationPage />} />
    </Routes>
  );
}
