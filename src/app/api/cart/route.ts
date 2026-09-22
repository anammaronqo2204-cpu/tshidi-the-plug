import { NextResponse, type NextRequest } from "next/server";
import { addToCart, getCart, removeCartItem, updateCartItem } from "@/lib/cart";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getCart());
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { productId?: number; size?: string; quantity?: number }
    | null;

  if (!body?.productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const cart = await addToCart(
    Number(body.productId),
    body.size?.trim() || "One Size",
    Math.max(1, Math.min(20, Number(body.quantity) || 1)),
  );

  return NextResponse.json(cart);
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { itemId?: number; quantity?: number }
    | null;

  if (!body?.itemId) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }

  const cart = await updateCartItem(Number(body.itemId), Number(body.quantity) || 0);
  return NextResponse.json(cart);
}

export async function DELETE(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { itemId?: number } | null;
  if (!body?.itemId) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }
  const cart = await removeCartItem(Number(body.itemId));
  return NextResponse.json(cart);
}
