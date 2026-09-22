import Link from "next/link";
import { getLaybuyOrders } from "@/lib/admin-data";
import { markOrderStatus, recordInstallment } from "@/lib/admin-actions";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lay-buy · Admin" };

export default async function LaybuyPage() {
  const laybuys = await getLaybuyOrders();
  const outstanding = laybuys
    .filter((order) => !order.complete)
    .reduce((sum, order) => sum + order.balanceCents, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-flame">Payments</p>
      <h1 className="display-tight mt-2 text-4xl font-bold sm:text-5xl">Lay-buy Orders</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink/55">
        Lay-bye runs over a maximum of 3 months in 3 equal installments.{" "}
        <span className="font-bold text-ink">
          Stock is only released for packing after the 3rd installment is recorded.
        </span>
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="glass-neutral rounded-3xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">
            Active lay-buys
          </p>
          <p className="mt-2 text-3xl font-bold">
            {laybuys.filter((order) => !order.complete).length}
          </p>
        </div>
        <div className="rounded-3xl bg-cocoa p-6 text-cream">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cream/60">
            Outstanding balance
          </p>
          <p className="mt-2 text-3xl font-bold">{formatMoney(outstanding)}</p>
        </div>
        <div className="glass-neutral rounded-3xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">
            Completed
          </p>
          <p className="mt-2 text-3xl font-bold">{laybuys.filter((order) => order.complete).length}</p>
        </div>
      </div>

      <section className="mt-8 space-y-4">
        {laybuys.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-ink/5">
            <p className="text-4xl">🗓️</p>
            <p className="mt-3 text-sm text-ink/55">
              No lay-bye orders yet. When a customer chooses lay-bye at checkout it appears here.
            </p>
          </div>
        ) : (
          laybuys.map((order) => (
            <div key={order.id} className="rounded-3xl bg-white p-5 ring-1 ring-ink/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/40">
                    {order.orderNumber} · placed {formatDate(order.createdAt)}
                  </p>
                  <Link prefetch={false} href={`/order/${order.orderNumber}`} className="text-lg font-bold hover:text-flame">
                    {order.customerName}
                  </Link>
                  <p className="text-xs text-ink/50">
                    {order.phone} · {order.city}, {order.province}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{formatMoney(order.totalCents)}</p>
                  <p className="text-xs text-ink/50">
                    3 × {formatMoney(order.perInstallmentCents)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {[1, 2, 3].map((step) => (
                  <span
                    key={step}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                      order.installmentsPaid >= step
                        ? "bg-cocoa text-volt"
                        : "bg-sand text-ink/40"
                    }`}
                  >
                    Installment {step} {order.installmentsPaid >= step ? "✓" : ""}
                  </span>
                ))}
                <span className="ml-auto text-xs font-bold text-flame">
                  {order.complete
                    ? "Paid in full — release for packing"
                    : `Balance ${formatMoney(order.balanceCents)}`}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
                <form action={recordInstallment}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <button
                    disabled={order.complete}
                    className="rounded-full bg-ink px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cream transition hover:bg-flame disabled:opacity-40"
                  >
                    {order.complete ? "Fully paid" : "Record installment"}
                  </button>
                </form>

                <form action={markOrderStatus} className="flex items-center gap-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <select
                    name="status"
                    defaultValue={order.status}
                    className="rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-xs font-semibold capitalize"
                  >
                    {["laybye", "paid", "packed", "shipped", "delivered", "cancelled"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button className="rounded-lg bg-sand px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-ink/70">
                    Status
                  </button>
                </form>

                {order.complete && order.status === "paid" ? (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                    Ready to pack & ship
                  </span>
                ) : null}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
