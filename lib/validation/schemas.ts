import { z } from "zod";

const uuid = z.string().uuid("Invalid id");

const emailField = z.string().trim().toLowerCase().email("Invalid email address");

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: emailField,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().min(7).max(20).optional().nullable(),
});

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export const addressSchema = z.object({
  label: z.string().trim().max(40).default("Home"),
  fullName: z.string().trim().min(2, "Full name is required").max(80),
  phone: z.string().trim().min(7, "Phone is required").max(20),
  addressLine1: z.string().trim().min(3, "Address is required").max(200),
  addressLine2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(2, "City is required").max(80),
  province: z.string().trim().min(2, "Province is required").max(80),
  postalCode: z.string().trim().max(20).optional().nullable(),
  country: z.string().trim().max(80).default("Pakistan"),
  isDefault: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens")
    .optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  image: z.string().trim().max(500).optional().nullable(),
  parentId: uuid.optional().nullable(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const collectionSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens")
    .optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  image: z.string().trim().max(500).optional().nullable(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const productImageSchema = z.object({
  url: z.string().trim().min(1, "Image URL is required").max(1000),
  alt: z.string().trim().max(200).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export const productVariantSchema = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(1, "Variant name is required").max(120),
  color: z.string().trim().max(60).optional().nullable(),
  size: z.string().trim().max(60).optional().nullable(),
  sku: z.string().trim().min(1, "SKU is required").max(60),
  price: z.number().int().positive().optional().nullable(),
  compareAtPrice: z.number().int().positive().optional().nullable(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  quantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens")
    .optional(),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().trim().max(300).optional().nullable(),
  price: z.number().int().positive("Price must be a positive whole PKR amount"),
  compareAtPrice: z.number().int().positive().optional().nullable(),
  sku: z.string().trim().min(1, "SKU is required").max(60),
  categoryId: uuid.optional().nullable(),
  colors: z.array(z.string().trim().max(40)).default([]),
  material: z.string().trim().max(120).optional().nullable(),
  careInstructions: z.string().max(2000).optional().nullable(),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  images: z.array(productImageSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
  collectionIds: z.array(uuid).default([]),
});

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(40)
    .transform((c) => c.toUpperCase()),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.number().int().positive("Value must be positive"),
  minimumOrderAmount: z.number().int().min(0).default(0),
  maximumDiscount: z.number().int().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  startDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional().nullable(),
  active: z.boolean().default(true),
});

export const couponCodeSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required"),
});

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export const cartItemSchema = z.object({
  productId: uuid,
  variantId: uuid.optional().nullable(),
  quantity: z.number().int().min(1).max(100),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(100),
});

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

const checkoutAddressSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(80),
  phone: z.string().trim().min(7, "Phone is required").max(20),
  addressLine1: z.string().trim().min(3, "Address is required").max(200),
  addressLine2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(2, "City is required").max(80),
  province: z.string().trim().min(2, "Province is required").max(80),
  postalCode: z.string().trim().max(20).optional().nullable(),
  country: z.string().trim().max(80).optional().nullable(),
});

export const checkoutSchema = z
  .object({
    addressId: uuid.optional(),
    address: checkoutAddressSchema.optional(),
    deliveryMethod: z.enum(["STANDARD", "EXPRESS"]),
    paymentMethod: z.enum(["COD", "BANK_TRANSFER", "ONLINE"]),
    couponCode: z.string().trim().min(1).max(40).optional(),
    notes: z.string().trim().max(500).optional().nullable(),
  })
  .refine((v) => v.addressId || v.address, {
    message: "A shipping address is required (addressId or address)",
    path: ["addressId"],
  });

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const reviewSchema = z.object({
  productId: uuid,
  orderId: uuid.optional().nullable(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().nullable(),
  comment: z.string().trim().min(10, "Please write at least 10 characters").max(5000),
});

// ---------------------------------------------------------------------------
// Contact & newsletter
// ---------------------------------------------------------------------------

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  email: emailField,
  subject: z.string().trim().max(160).optional().nullable(),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(5000),
});

export const newsletterSchema = z.object({
  email: emailField,
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const orderStatusUpdateSchema = z
  .object({
    status: z
      .enum([
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "RETURN_REQUESTED",
        "RETURNED",
      ])
      .optional(),
    paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
  })
  .refine((v) => v.status !== undefined || v.paymentStatus !== undefined, {
    message: "Provide status and/or paymentStatus to update",
  });

export const reviewStatusUpdateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "HIDDEN"]),
});

export const inventoryUpdateSchema = z
  .object({
    quantity: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
  })
  .refine((v) => v.quantity !== undefined || v.lowStockThreshold !== undefined, {
    message: "Provide quantity and/or lowStockThreshold to update",
  });

export const messageReadSchema = z.object({
  read: z.boolean(),
});

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
