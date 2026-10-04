/**
 * Shared DTO types mirroring the Prisma schema.
 * API responses wrap payloads in { success: true, data } (see lib/api/response).
 */

// ---------------------------------------------------------------------------
// API envelope
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
}

export interface PaginatedData<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN";
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressDTO {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  province: string;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  active: boolean;
}

export interface CollectionDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  active: boolean;
  sortOrder: number;
}

export interface ProductImageDTO {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

export interface ProductVariantDTO {
  id: string;
  name: string;
  color: string | null;
  size: string | null;
  sku: string;
  price: number | null;
  compareAtPrice: number | null;
  active: boolean;
  sortOrder: number;
  /** Units available for purchase (quantity - reserved), when loaded. */
  available?: number;
}

export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  colors: string[];
  material: string | null;
  careInstructions: string | null;
  featured: boolean;
  published: boolean;
  soldCount: number;
  category: Pick<CategoryDTO, "id" | "name" | "slug"> | null;
  images: ProductImageDTO[];
  variants: ProductVariantDTO[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Cart & wishlist
// ---------------------------------------------------------------------------

export interface CartItemDTO {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: Pick<ProductDTO, "id" | "name" | "slug" | "price"> & {
    images: ProductImageDTO[];
  };
  variant: Pick<
    ProductVariantDTO,
    "id" | "name" | "sku" | "price"
  > | null;
}

export interface CartDTO {
  id: string;
  items: CartItemDTO[];
  couponCode: string | null;
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
}

export interface WishlistItemDTO {
  id: string;
  productId: string;
  product: Pick<ProductDTO, "id" | "name" | "slug" | "price"> & {
    images: ProductImageDTO[];
  };
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface OrderItemDTO {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryMethod: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode: string | null;
  shippingName: string;
  shippingPhone: string;
  shippingAddressLine1: string;
  shippingAddressLine2: string | null;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string | null;
  notes: string | null;
  items: OrderItemDTO[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Reviews / engagement
// ---------------------------------------------------------------------------

export interface ReviewDTO {
  id: string;
  productId: string;
  rating: number;
  title: string | null;
  comment: string;
  verifiedPurchase: boolean;
  status: string;
  user: { id: string; name: string } | null;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}
