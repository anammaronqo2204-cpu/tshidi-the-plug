"use client";

import { useId, useState } from "react";

const input = "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-flame";
const label = "text-[10px] font-black uppercase tracking-[0.2em] text-ink/45";

type CategoryGroup = { slug: string; name: string; subcategories: { slug: string; name: string }[] };

/**
 * Category picker + sizes box, wired together: picking a category fills the sizes
 * box with that category's default (department default, or the subcategory's own
 * override if one is set in Manage Subcategories) — so sizing stays consistent
 * without retyping it on every product. Still just fills the box; edit freely after.
 */
export default function CategorySizeFields({
  categoryGroups,
  defaultSizesBySlug,
  initialCategorySlug,
  initialSizes,
}: {
  categoryGroups: CategoryGroup[];
  defaultSizesBySlug: Record<string, string>;
  initialCategorySlug: string;
  initialSizes: string;
}) {
  const [categorySlug, setCategorySlug] = useState(initialCategorySlug);
  const [sizes, setSizes] = useState(initialSizes);
  const reactId = useId();

  function handleCategoryChange(slug: string) {
    setCategorySlug(slug);
    const fallback = defaultSizesBySlug[slug];
    if (fallback) setSizes(fallback);
  }

  function resetToDefault() {
    const fallback = defaultSizesBySlug[categorySlug];
    if (fallback) setSizes(fallback);
  }

  return (
    <>
      <div>
        <label htmlFor={`${reactId}-category`} className={label}>
          Category
        </label>
        <select
          id={`${reactId}-category`}
          name="categorySlug"
          value={categorySlug}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className={`${input} mt-1`}
        >
          {categoryGroups.map((group) => (
            <optgroup key={group.slug} label={group.name}>
              {group.subcategories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={`${reactId}-sizes`} className={label}>
            Sizes, separated by commas or lines
          </label>
          <button
            type="button"
            onClick={resetToDefault}
            className="rounded-full border border-ink/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-ink/60 hover:border-flame hover:text-flame"
          >
            Use default for this category
          </button>
        </div>
        <textarea
          id={`${reactId}-sizes`}
          name="sizes"
          rows={2}
          value={sizes}
          onChange={(e) => setSizes(e.target.value)}
          className={`${input} mt-1`}
        />
      </div>
    </>
  );
}
