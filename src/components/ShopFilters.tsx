"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

type Group = {
  slug: string;
  name: string;
  subcategories: { slug: string; name: string }[];
};

type Props = {
  groups: Group[];
  brands: { brand: string; count: number }[];
};

const SNEAKER_SIZES = ["UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"];
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "2XL"];

const PRICE_BANDS = [
  { label: "Under R1 000", min: 0, max: 100000 },
  { label: "R1 000 – R2 000", min: 100000, max: 200000 },
  { label: "R2 000 – R3 500", min: 200000, max: 350000 },
  { label: "R3 500+", min: 350000, max: undefined },
];

export function ShopFilters({ groups, brands }: Props) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const apply = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      next.delete("page");
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const toggleMulti = (key: string, value: string) =>
    apply((next) => {
      const current = new Set((next.get(key) ?? "").split(",").filter(Boolean));
      if (current.has(value)) current.delete(value);
      else current.add(value);
      if (current.size) next.set(key, Array.from(current).join(","));
      else next.delete(key);
    });

  const activeBrands = new Set((params.get("brand") ?? "").split(",").filter(Boolean));
  const activeSizes = new Set((params.get("size") ?? "").split(",").filter(Boolean));
  const activeCategory = params.get("category") ?? "";
  const activeGroup = params.get("group") ?? "";
  const onSale = params.get("sale") === "1";
  const min = params.get("min");
  const max = params.get("max");

  const hasFilters =
    activeBrands.size > 0 ||
    activeSizes.size > 0 ||
    !!activeCategory ||
    !!activeGroup ||
    onSale ||
    !!min ||
    !!max;

  const selectGroup = (slug: string) =>
    apply((next) => {
      next.delete("category");
      if (activeGroup === slug) next.delete("group");
      else next.set("group", slug);
    });

  const selectCategory = (slug: string) =>
    apply((next) => {
      next.delete("group");
      if (activeCategory === slug) next.delete("category");
      else next.set("category", slug);
    });

  const panel = (
    <div className="space-y-7">
      <div>
        <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-ink/45">Department</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              apply((next) => {
                next.delete("category");
                next.delete("group");
              })
            }
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              activeCategory === "" && activeGroup === ""
                ? "border-ink bg-ink text-cream"
                : "border-ink/15 hover:border-ink"
            }`}
          >
            All
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {groups.map((group) => (
            <div key={group.slug}>
              <button
                type="button"
                onClick={() => selectGroup(group.slug)}
                className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide transition ${
                  activeGroup === group.slug
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/15 hover:border-ink"
                }`}
              >
                {group.name}
              </button>
              <div className="mt-2 flex flex-wrap gap-2 pl-1">
                {group.subcategories.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => selectCategory(cat.slug)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                      activeCategory === cat.slug
                        ? "border-ink bg-ink text-cream"
                        : "border-ink/15 hover:border-ink"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-ink/45">Price</h4>
        <div className="mt-3 space-y-2">
          {PRICE_BANDS.map((band) => {
            const active = min === String(band.min) && (max ?? "") === String(band.max ?? "");
            return (
              <button
                key={band.label}
                type="button"
                onClick={() =>
                  apply((next) => {
                    if (active) {
                      next.delete("min");
                      next.delete("max");
                    } else {
                      next.set("min", String(band.min));
                      if (band.max) next.set("max", String(band.max));
                      else next.delete("max");
                    }
                  })
                }
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                  active ? "bg-ink text-cream" : "bg-white hover:bg-sand"
                }`}
              >
                {band.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-ink/45">Sneaker size</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {SNEAKER_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleMulti("size", size)}
              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                activeSizes.has(size) ? "border-ink bg-ink text-cream" : "border-ink/15 hover:border-ink"
              }`}
            >
              {size.replace("UK ", "")}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-ink/45">Clothing size</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {CLOTHING_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleMulti("size", size)}
              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                activeSizes.has(size) ? "border-ink bg-ink text-cream" : "border-ink/15 hover:border-ink"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-ink/45">Brand</h4>
        <div className="no-scrollbar mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
          {brands.map((item) => (
            <label
              key={item.brand}
              className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold hover:bg-white"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={activeBrands.has(item.brand)}
                  onChange={() => toggleMulti("brand", item.brand)}
                  className="h-3.5 w-3.5 accent-[#0c0c0e]"
                />
                {item.brand}
              </span>
              <span className="text-ink/35">{item.count}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-flame/10 px-3 py-3 text-xs font-bold text-flame">
        <input
          type="checkbox"
          checked={onSale}
          onChange={() => apply((next) => (onSale ? next.delete("sale") : next.set("sale", "1")))}
          className="h-3.5 w-3.5 accent-[#ff5b2e]"
        />
        Only show items on sale
      </label>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => router.push(pathname, { scroll: false })}
          className="w-full rounded-full border border-ink/20 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition hover:border-ink"
        >
          Clear all filters
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mb-4 w-full rounded-full bg-ink py-3 text-xs font-black uppercase tracking-[0.2em] text-cream lg:hidden"
      >
        {open ? "Hide filters" : "Show filters"}
      </button>
      <div className={`${open ? "block" : "hidden"} lg:block`}>
        <div className="rounded-3xl bg-sand/60 p-5 ring-1 ring-ink/5">{panel}</div>
      </div>
    </>
  );
}

export function SortSelect() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const value = params.get("sort") ?? "featured";

  return (
    <label className="flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2.5 text-xs font-bold">
      <span className="text-ink/45">Sort</span>
      <select
        value={value}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          next.set("sort", event.target.value);
          next.delete("page");
          router.push(`${pathname}?${next.toString()}`, { scroll: false });
        }}
        className="bg-transparent pr-1 outline-none"
      >
        <option value="featured">Featured</option>
        <option value="newest">Newest</option>
        <option value="popular">Best selling</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="rating">Top rated</option>
      </select>
    </label>
  );
}
