"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { categories, combos, dailyDeals, pools, poolItems, products, settings, testimonials } from "@/db/schema";
import { endOfTodaySast } from "./deals";
import { seedDatabase } from "@/db/seed";
import { CATEGORY_GROUP_SLUGS } from "./category-groups";
import { SITE_IMAGE_KEYS, type SiteImageKey } from "./site-images";

export async function resetToDemoData() {
  await seedDatabase(true);
  revalidatePath("/", "layout");
}

function str(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback).trim();
}

function num(formData: FormData, key: string, fallback = 0) {
  const value = Number(String(formData.get(key) ?? "").replace(/,/g, "."));
  return Number.isFinite(value) ? value : fallback;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function centsFromRand(formData: FormData, key: string) {
  const value = str(formData, key);
  if (!value) return null;
  const number = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) ? Math.round(number * 100) : null;
}

function splitLines(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function fallbackSlug(value: string) {
  const base = value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return base || `product-${Date.now().toString(36)}`;
}

function productPayload(formData: FormData) {
  const name = str(formData, "name");
  const slug = fallbackSlug(str(formData, "slug") || name);
  const price = centsFromRand(formData, "price") ?? 0;
  const compareAt = centsFromRand(formData, "compareAt");
  const images = splitLines(str(formData, "images"));

  const cost = centsFromRand(formData, "cost");
  return {
    slug,
    name,
    brand: str(formData, "brand"),
    categorySlug: str(formData, "categorySlug", "sneakers"),
    description: str(formData, "description"),
    details: splitLines(str(formData, "details")),
    images: images.length ? images : ["/images/hero.jpg"],
    sizes: splitLines(str(formData, "sizes", "One Size")),
    colorway: str(formData, "colorway"),
    priceCents: price,
    compareAtCents: compareAt,
    costCents: cost ?? Math.round(price * 0.62),
    rating: Math.max(1, Math.min(5, num(formData, "rating", 4.8))),
    reviewCount: Math.max(0, Math.round(num(formData, "reviewCount", 0))),
    stock: Math.max(0, Math.round(num(formData, "stock", 0))),
    isFeatured: bool(formData, "isFeatured"),
    isNew: bool(formData, "isNew"),
  };
}

export async function createProduct(formData: FormData) {
  const payload = productPayload(formData);
  if (!payload.name || !payload.brand || payload.priceCents <= 0) return;
  await db.insert(products).values(payload);
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}

// Bulk-add products from a zip of already-renamed images, all at one price.
// Called directly from the BulkZipUpload client component (not a <form action>,
// since it takes an array built in the browser after unzipping + uploading each file).
// Brand is per-item (detected from each filename in the browser); fallbackBrand only
// covers an item whose own brand came back blank.
export async function bulkCreateProducts(input: {
  fallbackBrand?: string;
  categorySlug: string;
  priceCents: number; // fallback/batch price — used for any item without its own priceCents
  stock: number;
  sizes?: string[]; // batch-wide sizes — used for any item without its own sizes
  items: {
    name: string;
    brand?: string;
    imageUrl: string;
    priceCents?: number;
    details?: string[];
    sizes?: string[];
    // Per-size pricing (e.g. { "10": 1000, "12": 1200 } in RAND, not cents —
    // converted below). One item + this map = ONE product with a size dropdown,
    // each size charging its own price, instead of a flat price for every size.
    sizePricing?: Record<string, number>;
  }[];
}) {
  const fallbackBrand = (input.fallbackBrand ?? "").trim() || "Unbranded";
  const categorySlug = input.categorySlug.trim() || "sneakers";
  const batchPriceCents = Math.round(input.priceCents) || 0;
  const stock = Math.max(0, Math.round(input.stock));
  const batchSizes = (input.sizes ?? []).map((s) => s.trim()).filter(Boolean);

  const seenSlugs = new Set<string>();
  const rows = input.items
    .map((item) => {
      const sizePricingCents = item.sizePricing
        ? Object.fromEntries(
            Object.entries(item.sizePricing)
              .map(([size, rand]) => [size.trim(), Math.round(Number(rand) * 100)] as const)
              .filter(([size, cents]) => size && Number.isFinite(cents) && cents > 0),
          )
        : null;
      const sizePricingSizes = sizePricingCents ? Object.keys(sizePricingCents) : [];
      // Headline price is the cheapest size when sizePricing is used — that's what
      // shows on product cards ("From RXXX") and is charged if a size somehow has
      // no entry in the map.
      const cheapestSizePrice = sizePricingSizes.length
        ? Math.min(...Object.values(sizePricingCents!))
        : null;

      return {
        name: item.name.trim(),
        brand: item.brand?.trim() || fallbackBrand,
        imageUrl: item.imageUrl.trim(),
        priceCents:
          cheapestSizePrice ??
          (item.priceCents && item.priceCents > 0 ? Math.round(item.priceCents) : batchPriceCents),
        details: (item.details ?? []).map((d) => d.trim()).filter(Boolean),
        sizes: sizePricingSizes.length
          ? sizePricingSizes
          : (item.sizes ?? []).map((s) => s.trim()).filter(Boolean),
        sizePricing: sizePricingCents,
      };
    })
    .filter((item) => item.name && item.imageUrl && item.priceCents > 0)
    .map((item) => {
      let slug = fallbackSlug(item.name);
      while (seenSlugs.has(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
      seenSlugs.add(slug);
      return {
        slug,
        name: item.name,
        brand: item.brand,
        categorySlug,
        description: item.name,
        details: item.details,
        images: [item.imageUrl],
        sizes: item.sizes.length ? item.sizes : batchSizes.length ? batchSizes : ["One Size"],
        sizePricing: item.sizePricing,
        colorway: "",
        priceCents: item.priceCents,
        compareAtCents: null,
        costCents: Math.round(item.priceCents * 0.62),
        rating: 4.8,
        reviewCount: 0,
        stock,
        isFeatured: false,
        isNew: true,
      };
    });

  if (!rows.length) return { created: 0 };

  await db.insert(products).values(rows).onConflictDoNothing();
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  return { created: rows.length };
}

export async function updateProduct(formData: FormData) {
  const id = Math.round(num(formData, "id"));
  if (!id) return;
  const payload = productPayload(formData);
  await db.update(products).set(payload).where(eq(products.id, id));
  revalidatePath("/admin/products");
  revalidatePath(`/product/${payload.slug}`);
  revalidatePath("/shop");
  revalidatePath("/");
}

export async function deleteProduct(formData: FormData) {
  const id = Math.round(num(formData, "id"));
  if (!id) return;
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}

export async function adjustStock(formData: FormData) {
  const id = Math.round(num(formData, "id"));
  const stock = Math.max(0, Math.round(num(formData, "stock")));
  if (!id) return;
  await db.update(products).set({ stock }).where(eq(products.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

// Moves a batch of products to one category in a single query — the "Bulk move" picker
// on the products page sends the checked product IDs as a comma-separated hidden field,
// same pattern as createPool's productIds field.
export async function bulkUpdateCategory(formData: FormData): Promise<void> {
  const categorySlug = str(formData, "categorySlug");
  const productIds = Array.from(
    new Set(
      str(formData, "productIds")
        .split(",")
        .map((value) => Math.round(Number(value)))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );
  if (!categorySlug || productIds.length === 0) return;

  await db.update(products).set({ categorySlug }).where(inArray(products.id, productIds));
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}

// Saves one site marketing photo (hero, home banner, or about photo) into the
// generic settings key/value table. Called directly from the Settings page's
// upload widget (like bulkCreateProducts, this is a server action invoked
// straight from a client component rather than through a <form action>).
export async function updateSiteImage(key: SiteImageKey, url: string) {
  const trimmed = url.trim();
  if (!trimmed) return { ok: false };
  await db
    .insert(settings)
    .values({ key: SITE_IMAGE_KEYS[key], value: trimmed })
    .onConflictDoUpdate({ target: settings.key, set: { value: trimmed, updatedAt: new Date() } });
  revalidatePath("/", "layout");
  revalidatePath("/about");
  revalidatePath("/tshidi");
  return { ok: true };
}

export async function createCategory(formData: FormData) {
  const name = str(formData, "name");
  const slug = fallbackSlug(str(formData, "slug") || name);
  const requestedGroup = str(formData, "groupSlug");
  const groupSlug = CATEGORY_GROUP_SLUGS.includes(requestedGroup) ? requestedGroup : CATEGORY_GROUP_SLUGS[0];
  if (!name) return;
  await db
    .insert(categories)
    .values({
      name,
      slug,
      tagline: str(formData, "tagline", "Curated by Tshidi"),
      imageUrl: str(formData, "imageUrl", "/images/hero.jpg"),
      sortOrder: Math.round(num(formData, "sortOrder", 99)),
      groupSlug,
    })
    .onConflictDoNothing();
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}

// Reassigns an EXISTING category — name, tagline, image, sort order, and crucially
// which department (groupSlug) it nests under. createCategory only ever adds new
// rows; this is what lets a wrongly-grouped subcategory (e.g. one that defaulted to
// "shoes" before groupSlug existed) actually get moved to the right department
// without touching the database directly.
export async function updateCategory(formData: FormData) {
  const id = Math.round(num(formData, "id"));
  if (!id) return;
  const name = str(formData, "name");
  if (!name) return;
  const requestedGroup = str(formData, "groupSlug");
  const groupSlug = CATEGORY_GROUP_SLUGS.includes(requestedGroup) ? requestedGroup : CATEGORY_GROUP_SLUGS[0];
  await db
    .update(categories)
    .set({
      name,
      tagline: str(formData, "tagline", "Curated by Tshidi"),
      imageUrl: str(formData, "imageUrl", "/images/hero.jpg"),
      sortOrder: Math.round(num(formData, "sortOrder", 0)),
      groupSlug,
    })
    .where(eq(categories.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}

export async function createTestimonial(formData: FormData) {
  await db.insert(testimonials).values({
    customerName: str(formData, "customerName"),
    location: str(formData, "location"),
    quote: str(formData, "quote"),
    rating: Math.max(1, Math.min(5, Math.round(num(formData, "rating", 5)))),
    imageUrl: str(formData, "imageUrl"),
    productName: str(formData, "productName"),
    sortOrder: Math.round(num(formData, "sortOrder", 0)),
    isLive: bool(formData, "isLive"),
  });
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

export async function updateTestimonial(formData: FormData) {
  const id = Math.round(num(formData, "id"));
  if (!id) return;
  await db
    .update(testimonials)
    .set({
      customerName: str(formData, "customerName"),
      location: str(formData, "location"),
      quote: str(formData, "quote"),
      rating: Math.max(1, Math.min(5, Math.round(num(formData, "rating", 5)))),
      imageUrl: str(formData, "imageUrl"),
      productName: str(formData, "productName"),
      sortOrder: Math.round(num(formData, "sortOrder", 0)),
      isLive: bool(formData, "isLive"),
    })
    .where(eq(testimonials.id, id));
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

export async function toggleTestimonial(formData: FormData) {
  const id = Math.round(num(formData, "id"));
  const isLive = bool(formData, "isLive");
  if (!id) return;
  await db.update(testimonials).set({ isLive }).where(eq(testimonials.id, id));
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

export async function deleteTestimonial(formData: FormData) {
  const id = Math.round(num(formData, "id"));
  if (!id) return;
  await db.delete(testimonials).where(eq(testimonials.id, id));
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

export async function markOrderStatus(formData: FormData) {
  const orderId = Math.round(num(formData, "orderId"));
  const status = str(formData, "status", "pending");
  if (!orderId) return;
  const { orders } = await import("@/db/schema");
  await db.update(orders).set({ status }).where(and(eq(orders.id, orderId)));
  revalidatePath("/admin");
}

export async function recordInstallment(formData: FormData) {
  const orderId = Math.round(num(formData, "orderId"));
  if (!orderId) return;
  const { orders } = await import("@/db/schema");
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || order.paymentMethod !== "laybye") return;

  const paid = Math.min(3, order.installmentsPaid + 1);
  await db
    .update(orders)
    .set({
      installmentsPaid: paid,
      status: paid >= 3 ? "paid" : "laybye",
    })
    .where(eq(orders.id, orderId));

  revalidatePath("/admin", "layout");
  revalidatePath(`/order/${order.orderNumber}`);
}

export async function activateDailyDeal(formData: FormData) {
  const scope = str(formData, "scope", "product") === "store" ? "store" : "product";
  const percentOff = Math.min(90, Math.max(5, Math.round(num(formData, "percentOff", 20))));
  const productId = scope === "product" ? Math.round(num(formData, "productId")) : null;
  if (scope === "product" && !productId) return;

  await db.update(dailyDeals).set({ active: false });
  await db.insert(dailyDeals).values({
    productId,
    scope,
    percentOff,
    endsAt: endOfTodaySast(),
    active: true,
  });
  revalidatePath("/", "layout");
}

export async function endDailyDeal(formData: FormData) {
  const id = Math.round(num(formData, "id"));
  if (!id) return;
  await db.update(dailyDeals).set({ active: false }).where(eq(dailyDeals.id, id));
  revalidatePath("/", "layout");
}

// ---------------- Combo / bundle deals ----------------
// "Buy both, save X%" — admin picks two products and a percent off. The discount only
// ever fires when a cart already has both products in it, and since neither product can
// be added past its own stock (and sells out normally like anything else), the combo is
// automatically limited to whatever stock was uploaded for the two items — no separate
// stock field to manage.

export async function createCombo(formData: FormData) {
  const productAId = Math.round(num(formData, "productAId"));
  const productBId = Math.round(num(formData, "productBId"));
  const percentOff = Math.min(90, Math.max(5, Math.round(num(formData, "percentOff", 15))));
  if (!productAId || !productBId || productAId === productBId) return;
  await db.insert(combos).values({ productAId, productBId, percentOff, active: true });
  revalidatePath("/", "layout");
}

export async function toggleCombo(formData: FormData) {
  const id = Math.round(num(formData, "id"));
  const active = bool(formData, "active");
  if (!id) return;
  await db.update(combos).set({ active }).where(eq(combos.id, id));
  revalidatePath("/", "layout");
}

export async function deleteCombo(formData: FormData) {
  const id = Math.round(num(formData, "id"));
  if (!id) return;
  await db.delete(combos).where(eq(combos.id, id));
  revalidatePath("/", "layout");
}

// ---------------- Pool deals ----------------
// "Bulk-select a pool of products, any N of them together get a deal" — the picker on
// the admin page sends the chosen product IDs as a comma-separated hidden field.

export async function createPool(formData: FormData) {
  const name = str(formData, "name");
  const discountType = str(formData, "discountType", "percent") === "fixed" ? "fixed" : "percent";
  const pickCount = Math.max(1, Math.min(10, Math.round(num(formData, "pickCount", 2))));
  const productIds = Array.from(
    new Set(
      str(formData, "productIds")
        .split(",")
        .map((value) => Math.round(Number(value)))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );
  if (!name || productIds.length < 1) return;

  let percentOff: number | null = null;
  let fixedPriceCents: number | null = null;
  if (discountType === "fixed") {
    fixedPriceCents = centsFromRand(formData, "fixedPrice");
    if (!fixedPriceCents || fixedPriceCents <= 0) return;
  } else {
    percentOff = Math.min(90, Math.max(1, Math.round(num(formData, "percentOff", 10))));
  }

  const [pool] = await db
    .insert(pools)
    .values({ name, discountType, percentOff, fixedPriceCents, pickCount, active: true })
    .returning();
  await db.insert(poolItems).values(productIds.map((productId) => ({ poolId: pool.id, productId })));
  revalidatePath("/", "layout");
}

export async function togglePool(formData: FormData) {
  const id = Math.round(num(formData, "id"));
  const active = bool(formData, "active");
  if (!id) return;
  await db.update(pools).set({ active }).where(eq(pools.id, id));
  revalidatePath("/", "layout");
}

export async function deletePool(formData: FormData) {
  const id = Math.round(num(formData, "id"));
  if (!id) return;
  await db.delete(poolItems).where(eq(poolItems.poolId, id));
  await db.delete(pools).where(eq(pools.id, id));
  revalidatePath("/", "layout");
}
