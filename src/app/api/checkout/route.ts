import { NextResponse, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { clearCart, getCartLines, readCartToken, summarise } from "@/lib/cart";
import { carts } from "@/db/schema";
import { site, shippingCentsForTier } from "@/lib/site";

export const dynamic = "force-dynamic";

type CheckoutBody = {
  customerName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  deliveryMethod?: string;
  paymentMethod?: string;
  notes?: string;
  proofOfPaymentUrl?: string;
};

function orderNumber() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `${site.orderPrefix}-${stamp}${rand}`;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as CheckoutBody | null;
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const required: Array<[keyof CheckoutBody, string]> = [
    ["customerName", "Full name"],
    ["email", "Email"],
    ["phone", "Phone number"],
    ["address", "Street address"],
    ["city", "City"],
    ["province", "Province"],
    ["postalCode", "Postal code"],
  ];

  const missing = required.filter(([key]) => !String(body[key] ?? "").trim()).map(([, label]) => label);
  if (missing.length) {
    return NextResponse.json({ error: `Please complete: ${missing.join(", ")}` }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }

  if ((body.paymentMethod ?? "eft") === "eft" && !String(body.proofOfPaymentUrl ?? "").trim()) {
    return NextResponse.json(
      { error: "Please upload proof of payment before placing your order" },
      { status: 400 },
    );
  }

  const token = await readCartToken();
  const [cart] = token
    ? await db.select().from(carts).where(eq(carts.token, token)).limit(1)
    : [];

  if (!cart) return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });

  const lines = await getCartLines(cart.id);
  if (!lines.length) return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });

  const summary = summarise(lines);
  const shippingCents = shippingCentsForTier(body.deliveryMethod ?? "large", body.province);
  const number = orderNumber();

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: number,
      customerName: String(body.customerName).trim(),
      email: String(body.email).trim().toLowerCase(),
      phone: String(body.phone).trim(),
      address: String(body.address).trim(),
      city: String(body.city).trim(),
      province: String(body.province).trim(),
      postalCode: String(body.postalCode).trim(),
      deliveryMethod: body.deliveryMethod || "large",
      paymentMethod: body.paymentMethod || "eft",
      notes: (body.notes ?? "").trim(),
      proofOfPaymentUrl: (body.proofOfPaymentUrl ?? "").trim(),
      subtotalCents: summary.subtotalCents,
      shippingCents,
      totalCents: summary.subtotalCents + shippingCents,
      status: (body.paymentMethod ?? "eft") === "laybye" ? "laybye" : "pending",
      installmentsPaid: 0,
    })
    .returning();

  await db.insert(orderItems).values(
    lines.map((line) => ({
      orderId: order.id,
      productId: line.productId,
      name: line.name,
      brand: line.brand,
      slug: line.slug,
      imageUrl: line.image,
      size: line.size,
      unitPriceCents: line.unitPriceCents,
      quantity: line.quantity,
    })),
  );

  for (const line of lines) {
    await db
      .update(products)
      .set({
        stock: sql`greatest(0, ${products.stock} - ${line.quantity})`,
        soldCount: sql`${products.soldCount} + ${line.quantity}`,
      })
      .where(eq(products.id, line.productId));
  }

  await clearCart(cart.id);

  return NextResponse.json({ orderNumber: number });
}
