import { site } from "@/lib/site";

export const metadata = { title: "Store policies" };

const sections = [
  {
    title: "Authenticity policy",
    body: "All branded goods are sourced through trusted suppliers and inspected before dispatch. If an item is proven not to be authentic, we refund you in full and cover return courier fees.",
  },
  {
    title: "Returns & exchanges",
    body: "Unworn, unused products in original packaging may be exchanged within 7 days of delivery. Shoes must be tried indoors only. Clothing must still have tags attached. Homeware must be unused and returned with original packaging.",
  },
  {
    title: "Refunds",
    body: "Refunds are only processed for faulty, incorrect or unavailable items. Approved refunds are paid to the original payment method within 5–10 working days after inspection.",
  },
  {
    title: "Payment terms",
    body: "EFT orders are paid 100% upfront before processing begins. Lay-bye is available as an alternative: the total is split into 3 equal monthly installments (maximum 3 months). Lay-bye orders are reserved but not packed or delivered until the final installment has cleared. If a lay-bye is not completed within 3 months it may be cancelled and refunded as store credit minus reasonable admin costs.",
  },
  {
    title: "Privacy",
    body: "We only use your contact and delivery information to process orders, send tracking updates and support your purchase. We never sell customer information.",
  },
  {
    title: "Image and colour accuracy",
    body: "We use clear product photography, but colours can vary slightly by screen. If colour matching is critical, ask for extra photos before ordering.",
  },
];

export default function PoliciesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-flame">Policies</p>
      <h1 className="display-tight mt-2 text-4xl font-black sm:text-6xl">Clear rules. No drama.</h1>
      <p className="mt-4 text-sm leading-relaxed text-ink/60">
        These policies keep things fair for customers and for {site.name}. If anything is unclear,
        WhatsApp us before ordering.
      </p>

      <div className="mt-10 space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="glass-neutral rounded-3xl p-6">
            <h2 className="text-xl font-black">{section.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/65">{section.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-3xl bg-ink p-8 text-cream">
        <h2 className="text-2xl font-black">Support contact</h2>
        <p className="mt-2 text-sm text-cream/65">
          WhatsApp {site.phone} · Email {site.email} · {site.hours}
        </p>
      </div>
    </div>
  );
}
