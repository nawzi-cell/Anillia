/**
 * ANILLIÉA — database seed script.
 *
 * Idempotent: every record is upserted on a unique key (or deleted + recreated
 * where no natural unique key exists), so this script can be re-run safely:
 *
 *   npx prisma db seed
 *
 * Creates:
 *  - admin user            (ADMIN_EMAIL / ADMIN_PASSWORD)
 *  - demo customer         (customer@example.com / DEMO_PASSWORD) + home address
 *  - 7 categories, 3 collections
 *  - 16 products (+ variants, images, per-variant inventory)
 *  - 3 coupons (WELCOME10, FLAT500, BUNDLE20)
 *
 * No orders or reviews are seeded — the demo shop stays clean.
 *
 * Required env: ADMIN_PASSWORD, DEMO_PASSWORD
 * Optional env:  ADMIN_EMAIL (default "nawzirahmed4@gmail.com")
 */

import { PrismaClient, Role, CouponType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(
      `[seed] Missing required environment variable: ${name}. ` +
        "Copy .env.example to .env and set ADMIN_PASSWORD and DEMO_PASSWORD, " +
        "then run `npx prisma db seed` again."
    );
  }
  return value;
}

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.trim() !== ""
    ? process.env.ADMIN_EMAIL.trim()
    : "nawzirahmed4@gmail.com";
const ADMIN_PASSWORD = requiredEnv("ADMIN_PASSWORD");
const DEMO_PASSWORD = requiredEnv("DEMO_PASSWORD");

const BCRYPT_ROUNDS = 12;
const DEFAULT_LOW_STOCK_THRESHOLD = 10;
const DEMO_CUSTOMER_EMAIL = "customer@example.com";

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

interface SeedCategory {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
}

const CATEGORIES: SeedCategory[] = [
  {
    slug: "modest-essentials",
    name: "Modest Essentials",
    description:
      "Wardrobe staples designed for coverage and comfort — hijabs, underscarves and everyday layers.",
    sortOrder: 1,
  },
  {
    slug: "hijabs",
    name: "Hijabs",
    description:
      "Breathable, opaque hijabs in premium georgette and chiffon, cut for generous coverage.",
    sortOrder: 2,
  },
  {
    slug: "underscarves",
    name: "Underscarves",
    description:
      "Stay-put jersey underscarves that keep your hijab secure from morning to night.",
    sortOrder: 3,
  },
  {
    slug: "niqabs",
    name: "Niqabs",
    description:
      "Lightweight, breathable niqabs with comfortable fits made for all-day wear.",
    sortOrder: 4,
  },
  {
    slug: "accessories",
    name: "Accessories",
    description:
      "Pins, pouches and finishing touches that keep your modest wardrobe effortless.",
    sortOrder: 5,
  },
  {
    slug: "gift-sets",
    name: "Gift Sets",
    description:
      "Ready-to-give bundles in our signature gift box — thoughtful gifts for every occasion.",
    sortOrder: 6,
  },
  {
    slug: "deals",
    name: "Deals",
    description:
      "Curated bundles at special prices. Premium modest essentials, better together.",
    sortOrder: 7,
  },
];

interface SeedCollection {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
}

const COLLECTIONS: SeedCollection[] = [
  {
    slug: "everyday-edit",
    name: "The Everyday Edit",
    description:
      "Daily staples for effortless modest dressing — the pieces our customers reach for most.",
    sortOrder: 1,
  },
  {
    slug: "signature-bundles",
    name: "Signature Bundles",
    description:
      "Our bestselling bundles at special prices — complete modest wardrobes in a box.",
    sortOrder: 2,
  },
  {
    slug: "gift-edit",
    name: "The Gift Edit",
    description:
      "Ready-to-give sets in our signature gift box, with a hand-written style card.",
    sortOrder: 3,
  },
];

interface SeedVariant {
  name: string;
  color?: string;
  size?: string;
  sku: string;
  sortOrder: number;
  quantity: number;
}

