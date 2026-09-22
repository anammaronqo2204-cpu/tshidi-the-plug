import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartPanel } from "@/components/AddToCartPanel";
import { BackButton } from "@/components/BackButton";
import { DealCountdown } from "@/components/DealCountdown";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { StarRating } from "@/components/StarRating";
import { getCategory, getProductBySlug, getProductsByIds, getRelatedProducts } from "@/lib/catalog";
import { discountPercent, formatMoney } from "@/lib/format";
import { site } from "@/lib/site";
import { dealForProduct, dealPriceCents, getActiveDeal } from "@/lib/deals";
import { getActiveCombos } from "@/lib/combos";
import { getActivePools, poolRuleText } from "@/lib/pools";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return { title: product.name, description: product.description };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [category, related, activeDeal, activeCombos, activePools] = await Promise.all([
    getCategory(product.categorySlug),
    getRelatedProducts(product, 4),
    getActiveDeal(),
    getActiveCombos(),
    getActivePools(),
  ]);

  const matchingPool = activePools.find((pool) => pool.productIds.includes(product.id));

  const matchingCombo = activeCombos.find(
    (combo) => combo.productAId === product.id || combo.productBId === product.id,
  );
  const comboPartnerId = matchingCombo
    ? matchingCombo.productAId === product.id
      ? matchingCombo.productBId
      : matchingCombo.productAId
    : null;
  const comboPartner = comboPartnerId ? (await getProductsByIds([comboPartnerId]))[0] ?? null : null;

  const lineDeal = dealForProduct(activeDeal, product.id);
  const effectivePrice = lineDeal
    ? dealPriceCents(product.priceCents, lineDeal.percentOff)
    : product.priceCents;
  const off = discountPercent(product.priceCents, product.compareAtCents);
  const distinctSizePrices = product.sizePricing ? new Set(Object.values(product.sizePricing)) : null;
  const showFrom = !lineDeal && (distinctSizePrices?.size ?? 0) > 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <BackButton className="mb-3" />
      <nav className="text-[11px] font-bold uppercase tracking-[0.25em] text-ink/40">
        <Link href="/" className="hover:text-flame">
          Home
        </Link>
        <span className="px-2">/</span>
        <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-flame">
          {category?.name ?? "Shop"}
        </Link>
        <span className="px-2">/</span>
        <span className="text-ink">{product.brand}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr]">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-ink px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cream">
              {product.brand}
            </span>
            {product.isNew ? (
              <span className="rounded-full bg-volt px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]">
                New in
              </span>
            ) : null}
            {lineDeal ? (
              <span className="rounded-full bg-cocoa px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-volt">
                Deal of the day −{lineDeal.percentOff}%
              </span>
            ) : off > 0 ? (
              <span className="rounded-full bg-flame px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                Save {off}%
              </span>
            ) : null}
          </div>

          <h1 className="display-tight mt-4 text-4xl font-black sm:text-5xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <StarRating rating={product.rating} reviews={product.reviewCount} size="md" />
            <span className="text-xs font-semibold text-ink/45">
              {product.soldCount}+ sold · {product.colorway}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            {showFrom ? <span className="pb-1 text-sm font-semibold text-ink/45">From</span> : null}
            <span className={`text-4xl font-black ${lineDeal ? "text-cocoa" : ""}`}>
              {formatMoney(effectivePrice)}
            </span>
            {lineDeal ? (
              <span className="pb-1 text-lg font-semibold text-ink/35 line-through">
                {formatMoney(product.priceCents)}
              </span>
            ) : product.compareAtCents ? (
              <span className="pb-1 text-lg font-semibold text-ink/35 line-through">
                {formatMoney(product.compareAtCents)}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs font-semibold text-ink/50">
            100% upfront · or 3 × {formatMoney(Math.round(effectivePrice / 3))} on lay-bye (product
            delivered after the final payment) · VAT included
          </p>

          {lineDeal ? (
            <div className="mt-5 rounded-2xl bg-ink p-4 text-cream">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-volt">
                Discount of the day — today only
              </p>
              <div className="mt-3">
                <DealCountdown endsAt={lineDeal.endsAt.toISOString()} variant="dark" />
              </div>
            </div>
          ) : null}

          {matchingCombo && comboPartner ? (
            <Link
              href={`/product/${comboPartner.slug}`}
              className="mt-5 flex items-center gap-3 rounded-2xl bg-flame/10 p-4 ring-1 ring-flame/20 transition hover:bg-flame/15"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={comboPartner.images[0]}
                alt=""
                className="h-14 w-14 shrink-0 rounded-xl object-cover"
              />
              <p className="text-xs font-bold leading-snug text-ink">
                🔗 Buy this with <span className="text-flame">{comboPartner.name}</span> and save{" "}
                {matchingCombo.percentOff}% on both — discount applies automatically in your cart.
              </p>
            </Link>
          ) : null}

          {matchingPool ? (
            <div className="mt-5 rounded-2xl bg-flame/10 p-4 ring-1 ring-flame/20">
              <p className="text-xs font-bold leading-snug text-ink">
                🎁 Part of the <span className="text-flame">{matchingPool.name}</span> bundle —{" "}
                {poolRuleText(matchingPool, formatMoney)}, mix and match with anything else in the
                pool. Applies automatically in your cart.
              </p>
            </div>
          ) : null}

          <p className="mt-6 text-sm leading-relaxed text-ink/70">{product.description}</p>

          <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-ink/5">
            {product.stock > 0 ? (
              <p className="text-xs font-bold text-emerald-600">
                ● In stock — {product.stock} available · {site.processingDays} processing
              </p>
            ) : (
              <p className="text-xs font-bold text-flame">
                ● Sold out — WhatsApp us to join the restock list
              </p>
            )}
          </div>

          <div className="mt-6">
            <AddToCartPanel
              productId={product.id}
              sizes={product.sizes}
              stock={product.stock}
              sizePricing={product.sizePricing ?? null}
              dealPercentOff={lineDeal?.percentOff ?? null}
            />
          </div>

          <ul className="mt-7 grid gap-2 sm:grid-cols-2">
            {product.details.map((detail) => (
              <li
                key={detail}
                className="flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-semibold ring-1 ring-ink/5"
              >
                <span className="text-volt">◆</span>
                <span className="text-ink/70">{detail}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 space-y-3 text-sm">
            <details className="group rounded-2xl bg-white p-4 ring-1 ring-ink/5" open>
              <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.2em]">
                Delivery &amp; collection
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-ink/60">
                Orders are processed in {site.processingDays}, then {site.courierName} delivers:{" "}
                <span className="font-bold text-ink">R100</span> in Gauteng,{" "}
                <span className="font-bold text-ink">R200</span> outside Gauteng. Free same-day
                collection available in {site.city.split(",")[0]}.
              </p>
            </details>
            <details className="group rounded-2xl bg-white p-4 ring-1 ring-ink/5">
              <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.2em]">
                Returns &amp; size exchanges
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-ink/60">
                Unworn items in original packaging can be exchanged within 7 days. Message us on
                WhatsApp ({site.phone}) and we&apos;ll arrange the swap.
              </p>
            </details>
            <details className="group rounded-2xl bg-white p-4 ring-1 ring-ink/5">
              <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.2em]">
                Authenticity promise
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-ink/60">
                Every branded item is sourced from authorised suppliers and inspected before
                dispatch. If anything is ever off, we refund you in full.
              </p>
            </details>
          </div>
        </div>
      </div>

      {related.length ? (
        <section className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="display-tight text-3xl font-black sm:text-4xl">
              Goes well with this
            </h2>
            <Link
              href={`/shop?category=${product.categorySlug}`}
              className="text-xs font-black uppercase tracking-[0.2em] underline underline-offset-4 hover:text-flame"
            >
              More {category?.name ?? "products"}
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} deal={activeDeal} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
