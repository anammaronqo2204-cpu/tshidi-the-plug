"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";

type PoolProduct = {
  id: number;
  name: string;
  brand: string;
  categorySlug: string;
  priceCents: number;
  stock: number;
  image: string;
};

const chip =
  "rounded-full border border-ink/15 bg-white px-3 py-1.5 text-[11px] font-bold hover:border-flame hover:text-flame";
const chipActive = "rounded-full bg-ink px-3 py-1.5 text-[11px] font-bold text-cream";

export function PoolProductPicker({
  products,
  categories,
}: {
  products: PoolProduct[];
  categories: { slug: string; name: string }[];
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [category, setCategory] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [search, setSearch] = useState("");

  const categoryName = useMemo(
    () => new Map(categories.map((c) => [c.slug, c.name])),
    [categories],
  );
  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category && p.categorySlug !== category) return false;
      if (brand && p.brand !== brand) return false;
      if (term && !`${p.name} ${p.brand}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [products, category, brand, search]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((p) => next.add(p.id));
      return next;
    });
  }

  function clearFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((p) => next.delete(p.id));
      return next;
    });
  }

  function clearAll() {
    setSelected(new Set());
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <input type="hidden" name="productIds" value={Array.from(selected).join(",")} readOnly />

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-bold"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-bold"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="min-w-[160px] flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2 text-xs font-bold"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={selectFiltered} className={chip}>
          ✓ Select all {filtered.length} shown
        </button>
        <button type="button" onClick={clearFiltered} className={chip}>
          Unselect shown
        </button>
        {selected.size > 0 ? (
          <button type="button" onClick={clearAll} className={chip}>
            Clear all ({selected.size} selected)
          </button>
        ) : null}
        <span className="ml-auto text-[11px] font-black uppercase tracking-wider text-ink/40">
          {selected.size} selected
        </span>
      </div>

      <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-ink/10">
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-xs font-semibold text-ink/40">No products match.</p>
        ) : (
          filtered.map((p) => {
            const isSelected = selected.has(p.id);
            return (
              <label
                key={p.id}
                className={`flex cursor-pointer items-center gap-3 border-b border-ink/5 px-3 py-2 text-xs last:border-b-0 hover:bg-sand/40 ${
                  isSelected ? "bg-flame/5" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(p.id)}
                  className="h-4 w-4 accent-flame"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" className="h-8 w-8 rounded-lg object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{p.name}</span>
                  <span className="block text-[10px] font-semibold text-ink/40">
                    {p.brand} · {categoryName.get(p.categorySlug) ?? p.categorySlug} ·{" "}
                    {formatMoney(p.priceCents)} · {p.stock} in stock
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
