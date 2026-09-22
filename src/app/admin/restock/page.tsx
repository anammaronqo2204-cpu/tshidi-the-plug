import Link from "next/link";
import { getRestockList } from "@/lib/admin-data";
import { adjustStock } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Restock List · Admin" };

export default async function RestockPage() {
  const { low, outOfStock, threshold } = await getRestockList(8);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-flame">Inventory alerts</p>
      <h1 className="display-tight mt-2 text-4xl font-bold sm:text-5xl">Restock List</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink/55">
        Products at or below {threshold} units. Update the quantity to restock instantly — changes go
        live on the shop.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-flame p-6 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
            Out of stock
          </p>
          <p className="mt-2 text-3xl font-bold">{outOfStock}</p>
        </div>
        <div className="glass-neutral rounded-3xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">
            Needs restock
          </p>
          <p className="mt-2 text-3xl font-bold">{low.length}</p>
        </div>
        <div className="glass-neutral rounded-3xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">Threshold</p>
          <p className="mt-2 text-3xl font-bold">≤ {threshold}</p>
        </div>
      </div>

      <section className="mt-8 space-y-3">
        {low.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-ink/5">
            <p className="text-4xl">✅</p>
            <p className="mt-3 text-sm font-semibold">Everything is well stocked.</p>
          </div>
        ) : (
          low.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-ink/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.images[0]} alt="" className="h-16 w-16 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink/40">
                  {item.brand} · {item.soldCount} sold
                </p>
                <Link prefetch={false} href={`/product/${item.slug}`} className="line-clamp-1 font-bold hover:text-flame">
                  {item.name}
                </Link>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                  item.stock <= 0 ? "bg-flame text-white" : "bg-sand text-ink/70"
                }`}
              >
                {item.stock <= 0 ? "Out of stock" : `${item.stock} left`}
              </span>
              <form action={adjustStock} className="flex items-center gap-2">
                <input type="hidden" name="id" value={item.id} />
                <input
                  name="stock"
                  type="number"
                  min="0"
                  defaultValue={item.stock}
                  className="w-24 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-flame"
                />
                <button className="rounded-full bg-ink px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-cream hover:bg-flame">
                  Restock
                </button>
              </form>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
