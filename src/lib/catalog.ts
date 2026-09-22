import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, type Product } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { getActiveDeal } from "./deals";
import { comboProductIdSet, getActiveCombos } from "./combos";
import { poolProductIdSet, getActivePools } from "./pools";

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "rating" | "popular";

export type ProductQuery = {
  // A single subcategory slug, or a list of subcategory slugs (e.g. every subcategory
  // under one department) to match any of.
  category?: string | string[];
  q?: string;
  brands?: string[];
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;
};

export async function getCategories() {
  await ensureSeeded();
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function getCategory(slug: string) {
  await ensureSeeded();
  const [row] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return row ?? null;
}

export async function getBrands() {
  await ensureSeeded();
  const rows = await db
    .select({ brand: products.brand, count: sql<number>`count(*)::int` })
    .from(products)
    .groupBy(products.brand)
    .orderBy(asc(products.brand));
  return rows;
}

export type OnSaleIds = { storewide: boolean; ids: number[] };

/**
 * Everything that currently counts as "on sale" beyond a manually-set compareAtCents:
 * the product targeted by today's product-scoped discount (if any), or every product
 * if today's discount is storewide, plus every product that's part of an active combo
 * or pool deal (shown so shoppers can find the deal, even before it actually triggers).
 */
export async function getOnSaleProductIds(): Promise<OnSaleIds> {
  const [deal, activeCombos, activePools] = await Promise.all([
    getActiveDeal(),
    getActiveCombos(),
    getActivePools(),
  ]);
  if (deal?.scope === "store") return { storewide: true, ids: [] };
  const ids = comboProductIdSet(activeCombos);
  for (const id of poolProductIdSet(activePools)) ids.add(id);
  if (deal?.scope === "product" && deal.productId) ids.add(deal.productId);
  return { storewide: false, ids: Array.from(ids) };
}

function buildFilters(query: ProductQuery, sale?: OnSaleIds) {
  const filters = [];

  if (query.category) {
    filters.push(
      Array.isArray(query.category)
        ? inArray(products.categorySlug, query.category)
        : eq(products.categorySlug, query.category),
    );
  }

  if (query.q) {
    const term = `%${query.q}%`;
    filters.push(
      or(
        ilike(products.name, term),
        ilike(products.brand, term),
        ilike(products.description, term),
        ilike(products.categorySlug, term),
      ),
    );
  }

  if (query.brands?.length) filters.push(inArray(products.brand, query.brands));

  if (query.sizes?.length) {
    const sizeList = sql.join(
      query.sizes.map((size) => sql`${size}`),
      sql`, `,
    );
    filters.push(
      sql`EXISTS (SELECT 1 FROM jsonb_array_elements_text(${products.sizes}) AS elem WHERE elem IN (${sizeList}))`,
    );
  }

  if (typeof query.minPrice === "number") filters.push(gte(products.priceCents, query.minPrice));
  if (typeof query.maxPrice === "number") filters.push(lte(products.priceCents, query.maxPrice));
  if (query.onSale && !sale?.storewide) {
    filters.push(
      sale?.ids.length
        ? or(isNotNull(products.compareAtCents), inArray(products.id, sale.ids))
        : isNotNull(products.compareAtCents),
    );
  }

  return filters.length ? and(...filters) : undefined;
}

function orderFor(sort: SortKey | undefined) {
  switch (sort) {
    case "price-asc":
      return [asc(products.priceCents)];
    case "price-desc":
      return [desc(products.priceCents)];
    case "rating":
      return [desc(products.rating), desc(products.reviewCount)];
    case "popular":
      return [desc(products.soldCount)];
    case "newest":
      return [desc(products.isNew), desc(products.id)];
    default:
      return [desc(products.isFeatured), desc(products.soldCount), desc(products.id)];
  }
}

export async function searchProducts(query: ProductQuery) {
  await ensureSeeded();
  const page = Math.max(1, query.page ?? 1);
  const perPage = query.perPage ?? 12;
  const sale = query.onSale ? await getOnSaleProductIds() : undefined;
  const where = buildFilters(query, sale);

  const items = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(...orderFor(query.sort))
    .limit(perPage)
    .offset((page - 1) * perPage);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(where);

  const total = countRow?.count ?? 0;

  return {
    items,
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getProductBySlug(slug: string) {
  await ensureSeeded();
  const [row] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return row ?? null;
}

export async function getRelatedProducts(product: Product, limit = 4) {
  return db
    .select()
    .from(products)
    .where(and(eq(products.categorySlug, product.categorySlug), ne(products.id, product.id)))
    .orderBy(desc(products.soldCount))
    .limit(limit);
}

export async function getFeatured(limit = 8) {
  await ensureSeeded();
  return db
    .select()
    .from(products)
    .where(eq(products.isFeatured, true))
    .orderBy(desc(products.soldCount))
    .limit(limit);
}

export async function getNewArrivals(limit = 8) {
  await ensureSeeded();
  return db
    .select()
    .from(products)
    .orderBy(desc(products.isNew), desc(products.id))
    .limit(limit);
}

export async function getBestSellers(limit = 4) {
  await ensureSeeded();
  return db.select().from(products).orderBy(desc(products.soldCount)).limit(limit);
}

export async function getDeals(limit = 4) {
  await ensureSeeded();
  return db
    .select()
    .from(products)
    .where(isNotNull(products.compareAtCents))
    .orderBy(desc(products.soldCount))
    .limit(limit);
}

export async function getCategoryCounts() {
  await ensureSeeded();
  const rows = await db
    .select({ slug: products.categorySlug, count: sql<number>`count(*)::int` })
    .from(products)
    .groupBy(products.categorySlug);
  return new Map(rows.map((r) => [r.slug, r.count]));
}

export async function getProductsByIds(ids: number[]) {
  if (!ids.length) return [];
  return db.select().from(products).where(inArray(products.id, ids));
}
