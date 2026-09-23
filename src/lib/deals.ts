import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { dailyDeals, products, settings, type DailyDeal } from "@/db/schema";
import { getActiveCombos, comboProductIdSet } from "./combos";
import { getActivePools, poolProductIdSet } from "./pools";

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

// ---------------- Auto "Special of the Day" rotation ----------------
// Picks one product a day on its own — no admin action needed — skipping anything
// already covered by an active pool or combo deal, and rotating through every eligible
// product once before repeating. Sits alongside the manual "Discount of the day" above:
// if the admin activates one by hand, that takes priority (ensureAutoDailyDeal only
// fires when getActiveDeal() finds nothing currently live) and auto-rotation resumes on
// its own the next time nothing is active.

const AUTO_DEAL_ENABLED_KEY = "auto_deal_enabled";
const AUTO_DEAL_PERCENT_KEY = "auto_deal_percent_off";
const AUTO_DEAL_USED_KEY = "auto_deal_used_ids";
const DEFAULT_AUTO_DEAL_PERCENT_OFF = 15;

async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return row?.value ?? null;
}

async function setSetting(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

export async function getAutoDealSettings(): Promise<{ enabled: boolean; percentOff: number }> {
  const [enabledRaw, percentRaw] = await Promise.all([
    getSetting(AUTO_DEAL_ENABLED_KEY),
    getSetting(AUTO_DEAL_PERCENT_KEY),
  ]);
  return {
    // Opt-out, not opt-in — on by default until an admin turns it off.
    enabled: enabledRaw === null ? true : enabledRaw === "true",
    percentOff: percentRaw ? Math.min(90, Math.max(5, Math.round(Number(percentRaw)))) : DEFAULT_AUTO_DEAL_PERCENT_OFF,
  };
}

export async function setAutoDealSettings(enabled: boolean, percentOff: number) {
  await Promise.all([
    setSetting(AUTO_DEAL_ENABLED_KEY, enabled ? "true" : "false"),
    setSetting(AUTO_DEAL_PERCENT_KEY, String(Math.min(90, Math.max(5, Math.round(percentOff))))),
  ]);
}

/** In-stock products not already covered by an active pool or combo deal. */
async function getAutoDealEligibleProductIds(): Promise<number[]> {
  const [inStock, activeCombos, activePools] = await Promise.all([
    db.select({ id: products.id }).from(products).where(gt(products.stock, 0)),
    getActiveCombos(),
    getActivePools(),
  ]);
  const excluded = new Set<number>([...comboProductIdSet(activeCombos), ...poolProductIdSet(activePools)]);
  return inStock.map((p) => p.id).filter((id) => !excluded.has(id));
}

/**
 * Picks the next product for the rotation, skipping anything already used in the
 * current cycle. Once every eligible product has had a turn, the cycle clears itself
 * and starts over from scratch.
 */
async function pickNextAutoDealProductId(): Promise<number | null> {
  const eligible = await getAutoDealEligibleProductIds();
  if (eligible.length === 0) return null;

  const usedRaw = await getSetting(AUTO_DEAL_USED_KEY);
  let used: number[] = [];
  try {
    used = usedRaw ? (JSON.parse(usedRaw) as number[]) : [];
  } catch {
    used = [];
  }
  // Drop anything no longer eligible (sold out, deleted, or now in a pool/combo) so it
  // doesn't permanently take up a "used" slot.
  used = used.filter((id) => eligible.includes(id));

  let remaining = eligible.filter((id) => !used.includes(id));
  if (remaining.length === 0) {
    used = [];
    remaining = eligible;
  }

  const picked = remaining[Math.floor(Math.random() * remaining.length)];
  used.push(picked);
  await setSetting(AUTO_DEAL_USED_KEY, JSON.stringify(used));
  return picked;
}

/** How many eligible products remain before the current rotation cycle repeats. */
export async function getAutoDealRotationStatus(): Promise<{ usedCount: number; eligibleCount: number }> {
  const eligible = await getAutoDealEligibleProductIds();
  const usedRaw = await getSetting(AUTO_DEAL_USED_KEY);
  let used: number[] = [];
  try {
    used = usedRaw ? (JSON.parse(usedRaw) as number[]) : [];
  } catch {
    used = [];
  }
  used = used.filter((id) => eligible.includes(id));
  return { usedCount: used.length, eligibleCount: eligible.length };
}

/**
 * Makes sure a Discount of the Day is live right now. If one already is — whether set
 * manually from the admin panel or picked automatically earlier today — this does
 * nothing and just returns it. Otherwise, and only if auto-rotation is turned on, it
 * rotates to the next eligible product and creates today's deal for it. Safe to call
 * anywhere getActiveDeal() is called; it only ever writes once per day, the first time
 * someone visits after the previous deal has expired.
 */
export async function ensureAutoDailyDeal(): Promise<DailyDeal | null> {
  const active = await getActiveDeal();
  if (active) return active;

  const { enabled, percentOff } = await getAutoDealSettings();
  if (!enabled) return null;

  const productId = await pickNextAutoDealProductId();
  if (!productId) return null;

  await db.update(dailyDeals).set({ active: false });
  const [deal] = await db
    .insert(dailyDeals)
    .values({ productId, scope: "product", percentOff, endsAt: endOfTodaySast(), active: true })
    .returning();
  return deal ?? null;
}
