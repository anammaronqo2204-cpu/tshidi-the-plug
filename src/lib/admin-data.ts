import { asc, desc, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { combos, orderItems, orders, pools, poolItems, products, subscribers } from "@/db/schema";
import { getActiveDeal } from "./deals";

export async function getStats() {
  const [totals] = await db
    .select({
      orderCount: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
      shipping: sql<number>`coalesce(sum(${orders.shippingCents}), 0)::int`,
    })
    .from(orders);

  const [units] = await db
    .select({ sold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
    .from(orderItems);

  const [catalogue] = await db
    .select({
      productCount: sql<number>`count(*)::int`,
      stockUnits: sql<number>`coalesce(sum(${products.stock}), 0)::int`,
    })
    .from(products);

  const [subs] = await db.select({ count: sql<number>`count(*)::int` }).from(subscribers);

  const categoryBreakdown = await db
    .select({
      category: products.categorySlug,
      revenue: sql<number>`coalesce(sum(${orderItems.unitPriceCents} * ${orderItems.quantity}), 0)::int`,
      units: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
    })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .groupBy(products.categorySlug)
    .orderBy(desc(sql`coalesce(sum(${orderItems.unitPriceCents} * ${orderItems.quantity}), 0)`));

  const topSellers = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      soldCount: products.soldCount,
      priceCents: products.priceCents,
      images: products.images,
    })
    .from(products)
    .orderBy(desc(products.soldCount))
    .limit(6);

  const orderCount = totals?.orderCount ?? 0;
  const revenue = totals?.revenue ?? 0;

  return {
    orderCount,
    revenueCents: revenue,
    shippingCents: totals?.shipping ?? 0,
    unitsSold: units?.sold ?? 0,
    productCount: catalogue?.productCount ?? 0,
    stockUnits: catalogue?.stockUnits ?? 0,
    subscribers: subs?.count ?? 0,
    avgOrderCents: orderCount ? Math.round(revenue / orderCount) : 0,
    categoryBreakdown,
    topSellers,
  };
}

export async function getProfitLoss() {
  const [line] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${orderItems.unitPriceCents} * ${orderItems.quantity}), 0)::int`,
      cogs: sql<number>`coalesce(sum(${products.costCents} * ${orderItems.quantity}), 0)::int`,
      units: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
    })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId));

  const [ship] = await db
    .select({ shipping: sql<number>`coalesce(sum(${orders.shippingCents}), 0)::int` })
    .from(orders);

  const perCategory = await db
    .select({
      category: products.categorySlug,
      revenue: sql<number>`coalesce(sum(${orderItems.unitPriceCents} * ${orderItems.quantity}), 0)::int`,
      cogs: sql<number>`coalesce(sum(${products.costCents} * ${orderItems.quantity}), 0)::int`,
    })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .groupBy(products.categorySlug)
    .orderBy(desc(sql`coalesce(sum(${orderItems.unitPriceCents} * ${orderItems.quantity}), 0)`));

  const revenue = line?.revenue ?? 0;
  const cogs = line?.cogs ?? 0;
  const shipping = ship?.shipping ?? 0;
  const grossProfit = revenue - cogs;
  const margin = revenue ? Math.round((grossProfit / revenue) * 100) : 0;

  return {
    revenueCents: revenue,
    cogsCents: cogs,
    shippingCents: shipping,
    grossProfitCents: grossProfit,
    marginPercent: margin,
    unitsSold: line?.units ?? 0,
    perCategory: perCategory.map((row) => ({
      category: row.category,
      revenueCents: row.revenue,
      cogsCents: row.cogs,
      profitCents: row.revenue - row.cogs,
      margin: row.revenue ? Math.round(((row.revenue - row.cogs) / row.revenue) * 100) : 0,
    })),
  };
}

export async function getLoyaltyCustomers() {
  const rows = await db
    .select({
      email: orders.email,
      name: sql<string>`max(${orders.customerName})`,
      phone: sql<string>`max(${orders.phone})`,
      city: sql<string>`max(${orders.city})`,
      orderCount: sql<number>`count(*)::int`,
      totalSpent: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
      lastOrder: sql<string>`max(${orders.createdAt})`,
    })
    .from(orders)
    .groupBy(orders.email)
    .orderBy(desc(sql`coalesce(sum(${orders.totalCents}), 0)`));

  return rows.map((row) => {
    const points = Math.floor(row.totalSpent / 1000); // 1 point per R10 spent
    let tier: "Bronze" | "Silver" | "Gold" | "Platinum" = "Bronze";
    if (row.totalSpent >= 1500000) tier = "Platinum";
    else if (row.totalSpent >= 800000) tier = "Gold";
    else if (row.totalSpent >= 300000) tier = "Silver";
    return { ...row, points, tier };
  });
}

export async function getRestockList(threshold = 8) {
  const low = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      brand: products.brand,
      category: products.categorySlug,
      stock: products.stock,
      soldCount: products.soldCount,
      images: products.images,
    })
    .from(products)
    .where(lte(products.stock, threshold))
    .orderBy(asc(products.stock), desc(products.soldCount));

  const outOfStock = low.filter((item) => item.stock <= 0).length;
  return { low, outOfStock, threshold };
}

export async function getLaybuyOrders() {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.paymentMethod, "laybye"))
    .orderBy(desc(orders.id));

  return rows.map((order) => {
    const perInstallment = Math.round(order.totalCents / 3);
    const paid = Math.min(3, order.installmentsPaid);
    return {
      ...order,
      perInstallmentCents: perInstallment,
      paidCents: perInstallment * paid,
      balanceCents: Math.max(0, order.totalCents - perInstallment * paid),
      complete: paid >= 3,
    };
  });
}

export async function getDailyDealAdmin() {
  const deal = await getActiveDeal();
  if (!deal) return null;
  if (deal.scope === "store" || !deal.productId) {
    return { ...deal, product: null };
  }
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      brand: products.brand,
      slug: products.slug,
      priceCents: products.priceCents,
      images: products.images,
    })
    .from(products)
    .where(eq(products.id, deal.productId))
    .limit(1);
  return { ...deal, product: product ?? null };
}

export async function getProductsForDealSelect() {
  return db
    .select({
      id: products.id,
      name: products.name,
      brand: products.brand,
      priceCents: products.priceCents,
      stock: products.stock,
    })
    .from(products)
    .orderBy(desc(products.soldCount), asc(products.name));
}

export async function getAllCombosAdmin() {
  const rows = await db.select().from(combos).orderBy(desc(combos.createdAt));
  if (!rows.length) return [];
  const ids = Array.from(new Set(rows.flatMap((row) => [row.productAId, row.productBId])));
  const prods = await db
    .select({
      id: products.id,
      name: products.name,
      brand: products.brand,
      images: products.images,
      stock: products.stock,
    })
    .from(products)
    .where(inArray(products.id, ids));
  const byId = new Map(prods.map((p) => [p.id, p]));
  return rows.map((row) => ({
    ...row,
    productA: byId.get(row.productAId) ?? null,
    productB: byId.get(row.productBId) ?? null,
  }));
}

// ---------------- Pool deals ----------------
// "Any N from this pool, for a fixed total or % off each" — admin bulk-selects a pool of
// products (by category/brand, or one by one) instead of picking exact pairs like combos.

/** Every product with the fields the bulk-select picker needs to group/filter by. */
export async function getProductsForPoolSelect() {
  return db
    .select({
      id: products.id,
      name: products.name,
      brand: products.brand,
      categorySlug: products.categorySlug,
      priceCents: products.priceCents,
      stock: products.stock,
      image: sql<string>`${products.images}->>0`,
    })
    .from(products)
    .orderBy(asc(products.categorySlug), asc(products.brand), asc(products.name));
}

export async function getAllPoolsAdmin() {
  const rows = await db.select().from(pools).orderBy(desc(pools.createdAt));
  if (!rows.length) return [];
  const items = await db
    .select()
    .from(poolItems)
    .where(
      inArray(
        poolItems.poolId,
        rows.map((row) => row.id),
      ),
    );
  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  const prods = productIds.length
    ? await db
        .select({
          id: products.id,
          name: products.name,
          brand: products.brand,
          images: products.images,
          stock: products.stock,
        })
        .from(products)
        .where(inArray(products.id, productIds))
    : [];
  const byId = new Map(prods.map((p) => [p.id, p]));
  const itemsByPool = new Map<number, number[]>();
  for (const item of items) {
    const list = itemsByPool.get(item.poolId) ?? [];
    list.push(item.productId);
    itemsByPool.set(item.poolId, list);
  }
  return rows.map((row) => {
    const ids = itemsByPool.get(row.id) ?? [];
    return {
      ...row,
      productCount: ids.length,
      inStockCount: ids.filter((id) => (byId.get(id)?.stock ?? 0) > 0).length,
      products: ids.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p)),
    };
  });
}
