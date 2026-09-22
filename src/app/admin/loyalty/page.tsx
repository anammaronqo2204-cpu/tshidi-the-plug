import { getLoyaltyCustomers } from "@/lib/admin-data";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Loyalty · Admin" };

const tierStyle: Record<string, string> = {
  Platinum: "bg-ink text-volt",
  Gold: "bg-volt text-ink",
  Silver: "bg-sand text-ink",
  Bronze: "bg-cocoa/15 text-cocoa",
};

export default async function LoyaltyPage() {
  const customers = await getLoyaltyCustomers();
  const repeat = customers.filter((c) => c.orderCount > 1).length;
  const totalPoints = customers.reduce((sum, c) => sum + c.points, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-flame">Customer rewards</p>
      <h1 className="display-tight mt-2 text-4xl font-bold sm:text-5xl">Loyalty</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink/55">
        Customers earn 1 point for every R10 spent. Tiers unlock at R3 000 (Silver), R8 000 (Gold)
        and R15 000 (Platinum).
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="glass-neutral rounded-3xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">Members</p>
          <p className="mt-2 text-3xl font-bold">{customers.length}</p>
        </div>
        <div className="glass-neutral rounded-3xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">
            Repeat buyers
          </p>
          <p className="mt-2 text-3xl font-bold">{repeat}</p>
        </div>
        <div className="glass-neutral rounded-3xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">
            Points issued
          </p>
          <p className="mt-2 text-3xl font-bold">{totalPoints}</p>
        </div>
      </div>

      <section className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-ink/5">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-flame">Members</h2>
        {customers.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">No customers yet.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-ink/40">
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Tier</th>
                  <th className="pb-3">Orders</th>
                  <th className="pb-3">Spent</th>
                  <th className="pb-3">Points</th>
                  <th className="pb-3">Last order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {customers.map((customer) => (
                  <tr key={customer.email}>
                    <td className="py-3">
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-xs text-ink/45">{customer.email}</p>
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${tierStyle[customer.tier]}`}
                      >
                        {customer.tier}
                      </span>
                    </td>
                    <td className="py-3 font-semibold">{customer.orderCount}</td>
                    <td className="py-3 font-bold">{formatMoney(customer.totalSpent)}</td>
                    <td className="py-3 font-semibold text-cocoa">{customer.points} pts</td>
                    <td className="py-3 text-xs text-ink/50">{formatDate(customer.lastOrder)}</td>
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
