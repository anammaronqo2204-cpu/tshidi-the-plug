import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { courierTiers, site } from "@/lib/site";

export const metadata = { title: "Delivery times" };

export default function DeliveryPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-flame">Delivery</p>
      <h1 className="display-tight mt-2 text-4xl font-black sm:text-6xl">
        Processing, delivery times &amp; fees
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/60">
        Every order is processed in <span className="font-bold text-ink">{site.processingDays}</span>{" "}
        before it is handed to {site.courierName}. Processing includes payment checks, stock
        inspection and careful packing by the team.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="glass-neutral rounded-3xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">Processing</p>
          <p className="mt-2 text-3xl font-bold">{site.processingDays}</p>
          <p className="mt-1 text-xs text-ink/55">Before dispatch, on all orders.</p>
        </div>
        {courierTiers.map((tier) => (
          <div key={tier.id} className="glass-neutral rounded-3xl p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">
              {tier.title.replace("Courier Guy — ", "")}
            </p>
            <p className="mt-2 text-3xl font-bold">
              {formatMoney(tier.localCents)}
              <span className="text-base font-semibold text-ink/40"> / {formatMoney(tier.nationalCents)}</span>
            </p>
            <p className="mt-1 text-xs text-ink/55">
              {site.localProvince} / rest of SA via {site.courierName}.
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl bg-white ring-1 ring-ink/5">
        <table className="w-full text-sm">
          <thead className="bg-ink text-cream">
            <tr>
              {["Stage / area", "Time", "Cost"].map((heading) => (
                <th key={heading} className="px-5 py-4 text-left text-[11px] uppercase tracking-widest">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {[
              ["Order processing", `${site.processingDays} after payment clears`, "Included"],
              ...courierTiers.flatMap((tier) => [
                [
                  `${tier.title} · ${site.localProvince}`,
                  "1–2 working days after processing",
                  formatMoney(tier.localCents),
                ],
                [
                  `${tier.title} · outside ${site.localProvince}`,
                  "2–4 working days after processing",
                  formatMoney(tier.nationalCents),
                ],
              ]),
              ["Collection", `Same/next day after processing`, `Free · ${site.city.split(",")[0]}`],
            ].map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => (
                  <td key={cell} className="px-5 py-4 font-semibold text-ink/70">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          [
            "Tracking",
            `Once processing is complete and ${site.courierName} scans your parcel, we send the tracking number by WhatsApp or email.`,
          ],
          [
            "Missed deliveries",
            "The courier will contact you before returning the parcel. Extra re-delivery fees may apply.",
          ],
          [
            "Large items",
            "Tables and bulky furniture are delivered on a scheduled slot. We confirm the date with you before dispatch.",
          ],
        ].map(([title, copy]) => (
          <div key={title} className="glass-neutral rounded-3xl p-6">
            <h2 className="text-lg font-black">{title}</h2>
            <p className="mt-2 text-sm text-ink/60">{copy}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-3xl bg-sand p-8">
        <h2 className="text-2xl font-black">Need an urgent delivery?</h2>
        <p className="mt-2 text-sm text-ink/65">
          Message us before checking out and we&apos;ll tell you what&apos;s possible in your area.
        </p>
        <Link
          href="/faq"
          className="mt-5 inline-block rounded-full bg-ink px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-cream"
        >
          Read FAQ
        </Link>
      </div>
    </div>
  );
}
