// The site's fixed top-level departments. There are only ever a handful of these, so
// they live here as a constant rather than as their own DB table -- every `categories`
// row (a subcategory, e.g. "Sneakers") points at one of these via `groupSlug`.
export type CategoryGroup = {
  slug: string;
  name: string;
  tagline: string;
};

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { slug: "shoes", name: "Shoes", tagline: "Sneakers, formal & sandals" },
  { slug: "clothing", name: "Clothing", tagline: "Pants, tees & two-piece sets" },
  { slug: "accessories", name: "Accessories", tagline: "Bags, watches & jewellery" },
  { slug: "house-home", name: "House & Home", tagline: "Kitchen, furniture & decor" },
  { slug: "hair", name: "Hair", tagline: "Wigs, bundles & hair care" },
  { slug: "combos", name: "Combos", tagline: "Bundle deals & combo sets" },
];

export const CATEGORY_GROUP_SLUGS = CATEGORY_GROUPS.map((g) => g.slug);

export function isCategoryGroupSlug(slug: string): boolean {
  return CATEGORY_GROUP_SLUGS.includes(slug);
}

// Every subcategory under a department uses these sizes by default — set once here
// instead of retyping them per product. A subcategory can still override this (see
// `sizePreset` on the categories table) for the cases that genuinely differ, like
// "Kids Shoes" under Shoes, or "Pants" under Clothing.
export const DEPARTMENT_DEFAULT_SIZES: Record<string, string[]> = {
  shoes: ["4", "5", "6", "7", "8", "9", "10", "11", "12"],
  clothing: ["S", "M", "L", "XL"],
  hair: ["10", "12", "14", "16", "18", "20", "22"],
};

// One-click starting points offered in the admin when setting a subcategory's own size
// override. Admins can still hand-edit the field after picking one, or ignore these and
// type anything.
export const SIZE_PRESET_QUICK_PICKS: { label: string; sizes: string[] }[] = [
  { label: "Adult shoes (4–12)", sizes: ["4", "5", "6", "7", "8", "9", "10", "11", "12"] },
  { label: "Kids shoes (10–3)", sizes: ["10", "11", "12", "13", "1", "2", "3"] },
  { label: "Clothing (S–XL)", sizes: ["S", "M", "L", "XL"] },
  { label: "Waist sizes (26–40)", sizes: ["26", "28", "30", "32", "34", "36", "38", "40"] },
  { label: "One size", sizes: ["One Size"] },
];

type SizedCategory = { slug: string; groupSlug: string; sizePreset?: string | null };

/** Turns a stored "4, 5, 6" (or "4\n5\n6") string into a clean size array. */
export function parseSizeList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * The sizes a product in this subcategory should default to: the subcategory's own
 * override if it has one, otherwise its department's default, otherwise "One Size" for
 * departments (Accessories, House & Home, Hair, Combos) that don't have standard sizing.
 */
export function resolveDefaultSizes(category: SizedCategory | undefined): string[] {
  if (category?.sizePreset && category.sizePreset.trim()) {
    return parseSizeList(category.sizePreset);
  }
  const groupSlug = category?.groupSlug ?? "";
  return DEPARTMENT_DEFAULT_SIZES[groupSlug] ?? ["One Size"];
}

/** Map of categorySlug -> comma-joined default sizes, for handing to the admin's product form. */
export function buildDefaultSizesBySlug<T extends SizedCategory>(categoryRows: T[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const category of categoryRows) {
    map[category.slug] = resolveDefaultSizes(category).join(", ");
  }
  return map;
}

type LeafCategory = { slug: string; name: string; groupSlug: string };

export type GroupedCategories = CategoryGroup & { subcategories: LeafCategory[] };

/**
 * Nests a flat list of categories (as stored/queried from the DB) under their
 * department. Departments with zero subcategories are left out entirely -- we only
 * ever show a department in nav/filters once something actually lives under it.
 */
export function groupCategories<T extends LeafCategory>(categories: T[]): (CategoryGroup & { subcategories: T[] })[] {
  return CATEGORY_GROUPS.map((group) => ({
    ...group,
    subcategories: categories.filter((cat) => cat.groupSlug === group.slug),
  })).filter((group) => group.subcategories.length > 0);
}

/** Every subcategory slug that falls under a given department slug. */
export function categorySlugsInGroup<T extends LeafCategory>(categories: T[], groupSlug: string): string[] {
  return categories.filter((cat) => cat.groupSlug === groupSlug).map((cat) => cat.slug);
}