interface SeedProduct {
  name: string;
  slug: string;
  sku: string;
  shortDescription?: string;
  description: string;
  price: number; // whole PKR
  compareAtPrice?: number; // whole PKR
  categorySlug: string;
  collectionSlugs: string[];
  colors: string[];
  material?: string;
  careInstructions?: string;
  featured: boolean;
  soldCount: number;
  imageUrl?: string; // overrides the default /images/products/<slug>.svg
  variants: SeedVariant[];
}

function colorVariants(
  baseSku: string,
  colors: string[],
  quantities: number[]
): SeedVariant[] {
  return colors.map((color, i) => ({
    name: `${color} / One Size`,
    color,
    size: "One Size",
    sku: `${baseSku}-${color.slice(0, 3).toUpperCase()}-OS`,
    sortOrder: i + 1,
    quantity: quantities[i] ?? quantities[quantities.length - 1] ?? 0,
  }));
}

const PRODUCTS: SeedProduct[] = [
  {
    name: "Everyday Modest Deal",
    slug: "everyday-modest-deal",
    sku: "AMD-EMD",
    shortDescription: "Our bestselling starter bundle.",
    description:
      "Everything you need for effortless everyday modest wear, in one thoughtful bundle:\n\n" +
      "• Crinkle georgette hijab — breathable, non-slip drape\n" +
      "• Stretch jersey underscarf — full coverage, all-day comfort\n" +
      "• Curated hijab pins — secure hold without snags\n" +
      "• Reusable drawstring pouch — keeps your set organised\n" +
      "• Care & styling card — tips to make your hijab last\n\n" +
      "A saving of PKR 300 versus buying each piece separately.",
    price: 899,
    compareAtPrice: 1199,
    categorySlug: "deals",
    collectionSlugs: ["everyday-edit", "signature-bundles"],
    colors: ["Ivory", "Taupe", "Blush"],
    material:
      "Crinkle georgette (100% polyester) hijab; cotton-blend jersey underscarf",
    careInstructions:
      "Hand wash cold with mild detergent. Hang dry in shade. Cool iron on reverse if needed.",
    featured: true,
    soldCount: 1240,
    imageUrl: "/images/products/everyday-modest-deal.webp",
    variants: colorVariants("AMD-EMD", ["Ivory", "Taupe", "Blush"], [120, 95, 80]),
  },
  {
    name: "Crinkle Georgette Hijab",
    slug: "crinkle-georgette-hijab",
    sku: "AMD-CGH",
    shortDescription: "Featherlight crinkle georgette with a non-slip finish.",
    description:
      "Our signature hijab in airy crinkle georgette — opaque, breathable and endlessly wearable. " +
      "The textured weave holds its drape without pins slipping, and the generous cut gives full coverage. " +
      "Approximately 70 × 180 cm.",
    price: 1450,
    categorySlug: "hijabs",
    collectionSlugs: [],
    colors: ["Ivory", "Taupe", "Espresso", "Olive", "Black"],
    material: "Premium crinkle georgette (100% polyester)",
    careInstructions:
      "Machine wash cold on gentle, or hand wash. Hang dry. No iron needed — the crinkle is the texture.",
    featured: false,
    soldCount: 860,
    imageUrl: "/images/products/crinkle-georgette-hijab.webp",
    variants: colorVariants(
      "AMD-CGH",
      ["Ivory", "Taupe", "Espresso", "Olive", "Black"],
      [60, 60, 60, 60, 4]
    ),
  },
  {
    name: "Jersey Underscarf",
    slug: "jersey-underscarf",
    sku: "AMD-JUS",
    shortDescription: "Stay-put jersey underscarf with full front coverage.",
    description:
      "A soft, stretchy jersey underscarf that keeps your hijab in place from morning to night. " +
      "Wide band for full coverage, breathable knit for warm days.",
    price: 650,
    categorySlug: "underscarves",
    collectionSlugs: [],
    colors: ["Taupe", "Espresso", "Black"],
    material: "Cotton-viscose jersey with elastane",
    careInstructions: "Machine wash cold. Tumble dry low or hang dry.",
    featured: false,
    soldCount: 720,
    imageUrl: "/images/products/jersey-underscarf.webp",
    variants: colorVariants(
      "AMD-JUS",
      ["Taupe", "Espresso", "Black"],
      [100, 100, 100]
    ),
  },
  {
    name: "Everyday Pin Set",
    slug: "everyday-pin-set",
    sku: "AMD-EPS",
    shortDescription: "Snag-free pins in everyday metallic finishes.",
    description:
      "A curated set of 12 hijab pins in gold, silver and rose-gold finishes — slim, snag-free " +
      "and kind to delicate fabrics. Presented in a reusable tin.",
    price: 450,
    categorySlug: "accessories",
    collectionSlugs: [],
    colors: [],
    material: "Stainless steel pins with enamel coating",
    careInstructions: "Wipe clean with a dry cloth. Store dry.",
    featured: false,
    soldCount: 540,
    imageUrl: "/images/products/everyday-pin-set.webp",
    variants: [
      {
        name: "One Size",
        size: "One Size",
        sku: "AMD-EPS-OS",
        sortOrder: 1,
        quantity: 200,
      },
    ],
  },
  {
    name: "Lightweight Niqab",
    slug: "lightweight-niqab",
    sku: "AMD-LNQ",
    shortDescription: "Breathable single-layer niqab with adjustable ties.",
    description:
      "A featherlight single-layer niqab in soft, breathable fabric with a wide eye opening " +
      "and long adjustable ties for a secure, comfortable fit.",
    price: 1200,
    compareAtPrice: 1500,
    categorySlug: "niqabs",
    collectionSlugs: [],
    colors: ["Black", "Espresso"],
    material: "Lightweight Japanese chiffon (100% polyester)",
    careInstructions: "Hand wash cold. Hang dry. Cool iron.",
    featured: false,
    soldCount: 310,
    imageUrl: "/images/products/lightweight-niqab.webp",
    variants: colorVariants("AMD-LNQ", ["Black", "Espresso"], [45, 45]),
  },
  {
    name: "Signature Modest Deal",
    slug: "signature-modest-deal",
    sku: "AMD-SMD",
    shortDescription: "Our most-loved hijab wardrobe, boxed and ready to gift.",
    description:
      "Two crinkle georgette hijabs, a jersey underscarf, the Everyday Pin Set and a reusable pouch — " +
      "presented in our signature gift box. A saving of PKR 701 versus buying each piece separately.",
    price: 2499,
    compareAtPrice: 3200,
    categorySlug: "gift-sets",
    collectionSlugs: ["signature-bundles"],
    colors: ["Ivory", "Taupe"],
    material: "Crinkle georgette hijabs; cotton-blend jersey underscarf",
    careInstructions: "Hand wash cold. Hang dry in shade.",
    featured: true,
    soldCount: 480,
    imageUrl: "/images/products/signature-modest-deal.webp",
    variants: colorVariants("AMD-SMD", ["Ivory", "Taupe"], [50, 50]),
  },
  {
    name: "The Gift Edit",
    slug: "gift-edit",
    sku: "AMD-TGE",
    shortDescription: "A ready-to-give modest edit in our signature box.",
    description:
      "One crinkle georgette hijab, a jersey underscarf and the Everyday Pin Set, nestled in our " +
      "signature gift box with a hand-written style card. The effortless gift for someone you love.",
    price: 1999,
    categorySlug: "gift-sets",
    collectionSlugs: ["gift-edit"],
    colors: ["Blush", "Ivory"],
    material: "Crinkle georgette hijab; cotton-blend jersey underscarf",
    careInstructions: "Hand wash cold. Hang dry in shade.",
    featured: true,
    soldCount: 390,
    imageUrl: "/images/products/gift-edit.webp",
    variants: colorVariants("AMD-TGE", ["Blush", "Ivory"], [40, 40]),
  },
  {
    name: "Premium Modest Bundle",
    slug: "premium-modest-bundle",
    sku: "AMD-PMB",
    shortDescription: "Three hijabs, two underscarves and pins — the full wardrobe.",
    description:
      "The complete modest wardrobe: three crinkle georgette hijabs, two jersey underscarves, " +
      "the Everyday Pin Set and a reusable pouch in our signature box. " +
      "A saving of PKR 801 versus buying each piece separately.",
    price: 3499,
    compareAtPrice: 4300,
    categorySlug: "deals",
    collectionSlugs: ["signature-bundles"],
    colors: ["Taupe", "Olive"],
    material: "Crinkle georgette hijabs; cotton-blend jersey underscarves",
    careInstructions: "Hand wash cold. Hang dry in shade. Cool iron.",
    featured: false,
    soldCount: 265,
    imageUrl: "/images/products/premium-modest-bundle.webp",
    variants: colorVariants("AMD-PMB", ["Taupe", "Olive"], [30, 30]),
  },
  {
    name: "Aurélia Silk Scarf",
    slug: "aurelia-silk-scarf",
    sku: "AMD-AUS",
    shortDescription: "Pure mulberry silk scarf in champagne gold.",
    description:
      "A whisper of champagne-gold silk, finished with hand-rolled edges. Drapes effortlessly " +
      "as a hijab, a wrap, or an evening stole — the maison's signature in its purest form.",
    price: 4850,
    categorySlug: "accessories",
    collectionSlugs: [],
    colors: ["Champagne Gold"],
    material: "Pure mulberry silk, hand-rolled edges",
    careInstructions:
      "Dry clean recommended. If hand washing, use cold water and mild silk detergent. Hang dry in shade.",
    featured: true,
    soldCount: 0,
    imageUrl: "/images/products/aurelia-silk-scarf.webp",
    variants: [
      {
        name: "One Size",
        color: "Champagne Gold",
        size: "One Size",
        sku: "AMD-AUS-CHA-OS",
        sortOrder: 1,
        quantity: 50,
      },
    ],
  },
  {
    name: "Noir Élégance Handbag",
    slug: "noir-elegance-handbag",
    sku: "AMD-NEH",
    shortDescription: "Structured black leather handbag with gold hardware.",
    description:
      "A structured silhouette in deep black pebbled leather, crowned with a sculptural gold " +
      "top handle and lock. Carries the day into the evening without missing a beat.",
    price: 18500,
    categorySlug: "accessories",
    collectionSlugs: [],
    colors: ["Black"],
    material: "Pebbled leather, polished gold hardware",
    careInstructions:
      "Wipe clean with a soft dry cloth. Store in the dust bag, away from direct sunlight.",
    featured: false,
    soldCount: 0,
    imageUrl: "/images/products/noir-elegance-handbag.webp",
    variants: [
      {
        name: "One Size",
        color: "Black",
        size: "One Size",
        sku: "AMD-NEH-BLA-OS",
        sortOrder: 1,
        quantity: 25,
      },
    ],
  },
  {
    name: "Lune d'Or Necklace",
    slug: "lune-dor-necklace",
    sku: "AMD-LDN",
    shortDescription: "Fine gold chain with a delicate crescent pendant.",
    description:
      "A fine gold chain bearing a delicate crescent pendant — a quiet signature of the maison. " +
      "Made to be layered, or worn alone against black.",
    price: 9750,
    categorySlug: "accessories",
    collectionSlugs: [],
    colors: ["Gold"],
    material: "Gold chain with crescent pendant",
    careInstructions:
      "Wipe clean with a soft dry cloth. Store separately to avoid tangling.",
    featured: false,
    soldCount: 0,
    imageUrl: "/images/products/lune-dor-necklace.webp",
    variants: [
      {
        name: "One Size",
        color: "Gold",
        size: "One Size",
        sku: "AMD-LDN-GOL-OS",
        sortOrder: 1,
        quantity: 40,
      },
    ],
  },
  {
    name: "Éclat Pearl Earrings",
    slug: "eclat-pearl-earrings",
    sku: "AMD-EPE",
    shortDescription: "Freshwater pearl earrings on polished gold hooks.",
    description:
      "Lustrous freshwater pearls suspended from polished gold hooks. Understated by day, " +
      "luminous by night — light, caught and kept.",
    price: 6200,
    categorySlug: "accessories",
    collectionSlugs: [],
    colors: ["Pearl / Gold"],
    material: "Freshwater pearls, polished gold hooks",
    careInstructions:
      "Wipe pearls with a soft damp cloth after wear. Keep away from perfume and hairspray.",
    featured: false,
    soldCount: 0,
    imageUrl: "/images/products/eclat-pearl-earrings.webp",
    variants: [
      {
        name: "One Size",
        color: "Pearl / Gold",
        size: "One Size",
        sku: "AMD-EPE-PEA-OS",
        sortOrder: 1,
        quantity: 40,
      },
    ],
  },
  {
    name: "Souveraine Watch",
    slug: "souveraine-watch",
    sku: "AMD-SWW",
    shortDescription: "Black dial watch in a polished gold case.",
    description:
      "A black dial set in a polished gold case on supple black leather. Minimal, precise, " +
      "and quietly assured — time, kept beautifully.",
    price: 24000,
    categorySlug: "accessories",
    collectionSlugs: [],
    colors: ["Black / Gold"],
    material: "Black dial, polished gold case, leather strap",
    careInstructions:
      "Wipe the case with a soft cloth. Keep away from water and strong magnets.",
    featured: false,
    soldCount: 0,
    imageUrl: "/images/products/souveraine-watch.webp",
    variants: [
      {
        name: "One Size",
        color: "Black / Gold",
        size: "One Size",
        sku: "AMD-SWW-BLA-OS",
        sortOrder: 1,
        quantity: 20,
      },
    ],
  },
  {
    name: "Minuit Velvet Clutch",
    slug: "minuit-velvet-clutch",
    sku: "AMD-MVC",
    shortDescription: "Midnight-black velvet clutch with an ornate gold clasp.",
    description:
      "Midnight-black velvet closed with an ornate gold clasp — the evening companion for " +
      "occasions that matter. Small in size, certain in presence.",
    price: 12900,
    categorySlug: "accessories",
    collectionSlugs: [],
    colors: ["Black"],
    material: "Cotton velvet, ornate gold clasp",
    careInstructions:
      "Brush gently with a soft clothes brush. Store in the dust bag.",
    featured: false,
    soldCount: 0,
    imageUrl: "/images/products/minuit-velvet-clutch.webp",
    variants: [
      {
        name: "One Size",
        color: "Black",
        size: "One Size",
        sku: "AMD-MVC-BLA-OS",
        sortOrder: 1,
        quantity: 30,
      },
    ],
  },
  {
    name: "Héritage Belt",
    slug: "heritage-belt",
    sku: "AMD-HBT",
    shortDescription: "Full-grain calfskin belt with a brushed gold buckle.",
    description:
      "Full-grain black calfskin with a brushed gold buckle. Cut clean and built to last — " +
      "the quiet anchor of a considered wardrobe.",
    price: 5400,
    categorySlug: "accessories",
    collectionSlugs: [],
    colors: ["Black"],
    material: "Full-grain calfskin, brushed gold buckle",
    careInstructions:
      "Wipe with a dry cloth. Condition the leather occasionally. Store flat or hung.",
    featured: false,
    soldCount: 0,
    imageUrl: "/images/products/heritage-belt.webp",
    variants: [
      {
        name: "One Size",
        color: "Black",
        size: "One Size",
        sku: "AMD-HBT-BLA-OS",
        sortOrder: 1,
        quantity: 40,
      },
    ],
  },
  {
    name: "Céleste Sunglasses",
    slug: "celeste-sunglasses",
    sku: "AMD-CSG",
    shortDescription: "Bold black acetate sunglasses with gold detailing.",
    description:
      "Bold black acetate softened by gold temple detailing. Sculptural shade for bright days — " +
      "worn with everything, noticed by everyone.",
    price: 11300,
    categorySlug: "accessories",
    collectionSlugs: [],
    colors: ["Black / Gold"],
    material: "Black acetate, gold temple detailing",
    careInstructions:
      "Clean lenses with a microfibre cloth. Store in the hard case.",
    featured: false,
    soldCount: 0,
    imageUrl: "/images/products/celeste-sunglasses.webp",
    variants: [
      {
        name: "One Size",
        color: "Black / Gold",
        size: "One Size",
        sku: "AMD-CSG-BLA-OS",
        sortOrder: 1,
        quantity: 35,
      },
    ],
  },
];

