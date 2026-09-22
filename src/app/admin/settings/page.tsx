import { site } from "@/lib/site";
import { resetToDemoData } from "@/lib/admin-actions";
import { getSiteImages } from "@/lib/site-images";
import SiteImageUpload from "@/components/SiteImageUpload";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings · Admin" };

export default async function AdminSettingsPage() {
  const siteImages = await getSiteImages();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-flame">Security</p>
      <h1 className="display-tight mt-2 text-4xl font-bold sm:text-5xl">Settings</h1>
      <p className="mt-3 text-sm text-ink/55">Manage access to the admin control centre.</p>

      <section className="glass-neutral mt-8 rounded-3xl p-6">
        <h2 className="text-xl font-bold">Site photos</h2>
        <p className="mt-2 text-sm text-ink/55">
          These are the marketing photos used across the homepage and story pages — upload one
          and it goes live everywhere it appears immediately.
        </p>
        <div className="mt-4 space-y-3">
          <SiteImageUpload
            imageKey="hero"
            label="Homepage hero photo"
            helpText="Big image on the right of the homepage banner, and the preview image used when the site is shared on WhatsApp/social media."
            currentUrl={siteImages.hero}
          />
          <SiteImageUpload
            imageKey="homeBanner"
            label="Home & kitchen banner"
            helpText='The "Kit out the kitchen & the dining room" banner further down the homepage.'
            currentUrl={siteImages.homeBanner}
          />
          <SiteImageUpload
            imageKey="owner"
            label="Tshidi / story photo"
            helpText="Your photo — appears on the homepage About section, the Meet Tshidi page, and the Our Story page."
            currentUrl={siteImages.owner}
          />
        </div>
      </section>

      <section className="glass-neutral mt-8 rounded-3xl p-6">
        <h2 className="text-xl font-bold">Admin access</h2>
        <p className="mt-2 text-sm text-ink/55">
          Admin login is a single password you control — no third-party account involved, so
          nobody else can ever lock you out of it.
        </p>
        <ol className="mt-4 space-y-2 text-sm text-ink/70">
          <li>1. Go to Netlify → your site → Site settings → Environment variables.</li>
          <li>
            2. Update <code className="rounded bg-sand/70 px-1.5 py-0.5">ADMIN_PASSWORD</code> to
            whatever you want your new password to be.
          </li>
          <li>3. Redeploy the site (or trigger &quot;Clear cache and deploy&quot;) for it to take effect.</li>
        </ol>
        <p className="mt-4 text-xs text-ink/45">
          There&apos;s also an <code className="rounded bg-sand/70 px-1.5 py-0.5">ADMIN_SESSION_SECRET</code>{" "}
          variable, used only to sign your login session — set it once to any long random string
          and never change it (changing it just logs everyone out).
        </p>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-ink/5">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-flame">Store details</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/50">Store name</dt>
            <dd className="font-semibold">{site.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/50">Support phone</dt>
            <dd className="font-semibold">{site.phone}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/50">Email</dt>
            <dd className="font-semibold">{site.email}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-3xl border border-flame/20 bg-flame/5 p-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-flame">Danger zone</h2>
        <p className="mt-2 text-sm text-ink/60">
          This wipes <strong>every</strong> product, category, order and testimonial —
          including your real ones — and replaces them with the original placeholder demo
          data. Only use this if you genuinely want to start over from the example content
          (e.g. to show someone the original design).
        </p>
        <form action={resetToDemoData} className="mt-4">
          <button className="rounded-full border border-flame/40 bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-flame hover:bg-flame hover:text-white">
            Wipe everything &amp; restore demo placeholders
          </button>
        </form>
      </section>
    </div>
  );
}
