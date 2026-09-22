import { getStats } from "@/lib/admin-data";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stats · Admin" };

const catNames: Record<string, string> = {
  sneakers: "Sneakers",
  clothing: "Clothing",
  bags: "Bags",
  shoes: "Formal Shoes",
  watches: "Watches",
  kitchen: "Pots & Pans",
  furniture: "Tables & Home",
};

export default async function StatsPage() {
  const stats = await getStats();
  const topRevenue = Math.max(1, ...stats.categoryBreakdown.map((c) => c.revenue));

  const cards = [
    { label: "Revenue", value: formatMoney(stats.revenueCents) },
    { label: "Orders", value: String(stats.orderCount) },
    { label: "Avg order value", value: formatMoney(stats.avgOrderCents) },
    { label: "Units sold", value: String(stats.unitsSold) },
    { label: "Products live", value: String(stats.productCount) },
    { label: "Units in stock", value: String(stats.stockUnits) },
    { label: "Newsletter subs", value: String(stats.subscribers) },
    { label: "Shipping collected", value: formatMoney(stats.shippingCents) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-flame">Store analytics</p>
      <h1 className="display-tight mt-2 text-4xl font-bold sm:text-5xl">Stats</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="glass-neutral rounded-3xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-flame">
            Revenue by department
          </h2>
          {stats.categoryBreakdown.length === 0 ? (
            <p className="mt-4 text-sm text-ink/50">No sales recorded yet.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {stats.categoryBreakdown.map((cat) => (
                <li key={cat.category}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{catNames[cat.category] ?? cat.category}</span>
                    <span className="text-ink/55">
                      {formatMoney(cat.revenue)} · {cat.units} units
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand">
                    <div
                      className="h-full rounded-full bg-cocoa"
                      style={{ width: `${Math.round((cat.revenue / topRevenue) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl bg-ink p-6 text-cream">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-volt">
            Best selling products
          </h2>
          <ol className="mt-5 space-y-3">
            {stats.topSellers.map((item, index) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="text-lg font-bold text-volt">{index + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.images[0]} alt="" className="h-11 w-11 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold">{item.name}</p>
                  <p className="text-[11px] text-cream/50">{item.soldCount} sold</p>
                </div>
                <span className="text-xs font-bold">{formatMoney(item.priceCents)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
