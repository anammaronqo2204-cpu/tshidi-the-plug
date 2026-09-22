import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, formatMoney } from "@/lib/format";
import { getOrderByNumber } from "@/lib/orders";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order confirmed" };

const timeline = ["pending", "paid", "packed", "shipped", "delivered"];

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const result = await getOrderByNumber(number);
  if (!result) notFound();

  const { order, items } = result;
  const stage = Math.max(0, timeline.indexOf(order.status));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="rounded-[2.5rem] bg-ink p-8 text-cream sm:p-12">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-volt">
          Order received 🎉
        </p>
        <h1 className="display-tight mt-3 text-4xl font-black sm:text-5xl">
          Thanks, {order.customerName.split(" ")[0]}!
        </h1>
        <p className="mt-4 max-w-lg text-sm text-cream/65">
          Your order <span className="font-black text-volt">{order.orderNumber}</span> is locked in.
          We&apos;ve sent a confirmation to {order.email} and Tshidi will WhatsApp you the payment
          and tracking details shortly.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-cream/5 p-4 ring-1 ring-cream/10">
            <p className="text-[10px] uppercase tracking-widest text-cream/45">Order total</p>
            <p className="text-2xl font-black text-volt">{formatMoney(order.totalCents)}</p>
          </div>
          <div className="rounded-2xl bg-cream/5 p-4 ring-1 ring-cream/10">
            <p className="text-[10px] uppercase tracking-widest text-cream/45">Placed</p>
            <p className="text-sm font-bold">{formatDate(order.createdAt)}</p>
          </div>
          <div className="rounded-2xl bg-cream/5 p-4 ring-1 ring-cream/10">
            <p className="text-[10px] uppercase tracking-widest text-cream/45">Payment</p>
            <p className="text-sm font-bold uppercase">{order.paymentMethod}</p>
          </div>
        </div>
      </div>

      <section className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-ink/5">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-flame">Progress</h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-5">
          {timeline.map((step, index) => (
            <li key={step} className="flex items-center gap-2 sm:block">
              <span
                className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${
                  index <= stage ? "bg-volt text-ink" : "bg-sand text-ink/35"
                }`}
              >
                {index + 1}
              </span>
              <p
                className={`text-xs font-bold capitalize sm:mt-2 ${
                  index <= stage ? "text-ink" : "text-ink/35"
                }`}
              >
                {step}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-ink/5">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-flame">Items</h2>
        <ul className="mt-5 divide-y divide-ink/5">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt="" className="h-20 w-16 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/45">
                  {item.brand}
                </p>
                <Link href={`/product/${item.slug}`} className="font-bold hover:text-flame">
                  {item.name}
                </Link>
                <p className="text-xs text-ink/50">
                  Size {item.size} · Qty {item.quantity}
                </p>
              </div>
              <span className="font-black">
                {formatMoney(item.unitPriceCents * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/55">Subtotal</dt>
            <dd className="font-bold">{formatMoney(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/55">Delivery ({order.deliveryMethod})</dt>
            <dd className="font-bold">
              {order.shippingCents === 0 ? "FREE" : formatMoney(order.shippingCents)}
            </dd>
          </div>
          <div className="flex justify-between text-lg font-black">
            <dt>Total</dt>
            <dd>{formatMoney(order.totalCents)}</dd>
          </div>
        </dl>
      </section>

      {order.paymentMethod === "laybye" ? (
        <section className="mt-6 rounded-3xl bg-cocoa p-6 text-cream">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-volt">
              Lay-bye plan · 3 monthly installments
            </h2>
            <span className="rounded-full bg-cream/10 px-3 py-1 text-xs font-bold">
              {Math.min(3, order.installmentsPaid)} of 3 paid
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[1, 2, 3].map((step) => (
              <span
                key={step}
                className={`rounded-xl px-4 py-2 text-sm font-bold ${
                  order.installmentsPaid >= step ? "bg-volt text-ink" : "bg-cream/10 text-cream/50"
                }`}
              >
                {formatMoney(Math.round(order.totalCents / 3))} {order.installmentsPaid >= step ? "✓" : ""}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-cream/70">
            {order.installmentsPaid >= 3
              ? "Paid in full — your order is now being processed for delivery."
              : `Balance outstanding: ${formatMoney(
                  Math.max(0, order.totalCents - Math.round(order.totalCents / 3) * order.installmentsPaid),
                )}. Your order is held safely and only released for delivery after the final installment.`}
          </p>
        </section>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 text-sm ring-1 ring-ink/5">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-flame">Shipping to</h2>
          <p className="mt-4 font-bold">{order.customerName}</p>
          <p className="text-ink/60">{order.address}</p>
          <p className="text-ink/60">
            {order.city}, {order.province}, {order.postalCode}
          </p>
          <p className="mt-2 text-ink/60">{order.phone}</p>
          {order.notes ? <p className="mt-2 text-xs text-ink/45">Note: {order.notes}</p> : null}
          {order.proofOfPaymentUrl ? (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-sand/60 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.proofOfPaymentUrl}
                alt="Proof of payment"
                className="h-14 w-14 rounded-lg object-cover"
              />
              <p className="text-xs font-bold text-ink/60">Proof of payment received ✓</p>
            </div>
          ) : null}
        </div>
        <div className="rounded-3xl bg-volt p-6 text-sm">
          <h2 className="text-xs font-black uppercase tracking-[0.3em]">What happens next</h2>
          {order.paymentMethod === "laybye" ? (
            <ol className="mt-4 space-y-2 text-ink/75">
              <li>1. Pay your installments monthly (max 3 months) via EFT — Tshidi will WhatsApp you the details.</li>
              <li>2. We hold your order safely until the final installment clears.</li>
              <li>3. After the last payment: 2–3 days processing, then Courier Guy delivers.</li>
            </ol>
          ) : (
            <ol className="mt-4 space-y-2 text-ink/75">
              <li>1. We check your proof of payment against the EFT.</li>
              <li>2. Once confirmed, your parcel is processed in 2–3 working days, then handed to Courier Guy.</li>
              <li>3. You get a tracking number on WhatsApp — {site.phone}.</li>
            </ol>
          )}
          <Link
            href="/shop"
            className="mt-5 inline-block rounded-full bg-ink px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-cream"
          >
            Keep shopping
          </Link>
        </div>
      </section>
    </div>
  );
}
