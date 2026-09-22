"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/lib/format";
import { site } from "@/lib/site";

export function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, setQuantity, removeItem, loading } = useCart();
  // Off-screen drawer links shouldn't be prefetched from inside the admin.
  const prefetch = usePathname()?.startsWith("/admin") ? false : undefined;

  return (
    <div
      className={`fixed inset-0 z-[60] transition ${
        drawerOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!drawerOpen}
    >
      <div
        onClick={closeDrawer}
        className={`absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity ${
          drawerOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-ink/45">Your bag</p>
            <p className="text-lg font-black">{cart.itemCount} item{cart.itemCount === 1 ? "" : "s"}</p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-lg"
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        {cart.itemCount > 0 ? (
          <div className="bg-volt/40 px-5 py-2 text-center text-xs font-semibold">
            Delivery R100 (Gauteng) · R200 national via {site.courierName} · allow {site.processingDays} processing
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <span className="text-5xl">🛍️</span>
              <p className="text-sm text-ink/60">Your bag is empty — let&apos;s fix that.</p>
              <Link prefetch={prefetch}
                href="/shop"
                onClick={closeDrawer}
                className="rounded-full bg-ink px-6 py-3 text-xs font-bold uppercase tracking-widest text-cream"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {cart.lines.map((line) => (
                <li key={line.id} className="flex gap-3 rounded-2xl bg-white p-3">
                  <Link prefetch={prefetch} href={`/product/${line.slug}`} onClick={closeDrawer} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={line.image}
                      alt={line.name}
                      className="h-24 w-20 rounded-xl object-cover"
                      loading="lazy"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">
                      {line.brand}
                    </p>
                    <Link prefetch={prefetch}
                      href={`/product/${line.slug}`}
                      onClick={closeDrawer}
                      className="line-clamp-2 text-sm font-bold leading-tight hover:text-flame"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink/50">Size: {line.size}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-ink/15">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => setQuantity(line.id, line.quantity - 1)}
                          className="h-7 w-7 text-sm"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-xs font-bold">{line.quantity}</span>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => setQuantity(line.id, line.quantity + 1)}
                          className="h-7 w-7 text-sm"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-black">{formatMoney(line.lineTotalCents)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(line.id)}
                      className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-ink/40 hover:text-flame"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.lines.length > 0 ? (
          <div className="space-y-3 border-t border-ink/10 bg-white px-5 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Subtotal</span>
              <span className="font-bold">{formatMoney(cart.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Delivery</span>
              <span className="font-bold">
                {cart.shippingCents === 0 ? "FREE" : formatMoney(cart.shippingCents)}
              </span>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-3 text-lg font-black">
              <span>Total</span>
              <span>{formatMoney(cart.totalCents)}</span>
            </div>
            <Link prefetch={prefetch}
              href="/checkout"
              onClick={closeDrawer}
              className="block rounded-full bg-ink py-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-cream transition hover:bg-smoke"
            >
              Checkout securely
            </Link>
            <Link prefetch={prefetch}
              href="/cart"
              onClick={closeDrawer}
              className="block text-center text-xs font-semibold uppercase tracking-widest text-ink/50 hover:text-ink"
            >
              View full bag
            </Link>
            <p className="text-center text-[11px] text-ink/40">
              Questions? WhatsApp {site.phone}
            </p>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
