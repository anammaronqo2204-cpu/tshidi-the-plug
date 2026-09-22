import { eq } from "drizzle-orm";
import { db } from "@/db";
import { combos, type Combo } from "@/db/schema";

export async function getActiveCombos(): Promise<Combo[]> {
  return db.select().from(combos).where(eq(combos.active, true));
}

/** Every product ID that's part of any of the given active combos. */
export function comboProductIdSet(activeCombos: Combo[]): Set<number> {
  const set = new Set<number>();
  for (const combo of activeCombos) {
    set.add(combo.productAId);
    set.add(combo.productBId);
  }
  return set;
}

/**
 * Given the active combos and the set of product IDs currently in a cart, returns a
 * map of productId -> the best (highest) combo percent-off that applies to it. A combo
 * only counts once both of its products are present in the cart — that's the "buy both,
 * get a discount" trigger. If a product is on two different active combos and only one
 * partner is in the cart, only the matching combo counts.
 */
export function comboDiscountsForCart(
  activeCombos: Combo[],
  productIdsInCart: Set<number>,
): Map<number, { percentOff: number; partnerId: number }> {
  const map = new Map<number, { percentOff: number; partnerId: number }>();
  for (const combo of activeCombos) {
    if (!productIdsInCart.has(combo.productAId) || !productIdsInCart.has(combo.productBId)) continue;
    const existingA = map.get(combo.productAId);
    if (!existingA || combo.percentOff > existingA.percentOff) {
      map.set(combo.productAId, { percentOff: combo.percentOff, partnerId: combo.productBId });
    }
    const existingB = map.get(combo.productBId);
    if (!existingB || combo.percentOff > existingB.percentOff) {
      map.set(combo.productBId, { percentOff: combo.percentOff, partnerId: combo.productAId });
    }
  }
  return map;
}
