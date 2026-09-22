import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { dailyDeals, type DailyDeal } from "@/db/schema";

/** Midnight tonight in Johannesburg (SAST, UTC+2, no DST). */
export function endOfTodaySast(): Date {
  const now = new Date();
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${ymd}T23:59:59+02:00`);
}

export function dealPriceCents(priceCents: number, percentOff: number) {
  return Math.round((priceCents * (100 - percentOff)) / 100);
}

/** The single live Discount of the Day, or null if none is active. */
export async function getActiveDeal(): Promise<DailyDeal | null> {
  const [deal] = await db
    .select()
    .from(dailyDeals)
    .where(and(eq(dailyDeals.active, true), gt(dailyDeals.endsAt, new Date())))
    .orderBy(desc(dailyDeals.createdAt))
    .limit(1);
  return deal ?? null;
}

export function dealForProduct(deal: DailyDeal | null, productId: number) {
  if (!deal) return null;
  if (deal.scope === "store") return deal;
  return deal.productId === productId ? deal : null;
}
