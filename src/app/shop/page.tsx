import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/ProductCard";
import { ShopFilters, SortSelect } from "@/components/ShopFilters";
import { getBrands, getCategories, getProductsByIds, searchProducts, type SortKey } from "@/lib/catalog";
import { getActiveDeal } from "@/lib/deals";
import { getActiveCombos, comboProductIdSet } from "@/lib/combos";
import { getActivePools, poolProductIdSet, poolRuleText } from "@/lib/pools";
import { formatMoney } from "@/lib/format";
import { CATEGORY_GROUPS, categorySlugsInGroup, groupCategories } from "@/lib/category-groups";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function toList(value: string | undefined) {
  return (value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const category = readParam(params, "category");
  const group = readParam(params, "group");
  const q = readParam(params, "q");
  const title = q ? `Search: ${q}` : category || group ? `Shop ${category || group}` : "Shop all products";
  return { title };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const category = readParam(params, "category");
  const group = readParam(params, "group");
  const q = readParam(params, "q");
  const brands = toList(readParam(params, "brand"));
  const sizes = toList(readParam(params, "size"));
  const sort = (readParam(params, "sort") as SortKey | undefined) ?? "featured";
  const onSale = readParam(params, "sale") === "1";
  const min = Number(readParam(params, "min"));
  const max = Number(readParam(params, "max"));
  const page = Math.max(1, Number(readParam(params, "page")) || 1);

  const [categories, brandFacets, activeDeal, activeCombos, activePools] = await Promise.all([
    getCategories(),
    getBrands(),
    getActiveDeal(),
    getActiveCombos(),
    getActivePools(),
  ]);

  // A department link (e.g. "Shoes") filters by every subcategory slug under it; a
  // specific subcategory (e.g. "Sneakers") wins if both are somehow present.
  const groupCategorySlugs = group ? categorySlugsInGroup(categories, group) : [];

  const results = await searchProducts({
    category: category || (group ? groupCategorySlugs : undefined),
    q,
    brands,
    sizes,
    sort,
    onSale,
    minPrice: Number.isFinite(min) && min > 0 ? min : undefined,
    maxPrice: Number.isFinite(max) && max > 0 ? max : undefined,
    page,
    perPage: 14,
  });

  const comboProductIds = comboProductIdSet(activeCombos);
  const poolProductIds = poolProductIdSet(activePools);
  // Only fetch the (tiny) product info needed to label each combo pair, and only on the
  // Sale page where the banner actually renders.
  const comboPairs = onSale
    ? await Promise.all(
        activeCombos.map(async (combo) => {
          const rows = await getProductsByIds([combo.productAId, combo.productBId]);
          const byId = new Map(rows.map((r) => [r.id, r]));
          return { combo, a: byId.get(combo.productAId) ?? null, b: byId.get(combo.productBId) ?? null };
        }),
      )
    : [];

  const activeCategory = categories.find((cat) => cat.slug === category);
  const activeGroup = !activeCategory && group ? CATEGORY_GROUPS.find((g) => g.slug === group) : undefined;
  const heading = activeCategory?.name ?? activeGroup?.name;
  const tagline =
    activeCategory?.tagline ??
    activeGroup?.tagline ??
    "Branded sneakers, clothing, bags, watches, cookware and furniture — all in stock and ready to ship.";

  const pageHref = (target: number) => {
    const next = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === "string" && key !== "page") next.set(key, value);
    });
    next.set("page", String(target));
    return `/shop?${next.toString()}`;
  };

  return (
    <div>
      <section className="border-b border-ink/10 bg-ink py-12 text-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav className="text-[11px] font-bold uppercase tracking-[0.25em] text-cream/45">
            <Link href="/" className="hover:text-volt">
              Home
            </Link>
            <span className="px-2">/</span>
            <span className="text-volt">{heading ?? "Shop"}</span>
          </nav>
          <h1 className="display-tight mt-3 text-4xl font-black sm:text-6xl">
            {q ? `“${q}”` : heading ?? "Everything in store"}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-cream/60">{tagline}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <Suspense fallback={<div className="h-64 rounded-3xl bg-sand/60" />}>
            <ShopFilters groups={groupCategories(categories)} brands={brandFacets} />
          </Suspense>
        </aside>

        <section>
          {onSale && (activeDeal || comboPairs.length > 0 || activePools.length > 0) ? (
            <div className="mb-6 space-y-3">
              {activeDeal ? (
                <div className="rounded-2xl bg-ink p-4 text-cream">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-volt">
                    Discount of the day
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {activeDeal.scope === "store"
                      ? `−${activeDeal.percentOff}% off everything in store, today only.`
                      : `−${activeDeal.percentOff}% on one hand-picked item today.`}
                  </p>
                </div>
              ) : null}
              {comboPairs.length > 0 ? (
                <div className="rounded-2xl bg-flame/10 p-4 ring-1 ring-flame/20">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-flame">
                    Combo deals — buy both, save
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {comboPairs.map(({ combo, a, b }) =>
                      a && b ? (
                        <span
                          key={combo.id}
                          className="rounded-full bg-white px-3 py-1.5 text-xs font-bold ring-1 ring-ink/10"
                        >
                          {a.name} + {b.name} — save {combo.percentOff}% on both
                        </span>
                      ) : null,
                    )}
                  </div>
                </div>
              ) : null}
              {activePools.length > 0 ? (
                <div className="rounded-2xl bg-flame/10 p-4 ring-1 ring-flame/20">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-flame">
                    Bundle deals — mix and match
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activePools.map((pool) => (
                      <span
                        key={pool.id}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-bold ring-1 ring-ink/10"
                      >
                        {pool.name} — {poolRuleText(pool, formatMoney)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink/60">
              <span className="font-black text-ink">{results.total}</span> product
              {results.total === 1 ? "" : "s"} found
            </p>
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>

          {results.items.length === 0 ? (
            <div className="rounded-3xl bg-white p-14 text-center ring-1 ring-ink/5">
              <p className="text-5xl">🔍</p>
              <h2 className="mt-4 text-2xl font-black">Nothing matched that</h2>
              <p className="mt-2 text-sm text-ink/55">
                Try clearing a filter or search for a brand like &quot;Nike&quot; or &quot;Tefal&quot;.
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-cream"
              >
                Reset the shop
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
              {results.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  deal={activeDeal}
                  comboProductIds={comboProductIds}
                  poolProductIds={poolProductIds}
                />
              ))}
            </div>
          )}

          {results.pageCount > 1 ? (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: results.pageCount }, (_, index) => index + 1).map((num) => (
                <Link
                  key={num}
                  href={pageHref(num)}
                  scroll
                  className={`grid h-10 w-10 place-items-center rounded-full text-sm font-black transition ${
                    num === results.page
                      ? "bg-ink text-cream"
                      : "bg-white ring-1 ring-ink/10 hover:ring-ink"
                  }`}
                >
                  {num}
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
