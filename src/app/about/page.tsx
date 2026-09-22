import Link from "next/link";
import { site, trustBadges } from "@/lib/site";
import { getSiteImage } from "@/lib/site-images";

export const dynamic = "force-dynamic";
export const metadata = { title: "Our story" };

const faqs = [
  {
    q: "Is everything you sell authentic?",
    a: "Yes. Every branded sneaker, garment, bag and watch is sourced from authorised suppliers and inspected before we pack it. If anything is ever off, you get a full refund — no argument.",
  },
  {
    q: "How long does delivery take?",
    a: "Orders are processed in 2–3 working days. Delivery via Courier Guy is R100 in Gauteng and R200 outside Gauteng, arriving 1–4 working days after processing. Furniture is delivered by a dedicated truck and can take 5–10 working days.",
  },
  {
    q: "How does lay-bye work?",
    a: "Pay in 3 equal monthly installments over a maximum of 3 months. We hold your order safely and only release it for delivery once the last installment is paid. EFT orders are paid 100% upfront and processed within 2–3 working days.",
  },
  {
    q: "Can I exchange the wrong size?",
    a: "Absolutely. Unworn items in the original packaging can be exchanged within 7 days of delivery. Message us on WhatsApp and we'll arrange the courier swap.",
  },
  {
    q: "Do you deliver outside South Africa?",
    a: "Not yet — we currently ship to all nine provinces in South Africa. Cross-border delivery to Lesotho, Eswatini and Botswana is coming soon.",
  },
];

const sizeGuide = [
  ["UK 5", "EU 38", "US 6", "24.0 cm"],
  ["UK 6", "EU 39", "US 7", "25.0 cm"],
  ["UK 7", "EU 41", "US 8", "26.0 cm"],
  ["UK 8", "EU 42", "US 9", "27.0 cm"],
  ["UK 9", "EU 43", "US 10", "28.0 cm"],
  ["UK 10", "EU 44", "US 11", "29.0 cm"],
  ["UK 11", "EU 46", "US 12", "30.0 cm"],
  ["UK 12", "EU 47", "US 13", "31.0 cm"],
];

export default async function AboutPage() {
  const ownerPhoto = await getSiteImage("owner");
  return (
    <div>
      <section className="bg-ink py-16 text-cream">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-volt">
              Meet the Plug
            </p>
            <h1 className="display-tight mt-3 text-4xl font-black sm:text-6xl">
              How Tshidi became everybody&apos;s plug.
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-cream/65">
              It started in 2019 with six pairs of sneakers bought to resell to friends. When people
              wanted the pair nobody else could find, they phoned Tshidi — and the name stuck. Word
              spread fast: first sneakers, then clothing, then the aunties started asking for pots
              and dining tables. Today {site.name} is a full online store with one simple promise —
              real brands, fair prices, and service that actually answers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-full bg-volt px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-ink"
              >
                Shop the store
              </Link>
              <a
                href={`https://wa.me/${site.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-cream/25 px-6 py-4 text-xs font-black uppercase tracking-[0.2em]"
              >
                WhatsApp Tshidi
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-[2.5rem]">
            {ownerPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ownerPhoto}
                alt="Tshidi packing orders in her studio"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-sand/60 text-xs font-bold uppercase tracking-widest text-ink/30">
                Add a photo in Settings
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustBadges.map((badge) => (
            <div key={badge.title} className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
              <span className="text-3xl">{badge.icon}</span>
              <h3 className="mt-4 text-lg font-black">{badge.title}</h3>
              <p className="mt-1 text-sm text-ink/55">{badge.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <h2 className="display-tight text-4xl font-black sm:text-5xl">Questions, answered.</h2>
        <div className="mt-8 space-y-3">
          {faqs.map((faq) => (
            <details key={faq.q} className="rounded-2xl bg-white p-5 ring-1 ring-ink/5">
              <summary className="cursor-pointer text-sm font-black">{faq.q}</summary>
              <p className="mt-3 text-sm leading-relaxed text-ink/60">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="sizing" className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        <h2 className="display-tight text-4xl font-black sm:text-5xl">Sneaker size guide</h2>
        <p className="mt-3 text-sm text-ink/60">
          All footwear on site is listed in UK sizes. Measure your foot from heel to longest toe and
          match it to the chart below. Between sizes? Go up.
        </p>
        <div className="mt-6 overflow-hidden rounded-3xl bg-white ring-1 ring-ink/5">
          <table className="w-full text-sm">
            <thead className="bg-ink text-cream">
              <tr>
                {["UK", "EU", "US", "Foot length"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-[11px] uppercase tracking-widest">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {sizeGuide.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td key={cell} className="px-4 py-3 font-semibold text-ink/70">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 rounded-3xl bg-volt p-8">
          <h3 className="text-2xl font-black">Still stuck? Talk to a human.</h3>
          <p className="mt-2 text-sm text-ink/70">
            Call or WhatsApp {site.phone} · {site.hours} · {site.email}
          </p>
        </div>
      </section>
    </div>
  );
}
