"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/lib/format";
import { site } from "@/lib/site";

export function CartView() {
  const { cart, setQuantity, removeItem, loading } = useCart();

  if (cart.lines.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-16 text-center ring-1 ring-ink/5">
        <p className="text-6xl">🛒</p>
        <h2 className="mt-5 text-3xl font-black">Your bag is empty</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink/55">
          Sneakers, hoodies, handbags, pots — pick something and it&apos;ll show up right here.
        </p>
        <Link
          href="/shop"
          className="mt-7 inline-block rounded-full bg-ink px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-cream transition hover:bg-flame"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-4 text-xs font-semibold leading-relaxed text-ink/65 ring-1 ring-ink/5">
          🚚 Delivery via {site.courierName}: <span className="font-bold text-ink">R100</span> in Gauteng,{" "}
          <span className="font-bold text-ink">R200</span> outside Gauteng · free collection in{" "}
          {site.city.split(",")[0]}. Please allow <span className="font-bold text-ink">{site.processingDays}</span> for
          order processing before dispatch.
        </div>

        {cart.lines.map((line) => (
          <article key={line.id} className="flex gap-4 rounded-3xl bg-white p-4 ring-1 ring-ink/5">
            <Link href={`/product/${line.slug}`} className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={line.image}
                alt={line.name}
                className="h-32 w-28 rounded-2xl object-cover sm:h-36 sm:w-32"
              />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-ink/45">
                {line.brand}
              </p>
              <Link
                href={`/product/${line.slug}`}
                className="text-base font-black leading-tight hover:text-flame"
              >
                {line.name}
              </Link>
              <p className="mt-1 text-xs text-ink/50">
                Size {line.size} · {formatMoney(line.unitPriceCents)} each
              </p>
              {line.poolName ? (
                <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-flame">
                  🎁 {line.poolName} bundle deal applied
                </p>
              ) : null}
              {line.comboPercentOff ? (
                <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-flame">
                  🔗 Combo deal −{line.comboPercentOff}% for bundling with {line.comboPartnerName}
                </p>
              ) : null}

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                <div className="flex items-center rounded-full border border-ink/15">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setQuantity(line.id, line.quantity - 1)}
                    className="h-9 w-9 text-base"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-black">{line.quantity}</span>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setQuantity(line.id, line.quantity + 1)}
                    className="h-9 w-9 text-base"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black">{formatMoney(line.lineTotalCents)}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(line.id)}
                    className="text-[11px] font-bold uppercase tracking-wider text-ink/40 hover:text-flame"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}

        <Link
          href="/shop"
          className="inline-block text-xs font-black uppercase tracking-[0.2em] underline underline-offset-4 hover:text-flame"
        >
          ← Continue shopping
        </Link>
      </div>

      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="rounded-3xl bg-ink p-6 text-cream">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-volt">Order summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-cream/60">Subtotal ({cart.itemCount} items)</dt>
              <dd className="font-bold">{formatMoney(cart.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cream/60">Delivery</dt>
              <dd className="font-bold">
                {cart.shippingCents === 0 ? "FREE" : formatMoney(cart.shippingCents)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-cream/15 pt-4 text-xl font-black">
              <dt>Total</dt>
              <dd>{formatMoney(cart.totalCents)}</dd>
            </div>
          </dl>

          <Link
            href="/checkout"
            className="mt-6 block rounded-full bg-volt py-4 text-center text-xs font-black uppercase tracking-[0.2em] text-ink transition hover:bg-cream"
          >
            Proceed to checkout
          </Link>

          <ul className="mt-6 space-y-2 text-xs text-cream/55">
            <li>✓ EFT 100% upfront · or lay-bye over 3 months</li>
            <li>✓ Tracking number sent by WhatsApp</li>
            <li>✓ 7-day size exchanges</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
