/** Shared API shapes for the admin panel (mirrors the backend contract). */

export interface DashboardStats {
  revenue: number;
  orders: number;
  customers: number;
  products: number;
  lowStockCount: number;
}

export interface RevenueDay {
  date: string;
  revenue: number;
}

export interface OrdersByStatus {
  status: string;
  count: number;
}

export interface DashboardRecentOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  user: { name: string | null; email: string | null } | null;
}

export interface DashboardRecentCustomer {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
}

export interface LowStockItem {
  id: string;
  sku: string | null;
  available: number;
  lowStockThreshold: number;
  product: { name: string };
  variant: { name: string } | null;
}

export interface DashboardPendingReview {
  id: string;
  rating: number;
  title: string | null;
  status: string;
  product: { name: string };
  user: { name: string | null };
}

export interface DashboardData {
  stats: DashboardStats;
  revenueByDay: RevenueDay[];
  ordersByStatus: OrdersByStatus[];
  recentOrders: DashboardRecentOrder[];
  recentCustomers: DashboardRecentCustomer[];
  lowStock: LowStockItem[];
  recentReviews: DashboardPendingReview[];
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  published: boolean;
  featured: boolean;
  category: { name: string } | null;
  images: { url: string }[];
  variants: { id: string; name: string; sku: string | null }[];
  stock: number;
}

export interface ProductImage {
  url: string;
  alt?: string | null;
  sortOrder?: number;
}

export interface ProductVariant {
  id?: string;
  name: string;
  color?: string | null;
  size?: string | null;
  sku: string;
  price?: number | null;
  compareAtPrice?: number | null;
  active: boolean;
  sortOrder: number;
  quantity: number;
  lowStockThreshold: number;
}

export interface ProductFull extends Omit<ProductListItem, "images" | "variants"> {
  description: string | null;
  shortDescription: string | null;
  colors: string[];
  material: string | null;
  careInstructions: string | null;
  categoryId: string | null;
  collections: string[];
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  user: { name: string | null; email: string | null } | null;
}

export interface OrderItem {
  productName: string;
  variantName: string | null;
  sku: string | null;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderFull extends OrderListItem {
  items: OrderItem[];
  payment: { method: string | null; status: string } | null;
  shippingName?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  shippingMethod?: string | null;
  shippingCost?: number | null;
  subtotal?: number | null;
  discount?: number | null;
  couponCode: string | null;
  notes?: string | null;
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

export interface CustomerListItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  _count: { orders: number };
}

export interface CustomerAddress {
  id: string;
  label?: string | null;
  name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface CustomerFull extends CustomerListItem {
  addresses: CustomerAddress[];
  orders: OrderListItem[];
}

export interface InventoryItem {
  id: string;
  sku: string | null;
  quantity: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  isLow: boolean;
  product: { name: string };
  variant: { name: string } | null;
}

export type CouponType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minimumOrderAmount: number | null;
  maximumDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: string;
  expiryDate: string | null;
  active: boolean;
}

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: string;
  verifiedPurchase: boolean;
  createdAt: string;
  product: { name: string };
  user: { name: string | null };
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
  user: { name: string | null; email: string | null } | null;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  image?: string | null;
  active?: boolean;
  sortOrder?: number;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  image?: string | null;
  active?: boolean;
  sortOrder?: number;
}

export interface StaffListItem {
  id: string;
  name: string | null;
  email: string | null;
  role: "ADMIN" | "CUSTOMER";
  emailVerified: boolean;
  createdAt: string;
  _count: { orders: number };
}

export interface JournalArticleListItem {
  id: string;
  title: string;
  slug: string;
  image: string | null;
  publishedAt: string;
  published: boolean;
  featured: boolean;
}

export interface JournalArticleFull extends JournalArticleListItem {
  excerpt: string | null;
  content: string[];
  createdAt: string;
  updatedAt: string;
}
