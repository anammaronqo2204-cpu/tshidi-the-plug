import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";

export async function getOrderByNumber(orderNumber: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber.trim().toUpperCase()))
    .limit(1);

  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return { order, items };
}

export async function getRecentOrders(limit = 20) {
  return db.select().from(orders).orderBy(desc(orders.id)).limit(limit);
}

export async function getStoreStats() {
  const [totals] = await db
    .select({
      orderCount: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
    })
    .from(orders);

  const [catalogue] = await db
    .select({
      productCount: sql<number>`count(*)::int`,
      stockUnits: sql<number>`coalesce(sum(${products.stock}), 0)::int`,
    })
    .from(products);

  const lowStock = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      brand: products.brand,
      stock: products.stock,
      images: products.images,
    })
    .from(products)
    .orderBy(products.stock)
    .limit(6);

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
    .limit(5);

  return {
    orderCount: totals?.orderCount ?? 0,
    revenueCents: totals?.revenue ?? 0,
    productCount: catalogue?.productCount ?? 0,
    stockUnits: catalogue?.stockUnits ?? 0,
    lowStock,
    topSellers,
  };
}

export async function setOrderStatus(orderId: number, status: string) {
  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
}
