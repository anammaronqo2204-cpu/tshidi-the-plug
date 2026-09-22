"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { Wordmark } from "./PlugMark";

type NavCategory = { slug: string; name: string };
type NavGroup = { slug: string; name: string; subcategories: NavCategory[] };

const strip = [
  "Tshidi the Plug — 100% authentic stock",
  "Delivery R100 Gauteng · R200 national via Courier Guy",
  "2–3 working days order processing",
  "Lay-bye over 3 months — goods released after final payment",
  "7-day size exchanges",
];

export function SiteHeader({ groups }: { groups: NavGroup[] }) {
  const { cart, openDrawer } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [term, setTerm] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  // The admin lives inside this same header. Prefetching shop pages from there just adds
  // background server work that slows the admin down, so it's only on for customers.
  const prefetch = pathname?.startsWith("/admin") ? false : undefined;

  useEffect(() => {
    setMenuOpen(false);
    setShopOpen(false);
  }, [pathname]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = term.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="overflow-hidden bg-ink py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-cream/80">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center gap-10 px-5">
              {strip.map((item) => (
                <span key={item} className="flex items-center gap-3 whitespace-nowrap">
                  <span className="text-volt">◆</span>
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-ink/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-4 px-4 sm:px-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 lg:hidden"
          >
            <span className="space-y-1">
              <span className="block h-0.5 w-4 bg-ink" />
              <span className="block h-0.5 w-4 bg-ink" />
              <span className="block h-0.5 w-4 bg-ink" />
            </span>
          </button>

          <Wordmark variant="dark" />

          <nav className="ml-6 hidden items-center gap-6 text-sm font-medium lg:flex">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShopOpen((open) => !open)}
                className="flex items-center gap-1.5 font-semibold transition hover:text-flame"
                aria-expanded={shopOpen}
              >
                Shop all
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={`transition ${shopOpen ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {shopOpen ? (
                <>
                  <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setShopOpen(false)}
                    className="fixed inset-0 z-10 cursor-default"
                  />
                  <div className="absolute left-0 top-[calc(100%+14px)] z-20 max-h-[75vh] w-[360px] overflow-y-auto rounded-3xl border border-ink/10 bg-cream p-3 shadow-[0_30px_80px_-40px_rgba(16,13,11,0.7)]">
                    <Link prefetch={prefetch}
                      href="/shop"
                      className="block rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-cream transition hover:bg-flame"
                    >
                      Shop everything →
                    </Link>
                    <div className="mt-2 space-y-1.5">
                      {groups.map((group) => (
                        <details key={group.slug} className="group/dep rounded-xl bg-white">
                          <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:bg-sand [&::-webkit-details-marker]:hidden">
                            <Link prefetch={prefetch}
                              href={`/shop?group=${group.slug}`}
                              onClick={() => setShopOpen(false)}
                              className="hover:text-flame"
                            >
                              {group.name}
                            </Link>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              className="shrink-0 text-ink/40 transition group-open/dep:rotate-180"
                            >
                              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </summary>
                          <div className="grid grid-cols-2 gap-1.5 px-2 pb-2 pt-1">
                            {group.subcategories.map((cat) => (
                              <Link prefetch={prefetch}
                                key={cat.slug}
                                href={`/shop?category=${cat.slug}`}
                                onClick={() => setShopOpen(false)}
                                className="rounded-lg bg-sand/60 px-3 py-2 text-xs font-medium transition hover:bg-sand"
                              >
                                {cat.name}
                              </Link>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <Link prefetch={prefetch}
                        href="/shop?sale=1"
                        className="flex-1 rounded-xl bg-flame px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        Sale
                      </Link>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <Link prefetch={prefetch} href="/shop?sale=1" className="text-flame transition hover:opacity-70">
              Sale
            </Link>
            <Link prefetch={prefetch} href="/tshidi" className="transition hover:text-flame">
              Meet Tshidi
            </Link>
            <Link prefetch={prefetch} href="/faq" className="transition hover:text-flame">
              FAQ
            </Link>
          </nav>

          <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 md:block">
            <label className="flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2 focus-within:border-ink">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-ink/40">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.2-3.2" strokeLinecap="round" />
              </svg>
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search sneakers, hoodies, pots…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink/35"
              />
            </label>
          </form>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Link prefetch={prefetch}
              href="/track"
              className="hidden rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold uppercase tracking-widest transition hover:border-ink sm:block"
            >
              Track order
            </Link>
            <button
              type="button"
              onClick={openDrawer}
              className="relative flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-cream transition hover:bg-smoke"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 7h12l-1 13H7L6 7Z" strokeLinejoin="round" />
                <path d="M9 7a3 3 0 0 1 6 0" strokeLinecap="round" />
              </svg>
              Cart
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-volt px-1 text-[11px] font-bold text-ink">
                {cart.itemCount}
              </span>
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-ink/10 bg-cream px-4 pb-5 pt-4 lg:hidden">
            <form onSubmit={submitSearch} className="mb-4">
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search the store…"
                className="w-full rounded-full border border-ink/15 bg-white px-4 py-3 text-sm outline-none"
              />
            </form>

            <details className="rounded-2xl bg-white">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold">
                Shop all ▾
              </summary>
              <div className="space-y-2 px-3 pb-3 text-sm font-medium">
                <Link prefetch={prefetch} href="/shop" className="block rounded-xl bg-ink px-4 py-3 text-cream">
                  Shop everything
                </Link>
                {groups.map((group) => (
                  <details key={group.slug} className="group/dep rounded-xl bg-sand/70">
                    <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-4 py-3 [&::-webkit-details-marker]:hidden">
                      <Link prefetch={prefetch} href={`/shop?group=${group.slug}`}>
                        {group.name}
                      </Link>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="shrink-0 text-ink/40 transition group-open/dep:rotate-180"
                      >
                        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <div className="grid grid-cols-2 gap-2 px-3 pb-3 pt-1">
                      {group.subcategories.map((cat) => (
                        <Link prefetch={prefetch}
                          key={cat.slug}
                          href={`/shop?category=${cat.slug}`}
                          className="rounded-xl bg-white px-4 py-3"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </details>
                ))}
                <Link prefetch={prefetch} href="/shop?sale=1" className="block rounded-xl bg-flame px-4 py-3 text-white">
                  Sale
                </Link>
              </div>
            </details>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-medium">
              <Link prefetch={prefetch} href="/tshidi" className="rounded-xl bg-white px-4 py-3">
                Meet Tshidi
              </Link>
              <Link prefetch={prefetch} href="/faq" className="rounded-xl bg-white px-4 py-3">
                FAQ
              </Link>
              <Link prefetch={prefetch} href="/delivery" className="rounded-xl bg-white px-4 py-3">
                Delivery
              </Link>
              <Link prefetch={prefetch} href="/policies" className="rounded-xl bg-white px-4 py-3">
                Policies
              </Link>
              <Link prefetch={prefetch} href="/track" className="col-span-2 rounded-xl bg-ink px-4 py-3 text-cream">
                Track order
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