interface SeedCoupon {
  code: string;
  type: CouponType;
  value: number;
  minimumOrderAmount: number;
  maximumDiscount?: number;
  usageLimit?: number;
  expiresInDays: number;
}

const COUPONS: SeedCoupon[] = [
  {
    code: "WELCOME10",
    type: CouponType.PERCENTAGE,
    value: 10,
    minimumOrderAmount: 1500,
    maximumDiscount: 1000,
    usageLimit: 500,
    expiresInDays: 90,
  },
  {
    code: "FLAT500",
    type: CouponType.FIXED_AMOUNT,
    value: 500,
    minimumOrderAmount: 3000,
    usageLimit: 200,
    expiresInDays: 60,
  },
  {
    code: "BUNDLE20",
    type: CouponType.PERCENTAGE,
    value: 20,
    minimumOrderAmount: 5000,
    maximumDiscount: 2000,
    usageLimit: 100,
    expiresInDays: 30,
  },
];

/* ------------------------------------------------------------------ */
/* Seed                                                                */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const [adminHash, demoHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS),
    bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS),
  ]);

  // Provision single admin account:
  // If an ADMIN user already exists (whether under ADMIN_EMAIL or an updated email),
  // preserve their password and credentials so redeployments never overwrite
  // dashboard-managed passwords.
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  if (!existingAdmin) {
    await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: {
        name: "Anilliea Admin",
        role: Role.ADMIN,
        emailVerified: true,
        passwordHash: adminHash,
      },
      create: {
        email: ADMIN_EMAIL,
        passwordHash: adminHash,
        name: "Anilliea Admin",
        role: Role.ADMIN,
        emailVerified: true,
      },
    });
  } else {
    // If admin exists, ensure their role is confirmed ADMIN and email is verified
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        role: Role.ADMIN,
        emailVerified: true,
      },
    });
  }

  const customer = await prisma.user.upsert({
    where: { email: DEMO_CUSTOMER_EMAIL },
    update: {
      name: "Ayesha Khan",
      role: Role.CUSTOMER,
      emailVerified: true,
      passwordHash: demoHash,
    },
    create: {
      email: DEMO_CUSTOMER_EMAIL,
      passwordHash: demoHash,
      name: "Ayesha Khan",
      role: Role.CUSTOMER,
      emailVerified: true,
    },
  });

  // Single demo address — delete + recreate keeps the seed idempotent.
  await prisma.address.deleteMany({ where: { userId: customer.id } });
  await prisma.address.create({
    data: {
      userId: customer.id,
      label: "Home",
      fullName: "Ayesha Khan",
      phone: "0300 1234567",
      addressLine1: "House 12, Street 5, DHA Phase 6",
      city: "Karachi",
      province: "Sindh",
      postalCode: "75500",
      country: "Pakistan",
      isDefault: true,
    },
  });

  // -- Categories & collections ---------------------------------------
  const categoryIds = new Map<string, string>();
  for (const c of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        description: c.description,
        sortOrder: c.sortOrder,
        active: true,
      },
      create: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        sortOrder: c.sortOrder,
        active: true,
      },
    });
    categoryIds.set(c.slug, category.id);
  }

  const collectionIds = new Map<string, string>();
  for (const c of COLLECTIONS) {
    const collection = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        description: c.description,
        sortOrder: c.sortOrder,
        active: true,
      },
      create: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        sortOrder: c.sortOrder,
        active: true,
      },
    });
    collectionIds.set(c.slug, collection.id);
  }

  // -- Products --------------------------------------------------------
  for (const p of PRODUCTS) {
    const categoryId = categoryIds.get(p.categorySlug);
    if (!categoryId) {
      throw new Error(`[seed] Unknown category slug: ${p.categorySlug}`);
    }

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        shortDescription: p.shortDescription,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        sku: p.sku,
        categoryId,
        colors: p.colors,
        material: p.material,
        careInstructions: p.careInstructions,
        featured: p.featured,
        published: true,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.shortDescription,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        sku: p.sku,
        categoryId,
        colors: p.colors,
        material: p.material,
        careInstructions: p.careInstructions,
        featured: p.featured,
        published: true,
        soldCount: p.soldCount,
      },
    });

    // Images — delete + recreate (no natural unique key on ProductImage).
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: p.imageUrl ?? `/images/products/${p.slug}.svg`,
        alt: p.name,
        sortOrder: 1,
      },
    });

    // Variants + inventory.
    for (const v of p.variants) {
      const variant = await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          name: v.name,
          color: v.color ?? null,
          size: v.size ?? null,
          active: true,
          sortOrder: v.sortOrder,
          productId: product.id,
        },
        create: {
          productId: product.id,
          name: v.name,
          color: v.color,
          size: v.size,
          sku: v.sku,
          active: true,
          sortOrder: v.sortOrder,
        },
      });

      await prisma.inventory.upsert({
        where: { variantId: variant.id },
        update: {
          quantity: v.quantity,
          lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
        },
        create: {
          productId: product.id,
          variantId: variant.id,
          quantity: v.quantity,
          reserved: 0,
          lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
        },
      });
    }

    // Collection memberships (composite id => upsert).
    for (const collectionSlug of p.collectionSlugs) {
      const collectionId = collectionIds.get(collectionSlug);
      if (!collectionId) {
        throw new Error(`[seed] Unknown collection slug: ${collectionSlug}`);
      }
      await prisma.productCollection.upsert({
        where: {
          productId_collectionId: { productId: product.id, collectionId },
        },
        update: {},
        create: { productId: product.id, collectionId },
      });
    }
  }

  // -- Coupons ----------------------------------------------------------
  const now = new Date();
  for (const c of COUPONS) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {
        type: c.type,
        value: c.value,
        minimumOrderAmount: c.minimumOrderAmount,
        maximumDiscount: c.maximumDiscount ?? null,
        usageLimit: c.usageLimit ?? null,
        startDate: now,
        expiryDate: new Date(
          now.getTime() + c.expiresInDays * 24 * 60 * 60 * 1000
        ),
        active: true,
      },
      create: {
        code: c.code,
        type: c.type,
        value: c.value,
        minimumOrderAmount: c.minimumOrderAmount,
        maximumDiscount: c.maximumDiscount,
        usageLimit: c.usageLimit,
        usedCount: 0,
        startDate: now,
        expiryDate: new Date(
          now.getTime() + c.expiresInDays * 24 * 60 * 60 * 1000
        ),
        active: true,
      },
    });
  }

  // -- Summary -----------------------------------------------------------
  const [userCount, categoryCount, collectionCount, productCount, variantCount, couponCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.collection.count(),
      prisma.product.count(),
      prisma.productVariant.count(),
      prisma.coupon.count(),
    ]);

  console.log("[seed] ANILLIÉA database seeded successfully:");
  console.log(`[seed]   users:       ${userCount} (admin: ${ADMIN_EMAIL}, demo: ${DEMO_CUSTOMER_EMAIL})`);
  console.log(`[seed]   categories:  ${categoryCount}`);
  console.log(`[seed]   collections: ${collectionCount}`);
  console.log(`[seed]   products:    ${productCount}`);
  console.log(`[seed]   variants:    ${variantCount}`);
  console.log(`[seed]   coupons:     ${couponCount} (WELCOME10, FLAT500, BUNDLE20)`);
}

main()
  .catch((e: unknown) => {
    console.error("[seed] Failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
