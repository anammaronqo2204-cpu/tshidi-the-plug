import Link from "next/link";
import { site } from "@/lib/site";

export const metadata = { title: "FAQ" };

const groups = [
  {
    title: "Shopping with Tshidi",
    items: [
      ["Is everything authentic?", "Yes. Every branded sneaker, item of clothing, bag and watch is checked before shipping. We only list stock Tshidi is comfortable putting her name on."],
      ["Do you have a physical shop?", `We are primarily online, with collection available by arrangement in ${site.city.split(",")[0]}. Message us before arriving so your parcel is ready.`],
      ["How does lay-bye work?", "Split your order into 3 equal monthly payments — maximum 3 months. We hold your order and only release it for delivery once the final installment is paid. Choose lay-bye at checkout."],
      ["What if my size is sold out?", `WhatsApp ${site.phone} with the product name and size. Tshidi will add you to the restock list and contact you first when it lands.`],
    ],
  },
  {
    title: "Orders & payments",
    items: [
      ["Which payment methods do you accept?", "EFT/bank transfer (100% upfront), or lay-bye: 3 equal monthly payments with your order delivered after the final installment."],
      ["When is my order confirmed?", "Your order enters processing as soon as full payment clears (or proof of payment is verified for EFT). Processing takes 2–3 working days."],
      ["Can I change my order?", "Yes, if it has not been packed yet. Send your order number on WhatsApp as quickly as possible."],
      ["Do prices include VAT?", "All prices are displayed in South African Rand and include VAT where applicable."],
    ],
  },
  {
    title: "Returns & support",
    items: [
      ["Can I exchange the wrong size?", "Unworn items in original packaging can be exchanged within 7 days of delivery. Courier fees may apply unless we sent the wrong item."],
      ["Can sale items be returned?", "Sale items can be exchanged for size if stock is available, but cash refunds are not offered unless the item is faulty."],
      ["How do I contact support?", `WhatsApp ${site.phone} during ${site.hours}, or email ${site.email}.`],
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-flame">Help centre</p>
      <h1 className="display-tight mt-2 text-4xl font-black sm:text-6xl">Frequently asked questions</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/60">
        Everything customers usually ask before ordering from {site.name}. If you still need help,
        the fastest route is WhatsApp.
      </p>

      <div className="mt-10 space-y-8">
        {groups.map((group) => (
          <section key={group.title} className="glass-neutral rounded-3xl p-6">
            <h2 className="text-2xl font-black">{group.title}</h2>
            <div className="mt-5 space-y-3">
              {group.items.map(([q, a]) => (
                <details key={q} className="rounded-2xl bg-white p-5 ring-1 ring-ink/5">
                  <summary className="cursor-pointer text-sm font-black">{q}</summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink/60">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-3xl bg-ink p-8 text-cream">
        <h2 className="text-2xl font-black">Still stuck?</h2>
        <p className="mt-2 text-sm text-cream/65">Tshidi or someone from the team will help you directly.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer" className="rounded-full bg-volt px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-ink">
            WhatsApp us
          </a>
          <Link href="/delivery" className="rounded-full border border-cream/20 px-6 py-3 text-xs font-black uppercase tracking-[0.2em]">
            Delivery times
          </Link>
        </div>
      </div>
    </div>
  );
}
