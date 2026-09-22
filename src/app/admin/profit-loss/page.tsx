import { getProfitLoss } from "@/lib/admin-data";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profit / Loss · Admin" };

const catNames: Record<string, string> = {
  sneakers: "Sneakers",
  clothing: "Clothing",
  bags: "Bags",
  shoes: "Formal Shoes",
  watches: "Watches",
  kitchen: "Pots & Pans",
  furniture: "Tables & Home",
};

export default async function ProfitLossPage() {
  const pl = await getProfitLoss();

  const rows = [
    { label: "Product revenue", value: formatMoney(pl.revenueCents), tone: "text-ink" },
    { label: "Cost of goods sold", value: `– ${formatMoney(pl.cogsCents)}`, tone: "text-flame" },
    { label: "Gross profit", value: formatMoney(pl.grossProfitCents), tone: "text-emerald-700", strong: true },
    { label: "Shipping collected", value: formatMoney(pl.shippingCents), tone: "text-ink/70" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-flame">Finance</p>
      <h1 className="display-tight mt-2 text-4xl font-bold sm:text-5xl">Profit &amp; Loss</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink/55">
        Calculated from real orders. Cost of goods is based on each product&apos;s cost price set in
        Products.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-cocoa p-6 text-cream">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cream/60">
            Gross profit
          </p>
          <p className="mt-2 text-3xl font-bold">{formatMoney(pl.grossProfitCents)}</p>
        </div>
        <div className="glass-neutral rounded-3xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">Margin</p>
          <p className="mt-2 text-3xl font-bold">{pl.marginPercent}%</p>
        </div>
        <div className="glass-neutral rounded-3xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">Units sold</p>
          <p className="mt-2 text-3xl font-bold">{pl.unitsSold}</p>
        </div>
      </div>

      <section className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-ink/5">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-flame">Income statement</h2>
        <ul className="mt-5 divide-y divide-ink/5">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between py-3">
              <span className={`text-sm ${row.strong ? "font-bold" : "font-medium text-ink/70"}`}>
                {row.label}
              </span>
              <span className={`text-sm font-bold ${row.tone}`}>{row.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-ink/5">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-flame">
          Profit by department
        </h2>
        {pl.perCategory.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">No sales recorded yet.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-ink/40">
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Revenue</th>
                  <th className="pb-3">Cost</th>
                  <th className="pb-3">Profit</th>
                  <th className="pb-3">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {pl.perCategory.map((row) => (
                  <tr key={row.category}>
                    <td className="py-3 font-semibold">{catNames[row.category] ?? row.category}</td>
                    <td className="py-3 text-ink/70">{formatMoney(row.revenueCents)}</td>
                    <td className="py-3 text-ink/70">{formatMoney(row.cogsCents)}</td>
                    <td className="py-3 font-bold text-emerald-700">{formatMoney(row.profitCents)}</td>
                    <td className="py-3 font-semibold">{row.margin}%</td>
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
