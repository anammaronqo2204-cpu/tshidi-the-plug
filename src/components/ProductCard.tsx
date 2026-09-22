import Link from "next/link";
import type { DailyDeal, Product } from "@/db/schema";
import { discountPercent, formatMoney } from "@/lib/format";
import { dealForProduct, dealPriceCents } from "@/lib/deals";
import { QuickAdd } from "./QuickAdd";
import { StarRating } from "./StarRating";

export function ProductCard({
  product,
  deal = null,
  comboProductIds,
  poolProductIds,
}: {
  product: Product;
  deal?: DailyDeal | null;
  comboProductIds?: Set<number>;
  poolProductIds?: Set<number>;
}) {
  const off = discountPercent(product.priceCents, product.compareAtCents);
  const lineDeal = dealForProduct(deal, product.id);
  const priceCents = lineDeal
    ? dealPriceCents(product.priceCents, lineDeal.percentOff)
    : product.priceCents;
  const soldOut = product.stock <= 0;
  const secondary = product.images[1] ?? product.images[0];
  const distinctSizePrices = product.sizePricing ? new Set(Object.values(product.sizePricing)) : null;
  const showFrom = !lineDeal && (distinctSizePrices?.size ?? 0) > 1;
  const inCombo = comboProductIds?.has(product.id) ?? false;
  const inPool = poolProductIds?.has(product.id) ?? false;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-ink/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_rgba(12,12,14,0.45)]">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-sand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105 group-hover:opacity-0"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={secondary}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition duration-700 group-hover:opacity-100"
        />

        <div className="absolute left-1.5 top-1.5 flex flex-col gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
          {lineDeal ? (
            <span className="rounded-full bg-cocoa px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-volt sm:px-2.5 sm:py-1 sm:text-[10px]">
              Deal of the day −{lineDeal.percentOff}%
            </span>
          ) : off > 0 ? (
            <span className="rounded-full bg-flame px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white sm:px-2.5 sm:py-1 sm:text-[10px]">
              -{off}%
            </span>
          ) : null}
          {product.isNew ? (
            <span className="rounded-full bg-volt px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-ink sm:px-2.5 sm:py-1 sm:text-[10px]">
              New in
            </span>
          ) : null}
          {!soldOut && product.stock <= 8 ? (
            <span className="rounded-full bg-ink px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-cream sm:px-2.5 sm:py-1 sm:text-[10px]">
              Only {product.stock} left
            </span>
          ) : null}
          {inCombo ? (
            <span className="rounded-full bg-white px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-flame ring-1 ring-flame/30 sm:px-2.5 sm:py-1 sm:text-[10px]">
              🔗 Combo deal
            </span>
          ) : null}
          {inPool ? (
            <span className="rounded-full bg-white px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-flame ring-1 ring-flame/30 sm:px-2.5 sm:py-1 sm:text-[10px]">
              🎁 Bundle deal
            </span>
          ) : null}
        </div>

        {soldOut ? (
          <span className="absolute inset-x-0 bottom-0 bg-ink/85 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.2em] text-cream sm:py-2 sm:text-[11px] sm:tracking-[0.25em]">
            Sold out
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-4">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-ink/45 sm:text-[10px] sm:tracking-[0.22em]">
            {product.brand}
          </span>
          <StarRating rating={product.rating} reviews={product.reviewCount} />
        </div>

        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-[12.5px] font-bold leading-snug transition hover:text-flame sm:text-[15px]"
        >
          {product.name}
        </Link>

        <div className="mt-auto flex items-end gap-2 pt-1">
          {showFrom ? <span className="pb-0.5 text-xs font-semibold text-ink/45">From</span> : null}
          <span className={`text-base font-black sm:text-lg ${lineDeal ? "text-cocoa" : ""}`}>
            {formatMoney(priceCents)}
          </span>
          {lineDeal ? (
            <span className="pb-0.5 text-xs font-semibold text-ink/35 line-through">
              {formatMoney(product.priceCents)}
            </span>
          ) : product.compareAtCents ? (
            <span className="pb-0.5 text-xs font-semibold text-ink/35 line-through">
              {formatMoney(product.compareAtCents)}
            </span>
          ) : null}
        </div>

        <div className="pt-2">
          <QuickAdd
            productId={product.id}
            slug={product.slug}
            sizes={product.sizes}
            soldOut={soldOut}
          />
        </div>
      </div>
    </article>
  );
}
