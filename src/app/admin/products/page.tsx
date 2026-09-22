import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, type Product } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { createCategory, updateCategory, createProduct, updateProduct, adjustStock } from "@/lib/admin-actions";
import { formatMoney } from "@/lib/format";
import { CATEGORY_GROUPS, groupCategories } from "@/lib/category-groups";
import ImageUrlsField from "@/components/ImageUrlsField";
import BulkZipUpload from "@/components/BulkZipUpload";
import RemoveProductButton from "@/components/RemoveProductButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory admin" };

const input = "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-flame";
const label = "text-[10px] font-black uppercase tracking-[0.2em] text-ink/45";

function ProductFields({
  product,
  categoryGroups,
  compact = false,
}: {
  product?: Product;
  categoryGroups: { slug: string; name: string; subcategories: { slug: string; name: string }[] }[];
  compact?: boolean;
}) {
  return (
    <div className={`grid gap-3 ${compact ? "lg:grid-cols-2" : "md:grid-cols-2"}`}>
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <div>
        <label className={label}>Product name</label>
        <input name="name" required defaultValue={product?.name} className={`${input} mt-1`} />
      </div>
      <div>
        <label className={label}>Slug</label>
        <input name="slug" defaultValue={product?.slug} className={`${input} mt-1`} placeholder="auto-generated if blank" />
      </div>
      <div>
        <label className={label}>Brand</label>
        <input name="brand" required defaultValue={product?.brand} className={`${input} mt-1`} />
      </div>
      <div>
        <label className={label}>Category</label>
        <select name="categorySlug" defaultValue={product?.categorySlug ?? "sneakers"} className={`${input} mt-1`}>
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
      <div>
        <label className={label}>Price in rand</label>
        <input name="price" required defaultValue={product ? product.priceCents / 100 : ""} className={`${input} mt-1`} placeholder="1299" />
      </div>
      <div>
        <label className={label}>Compare-at price</label>
        <input name="compareAt" defaultValue={product?.compareAtCents ? product.compareAtCents / 100 : ""} className={`${input} mt-1`} placeholder="1599" />
      </div>
      <div>
        <label className={label}>Stock units</label>
        <input name="stock" type="number" min="0" defaultValue={product?.stock ?? 10} className={`${input} mt-1`} />
      </div>
      <div>
        <label className={label}>Colour / colourway</label>
        <input name="colorway" defaultValue={product?.colorway} className={`${input} mt-1`} placeholder="Chocolate / cream" />
      </div>
      <div>
        <label className={label}>Rating</label>
        <input name="rating" defaultValue={product?.rating ?? 4.8} className={`${input} mt-1`} />
      </div>
      <div>
        <label className={label}>Review count</label>
        <input name="reviewCount" type="number" min="0" defaultValue={product?.reviewCount ?? 0} className={`${input} mt-1`} />
      </div>
      <div className="md:col-span-2">
        <label className={label}>Sizes, separated by commas or lines</label>
        <textarea name="sizes" rows={2} defaultValue={(product?.sizes ?? ["One Size"]).join(", ")} className={`${input} mt-1`} />
      </div>
      <ImageUrlsField initialImages={product?.images ?? []} />
      <div className="md:col-span-2">
        <label className={label}>Description</label>
        <textarea name="description" required rows={3} defaultValue={product?.description} className={`${input} mt-1`} />
      </div>
      <div className="md:col-span-2">
        <label className={label}>Details / bullet points</label>
        <textarea name="details" rows={3} defaultValue={(product?.details ?? []).join("\n")} className={`${input} mt-1`} />
      </div>
      <div className="flex flex-wrap gap-4 md:col-span-2">
        <label className="flex items-center gap-2 text-xs font-bold">
          <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured} className="accent-[#8a5a44]" />
          Featured on homepage
        </label>
        <label className="flex items-center gap-2 text-xs font-bold">
          <input type="checkbox" name="isNew" defaultChecked={product?.isNew} className="accent-[#8a5a44]" />
          New arrival
        </label>
      </div>
    </div>
  );
}

