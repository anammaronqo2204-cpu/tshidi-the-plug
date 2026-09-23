import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { DealCountdown } from "@/components/DealCountdown";
import {
  getBestSellers,
  getCategories,
  getCategoryCounts,
  getDeals,
  getFeatured,
  getNewArrivals,
  getProductsByIds,
} from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import { groupCategories } from "@/lib/category-groups";
import { site, trustBadges } from "@/lib/site";
import { getSiteImages } from "@/lib/site-images";
import { getLiveTestimonials } from "@/lib/testimonials";
import { dealPriceCents, ensureAutoDailyDeal } from "@/lib/deals";

export const dynamic = "force-dynamic";

const brandStrip = [
  "NIKE",
  "ADIDAS",
  "JORDAN",
  "PUMA",
  "NEW BALANCE",
  "LEVI'S",
  "GUESS",
  "TOMMY HILFIGER",
  "CONVERSE",
  "FOSSIL",
  "TEFAL",
  "MICHAEL KORS",
];

const steps = [
  { n: "01", title: "Browse & bag it", copy: "Pick your size, colour and quantity. Everything on site is in stock." },
  { n: "02", title: "Checkout & pay", copy: "100% upfront by EFT — or lay-bye over 3 months (product delivered after the final payment)." },
  { n: "03", title: "Track to your door", copy: `After ${site.processingDays} of processing we hand your parcel to ${site.courierName} and WhatsApp you the tracking number.` },
];

