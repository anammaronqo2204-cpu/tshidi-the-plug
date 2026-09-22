import Link from "next/link";
import { formatDate, formatMoney } from "@/lib/format";
import { getRecentOrders } from "@/lib/orders";
import { getDailyDealAdmin, getProductsForDealSelect, getStats } from "@/lib/admin-data";
import { activateDailyDeal, endDailyDeal, markOrderStatus } from "@/lib/admin-actions";
import { dealPriceCents } from "@/lib/deals";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders · Admin" };

const statuses = ["pending", "laybye", "paid", "packed", "shipped", "delivered", "cancelled"];

export default async function AdminOrdersPage() {
  const [stats, recent, deal, productOptions] = await Promise.all([
    getStats(),
    getRecentOrders(25),
    getDailyDealAdmin(),
    getProductsForDealSelect(),
  ]);

  const cards = [
    { label: "Orders placed", value: String(stats.orderCount), accent: "bg-volt text-ink" },
    { label: "Revenue", value: formatMoney(stats.revenueCents), accent: "bg-cocoa text-cream" },
    { label: "Products live", value: String(stats.productCount), accent: "glass-neutral" },
    { label: "Units in stock", value: String(stats.stockUnits), accent: "glass-neutral" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-flame">
        Tshidi&apos;s back office
      </p>
      <h1 className="display-tight mt-2 text-4xl font-bold sm:text-5xl">Orders</h1>
      <p className="mt-3 text-sm text-ink/55">
        Live view of every order. Update fulfilment status as parcels move.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-3xl p-6 ${card.accent}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-3xl bg-ink p-6 text-cream">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-volt">
              Discount of the day
            </h2>
            <p className="mt-1 text-sm text-cream/55">
              Put any item on special until midnight. It shows with a live countdown on the
              homepage, shop and product page — and the reduced price applies at checkout.
              For a storewide discount or combo (&quot;buy both, save&quot;) deals, use{" "}
              <Link prefetch={false} href="/admin/deals" className="underline hover:text-volt">
                Discounts &amp; Combos
              </Link>
              .
            </p>
          </div>
          {deal ? (
            <form action={endDailyDeal}>
              <input type="hidden" name="id" value={deal.id} />
              <button className="rounded-full border border-cream/25 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] transition hover:border-flame hover:text-flame">
                End deal now
              </button>
            </form>
          ) : null}
        </div>

        {deal ? (
          deal.product ? (
            <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl bg-cream/5 p-4 ring-1 ring-cream/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={deal.product.images[0]}
                alt=""
                className="h-20 w-20 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-volt">
                  Live · ends {formatDate(deal.endsAt)}
                </p>
                <Link prefetch={false} href={`/product/${deal.product.slug}`} className="text-lg font-bold hover:text-volt">
                  {deal.product.name}
                </Link>
                <p className="text-sm text-cream/60">
                  <span className="line-through">{formatMoney(deal.product.priceCents)}</span>{" "}
                  <span className="font-bold text-volt">
                    {formatMoney(dealPriceCents(deal.product.priceCents, deal.percentOff))}
                  </span>{" "}
                  · {deal.percentOff}% off
                </p>
              </div>
              <span className="rounded-full bg-flame px-4 py-2 text-sm font-bold text-white">
                −{deal.percentOff}%
              </span>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-cream/5 p-4 ring-1 ring-cream/10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-volt">
                  Live · ends {formatDate(deal.endsAt)}
                </p>
                <p className="text-lg font-bold">−{deal.percentOff}% off everything in store</p>
              </div>
              <span className="rounded-full bg-flame px-4 py-2 text-sm font-bold text-white">
                −{deal.percentOff}%
              </span>
            </div>
          )
        ) : (
          <p className="mt-5 rounded-2xl bg-cream/5 px-4 py-3 text-sm text-cream/55">
            No deal is live right now. Pick an item below to start one.
          </p>
        )}

        <form action={activateDailyDeal} className="mt-5 grid gap-3 md:grid-cols-[1fr_140px_auto]">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-cream/45">
              Product
            </label>
            <select
              name="productId"
              required
              className="mt-1.5 w-full rounded-xl border border-cream/15 bg-cream/10 px-3 py-2.5 text-sm text-cream outline-none focus:border-volt"
            >
              {productOptions.map((option) => (
                <option key={option.id} value={option.id} className="text-ink">
                  {option.brand} — {option.name} ({formatMoney(option.priceCents)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-cream/45">
              % off
            </label>
            <input
              name="percentOff"
              type="number"
              min={5}
              max={90}
              defaultValue={25}
              required
              className="mt-1.5 w-full rounded-xl border border-cream/15 bg-cream/10 px-3 py-2.5 text-sm text-cream outline-none focus:border-volt"
            />
          </div>
          <div className="flex items-end">
            <button className="w-full rounded-full bg-volt px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-ink transition hover:bg-cream md:w-auto">
              {deal ? "Switch deal" : "Start deal"}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-ink/5">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-flame">Recent orders</h2>

        {recent.length === 0 ? (
          <p className="mt-6 text-sm text-ink/50">
            No orders yet. Place a test order from the storefront and it appears here instantly.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-ink/40">
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Placed</th>
                  <th className="pb-3">Pay</th>
                  <th className="pb-3">Proof</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {recent.map((order) => (
                  <tr key={order.id}>
                    <td className="py-3">
                      <Link prefetch={false}
                        href={`/order/${order.orderNumber}`}
                        className="font-bold hover:text-flame"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3">
                      <p className="font-semibold">{order.customerName}</p>
                      <p className="text-xs text-ink/45">
                        {order.city}, {order.province}
                      </p>
                    </td>
                    <td className="py-3 text-xs text-ink/50">{formatDate(order.createdAt)}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                          order.paymentMethod === "laybye" ? "bg-cocoa text-volt" : "bg-sand"
                        }`}
                      >
                        {order.paymentMethod === "laybye" ? "Lay-bye" : "EFT"}
                      </span>
                    </td>
                    <td className="py-3">
                      {order.proofOfPaymentUrl ? (
                        <a
                          href={order.proofOfPaymentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={order.proofOfPaymentUrl}
                            alt="Proof of payment"
                            className="h-10 w-10 rounded-lg object-cover ring-1 ring-ink/10 transition hover:ring-flame"
                          />
                        </a>
                      ) : (
                        <span className="text-xs text-ink/30">—</span>
                      )}
                    </td>
                    <td className="py-3 font-bold">{formatMoney(order.totalCents)}</td>
                    <td className="py-3">
                      <form action={markOrderStatus} className="flex items-center gap-2">
                        <input type="hidden" name="orderId" value={order.id} />
                        <select
                          name="status"
                          defaultValue={order.status}
                          className="rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-xs font-semibold capitalize"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button className="rounded-lg bg-ink px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-cream">
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
