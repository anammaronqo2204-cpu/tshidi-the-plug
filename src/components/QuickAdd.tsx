"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./CartProvider";

export function QuickAdd({
  productId,
  slug,
  sizes,
  soldOut,
}: {
  productId: number;
  slug: string;
  sizes: string[];
  soldOut: boolean;
}) {
  const { addItem } = useCart();
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const singleSize = sizes.length <= 1;

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (soldOut) return;
    if (!singleSize) {
      router.push(`/product/${slug}`);
      return;
    }
    setBusy(true);
    try {
      await addItem(productId, sizes[0] ?? "One Size", 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || soldOut}
      className="w-full rounded-full bg-ink py-2 text-[9.5px] font-black uppercase tracking-[0.14em] text-cream transition hover:bg-flame disabled:opacity-50 sm:py-3 sm:text-[11px] sm:tracking-[0.18em]"
    >
      {soldOut ? "Sold out" : busy ? "Adding…" : singleSize ? "Add to bag" : "Choose size"}
    </button>
  );
}
