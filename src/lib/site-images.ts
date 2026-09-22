import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

// Keys in the generic `settings` key/value table used for the site's marketing photos —
// the ones baked into the homepage/about/story pages, as opposed to product photos
// (which live on each product row instead).
export const SITE_IMAGE_KEYS = {
  hero: "site_image_hero", // Homepage hero banner (right-hand image + social share image)
  homeBanner: "site_image_home_banner", // "Kit out the kitchen" banner
  owner: "site_image_owner", // Tshidi/about photo, reused on 3 pages
} as const;

export type SiteImageKey = keyof typeof SITE_IMAGE_KEYS;

export type SiteImages = Record<SiteImageKey, string>;

const EMPTY_IMAGES: SiteImages = { hero: "", homeBanner: "", owner: "" };

/** Reads all site marketing photos at once. Returns "" for any not yet set. */
export async function getSiteImages(): Promise<SiteImages> {
  try {
    const rows = await db.select().from(settings);
    const byKey = new Map(rows.map((row) => [row.key, row.value]));
    return {
      hero: byKey.get(SITE_IMAGE_KEYS.hero) ?? "",
      homeBanner: byKey.get(SITE_IMAGE_KEYS.homeBanner) ?? "",
      owner: byKey.get(SITE_IMAGE_KEYS.owner) ?? "",
    };
  } catch {
    // DB not reachable (e.g. during build) — fall back to empty so pages can
    // still render a placeholder instead of crashing.
    return EMPTY_IMAGES;
  }
}

/** Reads a single site marketing photo. Returns "" if not yet set. */
export async function getSiteImage(key: SiteImageKey): Promise<string> {
  try {
    const [row] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, SITE_IMAGE_KEYS[key]))
      .limit(1);
    return row?.value ?? "";
  } catch {
    return "";
  }
}
