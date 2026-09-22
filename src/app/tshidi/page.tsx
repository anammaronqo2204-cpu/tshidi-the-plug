import Link from "next/link";
import { site } from "@/lib/site";
import { getSiteImage } from "@/lib/site-images";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meet Tshidi" };

export default async function TshidiPage() {
  const ownerPhoto = await getSiteImage("owner");
  return (
    <div>
      <section className="luxury-ambient bg-ink py-16 text-cream">
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-volt">Shop owner</p>
            <h1 className="display-tight mt-3 text-4xl font-black sm:text-6xl">Meet Tshidi, the woman behind the plug.</h1>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-cream/65">
              Tshidi built the business the way a lot of real South African stores are built — one customer, one WhatsApp message and one trustworthy delivery at a time. People came for sneakers first, then started asking for branded clothes, bags, pots, pans and furniture. Her answer stayed the same: if it is worth buying, she will find it and check it properly.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="rounded-full bg-volt px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-ink">Shop Tshidi's picks</Link>
              <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer" className="rounded-full border border-cream/25 px-6 py-4 text-xs font-black uppercase tracking-[0.2em]">WhatsApp the team</a>
            </div>
          </div>
          <div className="overflow-hidden rounded-[2.5rem] ring-1 ring-cream/10">
            {ownerPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ownerPhoto} alt="Tshidi packing customer orders" className="h-full w-full object-cover" />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-cream/5 text-center text-xs font-bold uppercase tracking-widest text-cream/30">
                Add a photo in Settings
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["She checks the stock", "Every item is looked over before it leaves — images, sizing, tags, packaging and condition."],
            ["She talks to customers", "No faceless call centre. If something goes wrong, the team replies like humans."],
            ["She sources broadly", "Sneakers and clothing are the biggest market, but customers also trust her for homeware, tables and everyday deals."],
          ].map(([title, copy]) => (
            <div key={title} className="glass-neutral rounded-3xl p-7">
              <h2 className="text-xl font-black">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink/60">{copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-flame">The promise</p>
            <h2 className="display-tight mt-2 text-4xl font-black sm:text-5xl">Real products. Fair prices. Personal service.</h2>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-ink/65">
            <p>
              The name {site.name} is built on trust. Tshidi knows customers are spending hard-earned money, so the store is designed around clarity: clear pictures, clear delivery timelines, visible stock and real support.
            </p>
            <p>
              The goal is not to look like a giant department store. The goal is to feel like the reliable person everybody sends a voice note to when they need something good — sneakers, branded clothing, a handbag for an event, a potjie for the family or a dining table for the new home.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
