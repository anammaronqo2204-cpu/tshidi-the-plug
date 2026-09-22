import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { CartDrawer } from "@/components/CartDrawer";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getCategories } from "@/lib/catalog";
import { groupCategories } from "@/lib/category-groups";
import { site } from "@/lib/site";
import { getSiteImage } from "@/lib/site-images";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const heroPhoto = await getSiteImage("hero");
  return {
    title: {
      default: `${site.name} — ${site.tagline}`,
      template: `%s · ${site.name}`,
    },
    description: site.blurb,
    applicationName: site.name,
    keywords: [
      "branded sneakers South Africa",
      "streetwear online store",
      "Tshidi the Plug",
      "authentic Jordans SA",
      "pots pans furniture online",
    ],
    openGraph: {
      title: `${site.name} — ${site.shortBlurb}`,
      description: site.blurb,
      siteName: site.name,
      locale: "en_ZA",
      type: "website",
      images: heroPhoto ? [heroPhoto] : [],
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  let navGroups: ReturnType<typeof groupCategories> = [];
  try {
    navGroups = groupCategories(await getCategories());
  } catch {
    navGroups = [];
  }
  const footerGroups = navGroups.map((g) => ({ slug: g.slug, name: g.name }));

  return (
    <html lang="en">
      <body className="bg-cream text-ink antialiased">
        <CartProvider>
          <SiteHeader groups={navGroups} />
          <main className="min-h-[60vh]">{children}</main>
          <SiteFooter groups={footerGroups} />
          <CartDrawer />
          <a
            href={`https://wa.me/${site.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg transition hover:scale-105"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1a12.6 12.6 0 0 1-4.8-3.3 9.3 9.3 0 0 1-1.9-3c-.2-.6 0-1.2.3-1.5l.6-.6c.2-.2.5-.2.7.1l1 1.7c.1.2.1.4 0 .6l-.4.6c-.1.2-.2.4 0 .6a8 8 0 0 0 3.3 2.7c.3.1.5 0 .6-.1l.7-.8c.2-.2.4-.2.6-.1l1.7.9c.3.2.4.4.3.7Z" />
            </svg>
            <span className="hidden sm:inline">WhatsApp us</span>
          </a>
        </CartProvider>
      </body>
    </html>
  );
}
