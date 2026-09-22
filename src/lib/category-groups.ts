// The site's fixed top-level departments. There are only ever a handful of these, so
// they live here as a constant rather than as their own DB table — every `categories`
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
];

export const CATEGORY_GROUP_SLUGS = CATEGORY_GROUPS.map((g) => g.slug);

export function isCategoryGroupSlug(slug: string): boolean {
  return CATEGORY_GROUP_SLUGS.includes(slug);
}

type LeafCategory = { slug: string; name: string; groupSlug: string };

export type GroupedCategories = CategoryGroup & { subcategories: LeafCategory[] };

/**
 * Nests a flat list of categories (as stored/queried from the DB) under their
 * department. Departments with zero subcategories are left out entirely — we only
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
