import Link from "next/link";
import { createTestimonial, deleteTestimonial, toggleTestimonial, updateTestimonial } from "@/lib/admin-actions";
import { getAllTestimonials } from "@/lib/testimonials";

export const dynamic = "force-dynamic";
export const metadata = { title: "Testimonials admin" };

const input = "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-flame";
const label = "text-[10px] font-black uppercase tracking-[0.2em] text-ink/45";

function TestimonialFields({
  item,
}: {
  item?: Awaited<ReturnType<typeof getAllTestimonials>>[number];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div>
        <label className={label}>Customer name</label>
        <input name="customerName" required defaultValue={item?.customerName} className={`${input} mt-1`} />
      </div>
      <div>
        <label className={label}>Location</label>
        <input name="location" required defaultValue={item?.location} className={`${input} mt-1`} placeholder="Soweto, Gauteng" />
      </div>
      <div>
        <label className={label}>Product bought</label>
        <input name="productName" defaultValue={item?.productName} className={`${input} mt-1`} placeholder="Nike Air Force 1" />
      </div>
      <div>
        <label className={label}>Customer image URL</label>
        <input name="imageUrl" defaultValue={item?.imageUrl} className={`${input} mt-1`} placeholder="https://..." />
      </div>
      <div>
        <label className={label}>Rating</label>
        <input name="rating" type="number" min="1" max="5" defaultValue={item?.rating ?? 5} className={`${input} mt-1`} />
      </div>
      <div>
        <label className={label}>Sort order</label>
        <input name="sortOrder" type="number" defaultValue={item?.sortOrder ?? 0} className={`${input} mt-1`} />
      </div>
      <div className="md:col-span-2">
        <label className={label}>Quote</label>
        <textarea name="quote" required rows={4} defaultValue={item?.quote} className={`${input} mt-1`} />
      </div>
      <label className="flex items-center gap-2 text-xs font-bold md:col-span-2">
        <input type="checkbox" name="isLive" defaultChecked={item?.isLive ?? true} className="accent-[#8a5a44]" />
        Show this testimonial live on the homepage
      </label>
    </div>
  );
}

export default async function AdminTestimonialsPage() {
  const testimonials = await getAllTestimonials();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-flame">
            Live testimonials
          </p>
          <h1 className="display-tight mt-2 text-4xl font-black sm:text-6xl">Customer stories</h1>
          <p className="mt-3 max-w-2xl text-sm text-ink/55">
            Add new customer quotes, upload/paste image URLs and choose which ones appear on the homepage.
          </p>
        </div>
        <Link prefetch={false} href="/admin" className="rounded-full border border-ink/15 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.2em]">
          Back to dashboard
        </Link>
      </div>

      <section className="glass-neutral mt-8 rounded-3xl p-6">
        <h2 className="text-xl font-black">Add a new testimonial</h2>
        <form action={createTestimonial} className="mt-5">
          <TestimonialFields />
          <button className="mt-5 rounded-full bg-ink px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-cream hover:bg-flame">
            Publish testimonial
          </button>
        </form>
      </section>

      <section className="mt-8 space-y-4">
        {testimonials.map((item) => (
          <details key={item.id} className="rounded-3xl bg-white p-5 ring-1 ring-ink/5">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center gap-4">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-sand text-xl font-black">
                    {item.customerName.slice(0, 1)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-ink/40">
                    {item.location} · {item.rating} stars · {item.isLive ? "Live" : "Hidden"}
                  </p>
                  <h3 className="text-lg font-black">{item.customerName}</h3>
                  <p className="line-clamp-1 text-sm text-ink/55">“{item.quote}”</p>
                </div>
                <form action={toggleTestimonial}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="isLive" value={item.isLive ? "false" : "true"} />
                  <button className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest ${item.isLive ? "bg-sand text-ink" : "bg-ink text-cream"}`}>
                    {item.isLive ? "Hide" : "Go live"}
                  </button>
                </form>
              </div>
            </summary>

            <div className="mt-6 border-t border-ink/10 pt-6">
              <form action={updateTestimonial}>
                <TestimonialFields item={item} />
                <button className="mt-5 rounded-full bg-ink px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-cream hover:bg-flame">
                  Save testimonial
                </button>
              </form>
              <form action={deleteTestimonial} className="mt-3">
                <input type="hidden" name="id" value={item.id} />
                <button className="rounded-full border border-flame/30 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-flame hover:bg-flame hover:text-white">
                  Delete testimonial
                </button>
              </form>
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
