import Link from "next/link";
import { formatDate, formatMoney } from "@/lib/format";
import { getOrderByNumber } from "@/lib/orders";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Track your order" };

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.number;
  const number = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const result = number ? await getOrderByNumber(number) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-flame">Order tracking</p>
      <h1 className="display-tight mt-2 text-4xl font-black sm:text-6xl">Where&apos;s my parcel?</h1>
      <p className="mt-3 text-sm text-ink/60">
        Enter the order number from your confirmation (it looks like {site.orderPrefix}-XXXXXXXX).
      </p>

      <form method="get" className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          name="number"
          defaultValue={number}
          placeholder={`${site.orderPrefix}-1A2B3C`}
          className="w-full rounded-full border border-ink/15 bg-white px-5 py-4 text-sm uppercase tracking-widest outline-none focus:border-ink"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-ink px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-cream transition hover:bg-flame"
        >
          Track order
        </button>
      </form>

      {number && !result ? (
        <div className="mt-8 rounded-3xl bg-white p-8 text-center ring-1 ring-ink/5">
          <p className="text-4xl">🤔</p>
          <h2 className="mt-3 text-xl font-black">We couldn&apos;t find {number}</h2>
          <p className="mt-2 text-sm text-ink/55">
            Double-check the number, or WhatsApp us on {site.phone} and we&apos;ll look it up.
          </p>
        </div>
      ) : null}

      {result ? (
        <div className="mt-8 rounded-3xl bg-white p-8 ring-1 ring-ink/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-ink/45">
                {result.order.orderNumber}
              </p>
              <h2 className="text-2xl font-black capitalize">{result.order.status}</h2>
              <p className="text-xs text-ink/50">Placed {formatDate(result.order.createdAt)}</p>
            </div>
            <span className="rounded-full bg-volt px-4 py-2 text-xs font-black uppercase tracking-widest">
              {formatMoney(result.order.totalCents)}
            </span>
          </div>

          <ul className="mt-6 space-y-3">
            {result.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt="" className="h-14 w-12 rounded-lg object-cover" />
                <span className="flex-1 font-semibold">{item.name}</span>
                <span className="text-ink/50">×{item.quantity}</span>
              </li>
            ))}
          </ul>

          <Link
            href={`/order/${result.order.orderNumber}`}
            className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-cream"
          >
            View full order
          </Link>
        </div>
      ) : null}
    </div>
  );
}
