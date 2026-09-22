import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";

export async function getLiveTestimonials(limit = 12) {
  await ensureSeeded();
  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.isLive, true))
    .orderBy(asc(testimonials.sortOrder), desc(testimonials.id))
    .limit(limit);
}

export async function getAllTestimonials() {
  await ensureSeeded();
  return db.select().from(testimonials).orderBy(asc(testimonials.sortOrder), desc(testimonials.id));
}