export default async function HomePage() {
  const [categories, counts, featured, newArrivals, bestSellers, deals, testimonials, activeDeal, siteImages] =
    await Promise.all([
      getCategories(),
      getCategoryCounts(),
      getFeatured(8),
      getNewArrivals(8),
      getBestSellers(4),
      getDeals(4),
      getLiveTestimonials(6),
      ensureAutoDailyDeal(),
      getSiteImages(),
    ]);

  const departments = groupCategories(categories).map((group) => ({
    slug: group.slug,
    name: group.name,
    tagline: group.tagline,
    imageUrl: group.subcategories[0]?.imageUrl ?? "",
    count: group.subcategories.reduce((sum, cat) => sum + (counts.get(cat.slug) ?? 0), 0),
  }));

  const dealProduct =
    activeDeal && activeDeal.scope === "product" && activeDeal.productId
      ? (await getProductsByIds([activeDeal.productId]))[0] ?? null
      : null;
  const storewideDeal = activeDeal && activeDeal.scope === "store" ? activeDeal : null;

  const heroProduct = featured[0];

  return (
    <div>
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-volt/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-flame/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div className="fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-volt/40 bg-volt/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.25em] text-volt">
              ● Now shipping nationwide
            </span>

            <h1 className="display-tight mt-6 text-[clamp(2.6rem,7vw,5.2rem)] font-black">
              Everybody
              <br />
              has a plug.
              <br />
              <span className="text-volt">Yours is Tshidi.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-cream/65">
              Sneakers, clothing, bags, watches, pots and tables — all 100% authentic, all
              hand-checked by Tshidi before it leaves the shelf.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop?category=sneakers"
                className="rounded-full bg-volt px-7 py-4 text-xs font-black uppercase tracking-[0.2em] text-ink transition hover:bg-cream"
              >
                Shop sneakers
              </Link>
              <Link
                href="/shop"
                className="rounded-full border border-cream/25 px-7 py-4 text-xs font-black uppercase tracking-[0.2em] text-cream transition hover:border-volt hover:text-volt"
              >
                Browse everything
              </Link>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-cream/10 pt-6">
              {[
                ["4 800+", "Orders shipped"],
                ["4.9★", "Average rating"],
                ["48 hrs", "Dispatch time"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-2xl font-black text-volt">{value}</dt>
                  <dd className="text-[11px] uppercase tracking-widest text-cream/50">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2.5rem] ring-1 ring-cream/15">
              {siteImages.hero ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={siteImages.hero}
                  alt="Models wearing branded streetwear and sneakers from Tshidi the Plug"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center bg-cream/5 text-center text-xs font-bold uppercase tracking-widest text-cream/30">
                  Add a hero photo in Settings
                </div>
              )}
            </div>

            {heroProduct ? (
              <Link
                href={`/product/${heroProduct.slug}`}
                className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl bg-cream p-3 pr-5 text-ink shadow-2xl transition hover:-translate-y-1 sm:left-8"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroProduct.images[0]}
                  alt={heroProduct.name}
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-flame">
                    Trending now
                  </p>
                  <p className="max-w-[9rem] truncate text-sm font-black">{heroProduct.name}</p>
                  <p className="text-xs font-bold">{formatMoney(heroProduct.priceCents)}</p>
                </div>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* ---------------- TRUST ---------------- */}
      <section className="border-b border-ink/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {trustBadges.map((badge) => (
            <div key={badge.title} className="flex items-start gap-3">
              <span className="text-2xl">{badge.icon}</span>
              <div>
                <p className="text-sm font-black">{badge.title}</p>
                <p className="text-xs leading-relaxed text-ink/55">{badge.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- DISCOUNT OF THE DAY: STOREWIDE ---------------- */}
      {storewideDeal ? (
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
          <div className="luxury-ambient relative overflow-hidden rounded-[2.5rem] bg-ink p-7 text-center text-cream sm:p-12">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="rounded-full bg-flame px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white">
                Discount of the day
              </span>
              <span className="rounded-full bg-volt px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-ink">
                −{storewideDeal.percentOff}% today only
              </span>
            </div>
            <h2 className="display-tight mt-5 text-3xl font-bold sm:text-5xl">
              −{storewideDeal.percentOff}% off everything in store
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-cream/60">
              Every product currently in stock is discounted — the price drops automatically
              in your cart. Ends at midnight tonight.
            </p>
            <div className="mt-6 flex justify-center">
              <DealCountdown endsAt={storewideDeal.endsAt.toISOString()} variant="dark" />
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/shop"
                className="rounded-full bg-volt px-7 py-4 text-xs font-black uppercase tracking-[0.2em] text-ink transition hover:bg-cream"
              >
                Shop the discount
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------------- DEAL OF THE DAY ---------------- */}
      {activeDeal && dealProduct ? (
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
          <div className="luxury-ambient relative overflow-hidden rounded-[2.5rem] bg-ink text-cream">
            <div className="relative grid items-center gap-8 p-7 sm:p-12 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-flame px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white">
                    Discount of the day
                  </span>
                  <span className="rounded-full bg-volt px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-ink">
                    −{activeDeal.percentOff}% today only
                  </span>
                </div>
                <p className="mt-5 text-[11px] font-black uppercase tracking-[0.28em] text-volt">
                  {dealProduct.brand}
                </p>
                <h2 className="display-tight mt-2 text-3xl font-bold sm:text-5xl">
                  {dealProduct.name}
                </h2>
                <div className="mt-5 flex flex-wrap items-end gap-3">
                  <span className="text-4xl font-bold text-volt">
                    {formatMoney(dealPriceCents(dealProduct.priceCents, activeDeal.percentOff))}
                  </span>
                  <span className="pb-1 text-lg font-semibold text-cream/40 line-through">
                    {formatMoney(dealProduct.priceCents)}
                  </span>
                </div>
                <div className="mt-6">
                  <DealCountdown endsAt={activeDeal.endsAt.toISOString()} variant="dark" />
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href={`/product/${dealProduct.slug}`}
                    className="rounded-full bg-volt px-7 py-4 text-xs font-black uppercase tracking-[0.2em] text-ink transition hover:bg-cream"
                  >
                    Grab the deal
                  </Link>
                  <Link
                    href="/shop"
                    className="rounded-full border border-cream/25 px-7 py-4 text-xs font-black uppercase tracking-[0.2em] transition hover:border-volt hover:text-volt"
                  >
                    Keep browsing
                  </Link>
                </div>
              </div>
              <Link
                href={`/product/${dealProduct.slug}`}
                className="relative block overflow-hidden rounded-[2rem] ring-1 ring-cream/15"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dealProduct.images[0]}
                  alt={dealProduct.name}
                  className="aspect-square w-full object-cover transition duration-700 hover:scale-105"
                />
                <span className="absolute right-4 top-4 grid h-16 w-16 place-items-center rounded-full bg-flame text-lg font-black text-white">
                  −{activeDeal.percentOff}%
                </span>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------------- CATEGORIES ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-flame">
              Shop by department
            </p>
            <h2 className="display-tight mt-2 text-4xl font-black sm:text-5xl">
              A little bit of everything.
            </h2>
          </div>
          <Link
            href="/shop"
            className="rounded-full border border-ink/20 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] transition hover:border-ink hover:bg-ink hover:text-cream"
          >
            View all products
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {departments.map((dept, index) => (
            <Link
              key={dept.slug}
              href={`/shop?group=${dept.slug}`}
              className={`group relative overflow-hidden rounded-3xl bg-ink ${
                index === 0 ? "sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-2" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dept.imageUrl}
                alt={dept.name}
                loading="lazy"
                className={`w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-60 ${
                  index === 0 ? "h-72 sm:h-full sm:min-h-[26rem]" : "h-56"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-volt">
                  {dept.count} products
                </p>
                <h3 className={`font-black text-cream ${index === 0 ? "text-3xl" : "text-xl"}`}>
                  {dept.name}
                </h3>
                <p className="mt-1 text-xs text-cream/65">{dept.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- FEATURED ---------------- */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-flame">
              Straight from the plug
            </p>
              <h2 className="display-tight mt-2 text-4xl font-black sm:text-5xl">Certified heat 🔥</h2>
            </div>
            <Link
              href="/shop?sort=popular"
              className="text-xs font-black uppercase tracking-[0.2em] underline underline-offset-4 hover:text-flame"
            >
              See what&apos;s moving
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} deal={activeDeal} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- BRAND MARQUEE ---------------- */}
      <section className="overflow-hidden border-y border-ink/10 bg-ink py-6">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center gap-12 px-6">
              {brandStrip.map((brand) => (
                <span
                  key={brand}
                  className="whitespace-nowrap text-xl font-black uppercase tracking-[0.2em] text-cream/35"
                >
                  {brand}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- DEALS ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-[2.5rem] bg-flame/10 p-6 ring-1 ring-flame/20 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-flame">
                Month-end specials
              </p>
              <h2 className="display-tight mt-2 text-4xl font-black sm:text-5xl">
                Marked down, not marked up.
              </h2>
              <p className="mt-3 max-w-md text-sm text-ink/60">
                Genuine reductions on genuine stock. When it&apos;s gone, it&apos;s gone — we
                don&apos;t do fake discounts.
              </p>
            </div>
            <Link
              href="/shop?sale=1"
              className="rounded-full bg-flame px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-ink"
            >
              All sale items
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {deals.map((product) => (
              <ProductCard key={product.id} product={product} deal={activeDeal} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- HOME & KITCHEN BANNER ---------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="relative overflow-hidden rounded-[2.5rem]">
          {siteImages.homeBanner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={siteImages.homeBanner}
              alt="Dining table styled with cookware from Tshidi the Plug"
              loading="lazy"
              className="h-[26rem] w-full object-cover"
            />
          ) : (
            <div className="flex h-[26rem] w-full items-center justify-center bg-ink text-xs font-bold uppercase tracking-widest text-cream/30">
              Add a banner photo in Settings
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-transparent" />
          <div className="absolute inset-y-0 left-0 flex max-w-lg flex-col justify-center gap-4 p-8 sm:p-14">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-volt">
              Not just fashion
            </p>
            <h2 className="display-tight text-4xl font-black text-cream sm:text-5xl">
              Kit out the kitchen &amp; the dining room.
            </h2>
            <p className="text-sm leading-relaxed text-cream/70">
              Pot sets, cast iron potjies, dinner services and solid wood tables — the same trusted
              service, delivered and assembled.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop?category=kitchen"
                className="rounded-full bg-volt px-6 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-ink transition hover:bg-cream"
              >
                Pots &amp; pans
              </Link>
              <Link
                href="/shop?category=furniture"
                className="rounded-full border border-cream/30 px-6 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-cream transition hover:border-volt hover:text-volt"
              >
                Tables &amp; home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- NEW ARRIVALS ---------------- */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-flame">
                Just landed
              </p>
              <h2 className="display-tight mt-2 text-4xl font-black sm:text-5xl">New arrivals</h2>
            </div>
            <Link
              href="/shop?sort=newest"
              className="text-xs font-black uppercase tracking-[0.2em] underline underline-offset-4 hover:text-flame"
            >
              Shop new in
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {newArrivals.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} deal={activeDeal} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- ABOUT ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[2.5rem]">
            {siteImages.owner ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={siteImages.owner}
                alt="Tshidi packing customer orders"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-sand/60 text-xs font-bold uppercase tracking-widest text-ink/30">
                Add a photo in Settings
              </div>
            )}
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-flame">
              Meet the Plug
            </p>
            <h2 className="display-tight mt-2 text-4xl font-black sm:text-5xl">
              Tshidi packs every single order herself.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-ink/65">
              They started calling her &quot;the plug&quot; because she could always find the pair
              nobody else had. What began as six pairs of sneakers sold from a spare room is now a
              full store serving every province — and Tshidi still inspects, wraps and sends each
              parcel with a handwritten note.
            </p>
            <div className="mt-7 grid grid-cols-3 gap-4">
              {[
                ["2019", "Started trading"],
                ["9", "Provinces served"],
                ["100%", "Authentic stock"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-white p-4 ring-1 ring-ink/5">
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-[11px] uppercase tracking-widest text-ink/50">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/about"
                className="rounded-full bg-ink px-6 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-cream transition hover:bg-flame"
              >
                Our story
              </Link>
              <a
                href={`https://wa.me/${site.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-ink/20 px-6 py-3.5 text-xs font-black uppercase tracking-[0.2em] transition hover:border-ink"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- BEST SELLERS ---------------- */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-flame">
            Customer favourites
          </p>
          <h2 className="display-tight mt-2 text-4xl font-black sm:text-5xl">Best sellers</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} deal={activeDeal} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="rounded-3xl bg-ink p-7 text-cream">
              <span className="text-4xl font-black text-volt">{step.n}</span>
              <h3 className="mt-4 text-xl font-black">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/60">{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <h2 className="display-tight text-4xl font-black sm:text-5xl">
          Real customers. Real deliveries.
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <figure key={item.id} className="rounded-3xl bg-white p-7 ring-1 ring-ink/5">
              <div className="flex items-center gap-3">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-sand"
                  />
                ) : null}
                <div>
                  <div className="text-sm text-flame">{"★★★★★".slice(0, item.rating)}</div>
                  {item.productName ? (
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/35">
                      Bought {item.productName}
                    </p>
                  ) : null}
                </div>
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-ink/70">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-5 text-xs font-black uppercase tracking-widest text-ink/50">
                {item.customerName} — {item.location}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
