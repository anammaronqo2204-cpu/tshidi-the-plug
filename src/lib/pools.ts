import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { pools, poolItems, type Pool } from "@/db/schema";
import { dealPriceCents } from "./deals";

export type PoolWithItems = Pool & { productIds: number[] };

export async function getActivePools(): Promise<PoolWithItems[]> {
  const rows = await db.select().from(pools).where(eq(pools.active, true));
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
  const byPool = new Map<number, number[]>();
  for (const item of items) {
    const list = byPool.get(item.poolId) ?? [];
    list.push(item.productId);
    byPool.set(item.poolId, list);
  }
  return rows.map((row) => ({ ...row, productIds: byPool.get(row.id) ?? [] }));
}

/** Every product ID that's part of any active pool (for "on sale" badges etc). */
export function poolProductIdSet(activePools: PoolWithItems[]): Set<number> {
  const set = new Set<number>();
  for (const pool of activePools) for (const id of pool.productIds) set.add(id);
  return set;
}

/** Human-readable rule, e.g. "Any 2 for R1000" or "10% off any 2". */
export function poolRuleText(pool: Pool, formatMoney: (cents: number) => string): string {
  if (pool.discountType === "fixed" && pool.fixedPriceCents) {
    return pool.pickCount === 1
      ? `Any 1 for ${formatMoney(pool.fixedPriceCents)}`
      : `Any ${pool.pickCount} for ${formatMoney(pool.fixedPriceCents)}`;
  }
  return pool.pickCount === 1 ? `${pool.percentOff ?? 0}% off` : `${pool.percentOff ?? 0}% off any ${pool.pickCount}`;
}

export type PoolAllocation = {
  bundledUnits: number;
  bundledTotalCents: number;
  poolName: string;
};

/**
 * Given the cart's line rows (already priced per-unit, e.g. after today's storewide
 * deal) and the active pools, works out how many complete groups can be formed per pool
 * and what each bundled unit should cost — then returns, per row index, how many of that
 * row's units were absorbed into a pool group and what they total. Any remaining
 * (non-grouped) quantity on a row is left for the caller to price normally.
 *
 * A product only ever counts toward the first active pool it belongs to (admin's
 * responsibility to avoid overlapping pools). Grouping order doesn't change the total
 * charged either way — fixed-price groups always total fixedPriceCents regardless of
 * which units land in which group, and percent-off is applied per-unit — so units are
 * just grouped in the order their rows appear, highest-priced first, purely so
 * per-unit pricing on a "fixed" pool looks sensible line to line.
 */
export function allocatePoolDiscounts(
  rows: { productId: number; quantity: number; unitPriceCents: number }[],
  activePools: PoolWithItems[],
): Map<number, PoolAllocation> {
  const result = new Map<number, PoolAllocation>();
  if (!activePools.length) return result;

  const poolByProduct = new Map<number, PoolWithItems>();
  for (const pool of activePools) {
    for (const productId of pool.productIds) {
      if (!poolByProduct.has(productId)) poolByProduct.set(productId, pool);
    }
  }

  const rowIdxsByPool = new Map<number, number[]>();
  rows.forEach((row, idx) => {
    const pool = poolByProduct.get(row.productId);
    if (!pool) return;
    const list = rowIdxsByPool.get(pool.id) ?? [];
    list.push(idx);
    rowIdxsByPool.set(pool.id, list);
  });

  for (const pool of activePools) {
    const rowIdxs = rowIdxsByPool.get(pool.id);
    if (!rowIdxs?.length) continue;

    const pickCount = Math.max(1, pool.pickCount);
    const totalQty = rowIdxs.reduce((sum, idx) => sum + rows[idx].quantity, 0);
    const numGroups = Math.floor(totalQty / pickCount);
    if (numGroups === 0) continue;

    const units: { rowIdx: number; unitPriceCents: number }[] = [];
    for (const idx of rowIdxs) {
      for (let n = 0; n < rows[idx].quantity; n++) {
        units.push({ rowIdx: idx, unitPriceCents: rows[idx].unitPriceCents });
      }
    }
    units.sort((a, b) => b.unitPriceCents - a.unitPriceCents);

    const groupedUnits = units.slice(0, numGroups * pickCount);

    for (let g = 0; g < numGroups; g++) {
      const group = groupedUnits.slice(g * pickCount, (g + 1) * pickCount);
      const perUnitCents: number[] = [];

      if (pool.discountType === "fixed" && pool.fixedPriceCents) {
        const originalSum = group.reduce((sum, u) => sum + u.unitPriceCents, 0) || 1;
        let allocated = 0;
        group.forEach((u, i) => {
          if (i === group.length - 1) {
            perUnitCents.push(pool.fixedPriceCents! - allocated);
          } else {
            const share = Math.round((pool.fixedPriceCents! * u.unitPriceCents) / originalSum);
            perUnitCents.push(share);
            allocated += share;
          }
        });
      } else {
        const percentOff = pool.percentOff ?? 0;
        group.forEach((u) => perUnitCents.push(dealPriceCents(u.unitPriceCents, percentOff)));
      }

      group.forEach((u, i) => {
        const existing = result.get(u.rowIdx) ?? {
          bundledUnits: 0,
          bundledTotalCents: 0,
          poolName: pool.name,
        };
        existing.bundledUnits += 1;
        existing.bundledTotalCents += perUnitCents[i];
        result.set(u.rowIdx, existing);
      });
    }
  }

  return result;
}
