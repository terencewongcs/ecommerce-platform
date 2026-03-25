// Mirrors the Mongoose model shapes returned by the API.
// All _id fields are strings (Mongoose serializes ObjectId to string in JSON).

export type ApiProduct = {
  _id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  stock: number;
  category: string[];
  sizes: string[];
  tag: 'New' | 'Sale' | 'Bestseller' | null;
  isPublished: boolean;
  vendorId: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export type ApiOrderItem = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  size: string;
  quantity: number;
  unitPrice: number;
};

export type ApiShippingAddress = {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zip: string;
};

export type ApiOrder = {
  _id: string;
  userId: string;
  items: ApiOrderItem[];
  status: OrderStatus;
  shippingAddress: ApiShippingAddress;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  updatedAt: string;
};

export type UserRole = 'customer' | 'admin' | 'vendor';

export type ApiUser = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminStats = {
  products: { total: number; published: number };
  orders: { total: number };
  users: { total: number };
  revenue: { total: number };
  ordersByStatus: Array<{ _id: string; count: number }>;
  dailyRevenue: Array<{ _id: string; revenue: number; orders: number }>;
};
