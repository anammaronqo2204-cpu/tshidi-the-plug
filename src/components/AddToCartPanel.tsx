"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/lib/format";

export function AddToCartPanel({
  productId,
  sizes,
  stock,
  sizePricing = null,
  dealPercentOff = null,
}: {
  productId: number;
  sizes: string[];
  stock: number;
  // Per-size pricing (e.g. wig lengths) — when set, picking a size shows that
  // size's own price instead of the flat headline price.
  sizePricing?: Record<string, number> | null;
  dealPercentOff?: number | null;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const options = sizes.length ? sizes : ["One Size"];
  const [size, setSize] = useState(options.length === 1 ? options[0] : "");
  const rawSizePrice = size && sizePricing ? sizePricing[size] : undefined;
  const sizePriceCents =
    rawSizePrice !== undefined
      ? dealPercentOff
        ? Math.round(rawSizePrice * (1 - dealPercentOff / 100))
        : rawSizePrice
      : null;
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"add" | "buy" | null>(null);

  const soldOut = stock <= 0;

  async function handle(mode: "add" | "buy") {
    if (soldOut) return;
    if (!size) {
      setError("Please pick a size first");
      return;
    }
    setError("");
    setBusy(mode);
    try {
      await addItem(productId, size, quantity);
      if (mode === "buy") router.push("/checkout");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {options.length > 1 ? (
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-ink/45">
              Select size
            </h3>
            <span className="text-[11px] font-semibold text-ink/45">UK sizing</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setSize(option);
                  setError("");
                }}
                className={`min-w-[62px] rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                  size === option
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/15 bg-white hover:border-ink"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {sizePriceCents !== null ? (
            <p className="mt-2 text-sm font-black text-ink">Size {size} — {formatMoney(sizePriceCents)}</p>
          ) : sizePricing ? (
            <p className="mt-2 text-xs font-semibold text-ink/45">Pick a size to see its price</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-ink/15 bg-white">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="h-11 w-11 text-lg"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-black">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(10, value + 1))}
            className="h-11 w-11 text-lg"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          type="button"
          disabled={soldOut || busy !== null}
          onClick={() => handle("add")}
          className="flex-1 rounded-full bg-ink px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-cream transition hover:bg-flame disabled:opacity-50"
        >
          {soldOut ? "Sold out" : busy === "add" ? "Adding…" : "Add to bag"}
        </button>
      </div>

      <button
        type="button"
        disabled={soldOut || busy !== null}
        onClick={() => handle("buy")}
        className="w-full rounded-full bg-volt px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-ink transition hover:bg-ink hover:text-volt disabled:opacity-50"
      >
        {busy === "buy" ? "One moment…" : "Buy it now"}
      </button>

      {error ? <p className="text-xs font-bold text-flame">{error}</p> : null}
    </div>
  );
}
