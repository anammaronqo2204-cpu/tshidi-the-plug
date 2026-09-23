"use client";

import { useId, useState } from "react";

const input = "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-flame";

const QUICK_PICKS: { label: string; sizes: string }[] = [
  { label: "Adult shoes (4–12)", sizes: "4, 5, 6, 7, 8, 9, 10, 11, 12" },
  { label: "Kids shoes (10–3)", sizes: "10, 11, 12, 13, 1, 2, 3" },
  { label: "Clothing (S–XL)", sizes: "S, M, L, XL" },
  { label: "Waist sizes (26–40)", sizes: "26, 28, 30, 32, 34, 36, 38, 40" },
  { label: "Hair lengths (10–22)", sizes: "10, 12, 14, 16, 18, 20, 22" },
  { label: "One size", sizes: "One Size" },
];

/**
 * Optional per-subcategory size override. Leave blank and products in this subcategory
 * fall back to their department's default (Shoes -> 4–12, Clothing -> S–XL, etc).
 * Fill this in only for the subcategories that genuinely need their own sizing, like
 * "Kids Shoes" under Shoes, or "Pants" under Clothing.
 */
export default function SizePresetField({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  const reactId = useId();

  return (
    <div className="md:col-span-5">
      <label htmlFor={`${reactId}-preset`} className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/45">
        Size override for this subcategory (optional — leave blank to use the department default)
      </label>
      <input
        id={`${reactId}-preset`}
        name="sizePreset"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. 10, 11, 12, 13, 1, 2, 3"
        className={`${input} mt-1`}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {QUICK_PICKS.map((pick) => (
          <button
            key={pick.label}
            type="button"
            onClick={() => setValue(pick.sizes)}
            className="rounded-full border border-ink/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-ink/60 hover:border-flame hover:text-flame"
          >
            {pick.label}
          </button>
        ))}
        {value ? (
          <button
            type="button"
            onClick={() => setValue("")}
            className="rounded-full border border-flame/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-flame hover:bg-flame hover:text-white"
          >
            Clear — use department default
          </button>
        ) : null}
      </div>
    </div>
  );
}