export default async function AdminProductsPage() {
  await ensureSeeded();
  const [categoryRows, productRows] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select().from(products).orderBy(desc(products.id)),
  ]);

  const categoryOptions = categoryRows.map((item) => ({ slug: item.slug, name: item.name }));
  const categoryGroups = groupCategories(categoryRows);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-flame">Inventory</p>
          <h1 className="display-tight mt-2 text-4xl font-black sm:text-6xl">Products & stock</h1>
          <p className="mt-3 max-w-2xl text-sm text-ink/55">
            Add products, paste clear image URLs, update prices, manage stock and remove inventory from the live shop.
          </p>
        </div>
        <Link prefetch={false} href="/admin" className="rounded-full border border-ink/15 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.2em]">
          Back to dashboard
        </Link>
      </div>

      <section className="glass-neutral mt-8 rounded-3xl p-6">
        <h2 className="text-xl font-black">Add a new product</h2>
        <form action={createProduct} className="mt-5">
          <ProductFields categoryGroups={categoryGroups} />
          <button className="mt-5 rounded-full bg-ink px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-cream hover:bg-flame">
            Add product to shop
          </button>
        </form>
      </section>

      <BulkZipUpload categoryOptions={categoryOptions} />

      <section className="glass-neutral mt-6 rounded-3xl p-6">
        <h2 className="text-xl font-black">Add a subcategory</h2>
        <p className="mt-1 text-sm text-ink/55">
          Every subcategory nests under one of the 4 departments (Shoes, Clothing, Accessories, House &amp; Home) —
          that&rsquo;s what powers the Shop dropdown and filters.
        </p>
        <form action={createCategory} className="mt-4 grid gap-3 md:grid-cols-5">
          <select name="groupSlug" required defaultValue={CATEGORY_GROUPS[0].slug} className={input}>
            {CATEGORY_GROUPS.map((group) => (
              <option key={group.slug} value={group.slug}>
                {group.name}
              </option>
            ))}
          </select>
          <input name="name" required placeholder="Jewellery" className={input} />
          <input name="slug" placeholder="jewellery" className={input} />
          <input name="tagline" placeholder="Rings, chains & earrings" className={`${input} md:col-span-2`} />
          <input name="imageUrl" placeholder="Category image URL" className={input} />
          <input name="sortOrder" type="number" placeholder="Sort order" className={input} />
          <button className="rounded-full bg-flame px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white md:col-span-4">
            Save subcategory
          </button>
        </form>
      </section>

      <section className="glass-neutral mt-6 rounded-3xl p-6">
        <h2 className="text-xl font-black">Manage subcategories</h2>
        <p className="mt-1 text-sm text-ink/55">
          Move a subcategory to the right department, rename it, or change its position. This is also how you fix a
          subcategory that ended up under the wrong department &mdash; pick the correct one below and save.
        </p>
        <div className="mt-4 space-y-3">
          {categoryRows.map((category) => (
            <details key={category.id} className="rounded-2xl bg-sand/40 p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-ink/40">
                      {CATEGORY_GROUPS.find((g) => g.slug === category.groupSlug)?.name ?? category.groupSlug}
                    </p>
                    <h3 className="text-base font-black">{category.name}</h3>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-flame">Edit</span>
                </div>
              </summary>
              <form action={updateCategory} className="mt-4 grid gap-3 md:grid-cols-5">
                <input type="hidden" name="id" value={category.id} />
                <select name="groupSlug" required defaultValue={category.groupSlug} className={input}>
                  {CATEGORY_GROUPS.map((group) => (
                    <option key={group.slug} value={group.slug}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <input name="name" required defaultValue={category.name} className={input} />
                <input name="tagline" defaultValue={category.tagline} className={`${input} md:col-span-2`} />
                <input name="sortOrder" type="number" defaultValue={category.sortOrder} className={input} />
                <input name="imageUrl" defaultValue={category.imageUrl} placeholder="Category image URL" className={`${input} md:col-span-4`} />
                <button className="rounded-full bg-ink px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-cream hover:bg-flame md:col-span-1">
                  Save
                </button>
              </form>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black">Live inventory ({productRows.length})</h2>
          <p className="text-xs font-semibold text-ink/45">Changes publish instantly.</p>
        </div>
        <div className="space-y-4">
          {productRows.map((product) => (
            <details key={product.id} className="rounded-3xl bg-white p-4 ring-1 ring-ink/5">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.images[0]} alt="" loading="lazy" decoding="async" className="h-20 w-20 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-ink/40">
                      {product.brand} · {product.categorySlug}
                    </p>
                    <h3 className="line-clamp-1 text-lg font-black">{product.name}</h3>
                    <p className="text-xs text-ink/50">
                      {formatMoney(product.priceCents)} · {product.stock} units · {product.images.length} image(s)
                    </p>
                  </div>
                  <Link prefetch={false} href={`/product/${product.slug}`} className="rounded-full border border-ink/15 px-4 py-2 text-[11px] font-black uppercase tracking-widest hover:border-flame hover:text-flame">
                    View
                  </Link>
                  <RemoveProductButton id={product.id} name={product.name} />
                </div>
              </summary>

              <div className="mt-6 border-t border-ink/10 pt-6">
                <form action={adjustStock} className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl bg-sand/50 p-4">
                  <input type="hidden" name="id" value={product.id} />
                  <div>
                    <label className={label}>Quick stock update</label>
                    <input name="stock" type="number" min="0" defaultValue={product.stock} className={`${input} mt-1 w-32`} />
                  </div>
                  <button className="rounded-full bg-ink px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-cream">
                    Update stock
                  </button>
                </form>

                <form action={updateProduct}>
                  <ProductFields product={product} categoryGroups={categoryGroups} compact />
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button className="rounded-full bg-ink px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-cream hover:bg-flame">
                      Save product changes
                    </button>
                  </div>
                </form>
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
