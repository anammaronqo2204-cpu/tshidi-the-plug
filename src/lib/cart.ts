import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, carts, products } from "@/db/schema";
import { shippingCentsForTier } from "./site";
import { dealForProduct, dealPriceCents, getActiveDeal } from "./deals";
import { comboDiscountsForCart, getActiveCombos } from "./combos";
import { allocatePoolDiscounts, getActivePools } from "./pools";

export const CART_COOKIE = "tshidi_cart";

export type CartLine = {
  id: number;
  productId: number;
  slug: string;
  name: string;
  brand: string;
  image: string;
  size: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  stock: number;
  // Set when a "buy both" combo kicked in for this line (partner product is also in
  // the cart) — the percent already folded into unitPriceCents, plus the partner's
  // name so the UI can explain why the price dropped.
  comboPercentOff: number | null;
  comboPartnerName: string | null;
  // Set when this line has at least one unit absorbed into a pool deal group (e.g.
  // "any 2 T-shirts for R1000") — unitPriceCents/lineTotalCents already reflect it.
  poolName: string | null;
};

export type CartSummary = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
};

export const emptyCart: CartSummary = {
  lines: [],
  itemCount: 0,
  subtotalCents: 0,
  shippingCents: 0,
  totalCents: 0,
};

async function findCartByToken(token: string | undefined) {
  if (!token) return null;
  const [cart] = await db.select().from(carts).where(eq(carts.token, token)).limit(1);
  return cart ?? null;
}

export async function readCartToken() {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value;
}

/** Route-handler only: creates the cart row and sets the cookie when missing. */
export async function getOrCreateCart() {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  const existing = await findCartByToken(token);
  if (existing) return existing;

  const newToken = crypto.randomUUID();
  const [cart] = await db.insert(carts).values({ token: newToken }).returning();
  store.set(CART_COOKIE, newToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return cart;
}

/**
 * Estimate shipping using the given province (defaults to Gauteng local rate).
 * Uses the small-parcel Courier Guy tier as a rough estimate — the customer picks
 * the actual parcel size and delivery method on the checkout page.
 */
export function summarise(lines: CartLine[], province?: string | null): CartSummary {
  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const shippingCents = lines.length ? shippingCentsForTier("small", province) : 0;
  return {
    lines,
    itemCount,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
  };
}

export async function getCartLines(cartId: number): Promise<CartLine[]> {
  const rows = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      size: cartItems.size,
      quantity: cartItems.quantity,
      slug: products.slug,
      name: products.name,
      brand: products.brand,
      images: products.images,
      priceCents: products.priceCents,
      sizePricing: products.sizePricing,
      stock: products.stock,
    })
    .from(cartItems)
    .innerJoin(products, eq(products.id, cartItems.productId))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(cartItems.id);

  const [deal, activeCombos, activePools] = await Promise.all([
    getActiveDeal(),
    getActiveCombos(),
    getActivePools(),
  ]);

  // Wigs (and anything else with per-size pricing) charge whatever that specific size
  // costs — falls back to the flat price if the size isn't in the map (shouldn't
  // normally happen, but keeps checkout from breaking). Today's storewide/product deal
  // is applied first, since pools and combos are both meant to stack on top of it.
  const afterDealRows = rows.map((row) => {
    const basePriceCents = row.sizePricing?.[row.size] ?? row.priceCents;
    const lineDeal = dealForProduct(deal, row.productId);
    const afterDeal = lineDeal ? dealPriceCents(basePriceCents, lineDeal.percentOff) : basePriceCents;
    return { ...row, afterDeal };
  });

  const poolAllocations = allocatePoolDiscounts(
    afterDealRows.map((row) => ({
      productId: row.productId,
      quantity: row.quantity,
      unitPriceCents: row.afterDeal,
    })),
    activePools,
  );

  const productIdsInCart = new Set(rows.map((row) => row.productId));
  const comboMap = comboDiscountsForCart(activeCombos, productIdsInCart);
  const nameById = new Map(rows.map((row) => [row.productId, row.name]));

  return afterDealRows.map((row, idx) => {
    const combo = comboMap.get(row.productId) ?? null;
    const poolAlloc = poolAllocations.get(idx);

    let lineTotalCents: number;
    let poolName: string | null = null;
    let comboPercentOff: number | null = null;
    let comboPartnerName: string | null = null;

    if (poolAlloc && poolAlloc.bundledUnits > 0) {
      // Units this pool deal already grouped are priced as-is. Any leftover quantity on
      // the same line (didn't make up a full group) is still free to combo-discount.
      poolName = poolAlloc.poolName;
      const leftoverQty = row.quantity - poolAlloc.bundledUnits;
      const leftoverUnit = combo ? dealPriceCents(row.afterDeal, combo.percentOff) : row.afterDeal;
      lineTotalCents = poolAlloc.bundledTotalCents + leftoverUnit * leftoverQty;
      if (leftoverQty > 0 && combo) {
        comboPercentOff = combo.percentOff;
        comboPartnerName = nameById.get(combo.partnerId) ?? null;
      }
    } else {
      const unit = combo ? dealPriceCents(row.afterDeal, combo.percentOff) : row.afterDeal;
      lineTotalCents = unit * row.quantity;
      if (combo) {
        comboPercentOff = combo.percentOff;
        comboPartnerName = nameById.get(combo.partnerId) ?? null;
      }
    }

    return {
      id: row.id,
      productId: row.productId,
      slug: row.slug,
      name: row.name,
      brand: row.brand,
      image: row.images[0] ?? "",
      size: row.size,
      quantity: row.quantity,
      unitPriceCents: Math.round(lineTotalCents / row.quantity),
      lineTotalCents,
      stock: row.stock,
      comboPercentOff,
      comboPartnerName,
      poolName,
    };
  });
}

/** Read-only cart lookup — safe inside server components. */
export async function getCart(): Promise<CartSummary> {
  const token = await readCartToken();
  const cart = await findCartByToken(token);
  if (!cart) return emptyCart;
  return summarise(await getCartLines(cart.id));
}

export async function addToCart(productId: number, size: string, quantity: number) {
  const cart = await getOrCreateCart();
  const [existing] = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, productId),
        eq(cartItems.size, size),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(cartItems)
      .set({ quantity: Math.min(20, existing.quantity + quantity) })
      .where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({ cartId: cart.id, productId, size, quantity });
  }

  return summarise(await getCartLines(cart.id));
}

export async function updateCartItem(itemId: number, quantity: number) {
  const cart = await getOrCreateCart();
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
  } else {
    await db
      .update(cartItems)
      .set({ quantity: Math.min(20, quantity) })
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
  }
  return summarise(await getCartLines(cart.id));
}

export async function removeCartItem(itemId: number) {
  const cart = await getOrCreateCart();
  await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
  return summarise(await getCartLines(cart.id));
}

export async function clearCart(cartId: number) {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
}
