import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import { categories, dailyDeals, products, settings, testimonials } from "./schema";
import { SIZE_SETS, px, seedCategories, seedProducts, seedTestimonials } from "./seed-data";
import { endOfTodaySast } from "../lib/deals";

const SEEDED_FLAG_KEY = "demo_data_seeded";

async function hasSeededBefore() {
  const [row] = await db.select().from(settings).where(eq(settings.key, SEEDED_FLAG_KEY)).limit(1);
  return Boolean(row);
}

async function markSeeded() {
  await db
    .insert(settings)
    .values({ key: SEEDED_FLAG_KEY, value: "true" })
    .onConflictDoUpdate({ target: settings.key, set: { value: "true", updatedAt: new Date() } });
}

/**
 * Seeds demo placeholder data — but only ONE time, ever, per database.
 *
 * This is gated on a flag in the `settings` table, not on "are there 0 products?".
 * That distinction matters: once you delete the placeholder products from the admin
 * panel (because they were just examples to show the design), this will NOT bring them
 * back, even though the products table is now empty again. Use `force` (the "Reset to
 * demo data" admin action) if you ever deliberately want the placeholders back.
 */
export async function seedDatabase(force = false) {
  if (!force && (await hasSeededBefore())) {
    return { seeded: false, reason: "already-seeded-before" as const };
  }

  if (force) {
    await db.execute(
      sql`TRUNCATE TABLE order_items, orders, cart_items, carts, products, categories, testimonials, daily_deals RESTART IDENTITY CASCADE`,
    );
  }

  await db.insert(categories).values(
    seedCategories.map((c) => ({
      slug: c.slug,
      name: c.name,
      tagline: c.tagline,
      imageUrl: px(c.image, 900, 1100),
      sortOrder: c.sortOrder,
      groupSlug: c.group,
    })),
  );

  await db.insert(products).values(
    seedProducts.map((p) => ({
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      categorySlug: p.category,
      description: p.description,
      details: p.details,
      images: p.images.map((id) => px(id, 1000, 1000)),
      sizes: [...SIZE_SETS[p.sizeSet]],
      colorway: p.colorway,
      priceCents: p.price * 100,
      compareAtCents: p.was ? p.was * 100 : null,
      costCents: Math.round(p.price * 100 * 0.62),
      rating: p.rating,
      reviewCount: p.reviews,
      stock: p.stock,
      isFeatured: Boolean(p.featured),
      isNew: Boolean(p.isNew),
      soldCount: p.sold,
    })),
  );

  await db.insert(testimonials).values(
    seedTestimonials.map((item) => ({
      customerName: item.customerName,
      location: item.location,
      quote: item.quote,
      rating: item.rating,
      imageUrl: px(item.image, 600, 600),
      productName: item.productName,
      sortOrder: item.sortOrder,
      isLive: true,
    })),
  );

  const [dealTarget] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, "jordan-1-retro-high-court-heat"))
    .limit(1);

  if (dealTarget) {
    await db.insert(dailyDeals).values({
      productId: dealTarget.id,
      percentOff: 25,
      endsAt: endOfTodaySast(),
      active: true,
    });
  }

  await markSeeded();

  return {
    seeded: true,
    products: seedProducts.length,
    testimonials: seedTestimonials.length,
    deal: dealTarget ? "jordan-1-retro-high-court-heat" : null,
  };
}

let seedPromise: Promise<unknown> | null = null;

/** Runs once per server process — seeds placeholder demo data on a brand-new database only. */
export async function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = seedDatabase().catch((error) => {
      seedPromise = null;
      console.error("[seed] failed", error);
      return null;
    });
  }
  await seedPromise;
}
