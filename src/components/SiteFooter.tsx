import Link from "next/link";
import { NewsletterForm } from "./NewsletterForm";
import { Wordmark } from "./PlugMark";
import { site } from "@/lib/site";

type FooterGroup = { slug: string; name: string };

export function SiteFooter({ groups }: { groups: FooterGroup[] }) {
  return (
    <footer className="mt-24 bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <Wordmark variant="light" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/60">{site.blurb}</p>
            <div className="mt-5 flex gap-2">
              {["Visa", "Mastercard", "EFT", "SnapScan", "Lay-bye"].map((method) => (
                <span
                  key={method}
                  className="rounded-md border border-cream/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cream/60"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-volt">Shop</h4>
            <ul className="mt-5 space-y-3 text-sm text-cream/65">
              <li>
                <Link href="/shop" className="hover:text-volt">
                  All products
                </Link>
              </li>
              {groups.map((group) => (
                <li key={group.slug}>
                  <Link href={`/shop?group=${group.slug}`} className="hover:text-volt">
                    {group.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-volt">Help</h4>
            <ul className="mt-5 space-y-3 text-sm text-cream/65">
              <li>
                <Link href="/track" className="hover:text-volt">
                  Track my order
                </Link>
              </li>
              <li>
                <Link href="/tshidi" className="hover:text-volt">
                  Meet Tshidi
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-volt">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="hover:text-volt">
                  Delivery times
                </Link>
              </li>
              <li>
                <Link href="/policies" className="hover:text-volt">
                  Store policies
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-volt">
              Get the drops first
            </h4>
            <p className="mt-4 text-sm text-cream/60">
              New sneaker restocks, clothing drops and homeware specials — straight to your inbox.
            </p>
            <div className="mt-4">
              <NewsletterForm />
            </div>
            <div className="mt-6 space-y-1 text-sm text-cream/60">
              <p>📞 {site.phone}</p>
              <p>✉️ {site.email}</p>
              <p>📍 {site.city}</p>
              <p>🕒 {site.hours}</p>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-cream/10 pt-6 text-xs text-cream/40 sm:flex-row">
          <p>© {new Date().getFullYear()} {site.name}. Built with love in Mzansi.</p>
          <p>Prices in South African Rand (ZAR), VAT included.</p>
        </div>
      </div>
    </footer>
  );
}
