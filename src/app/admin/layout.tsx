import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { LogoutButton } from "@/components/LogoutButton";
import { AdminTabs } from "@/components/AdminTabs";

const tabs = [
  { href: "/admin", label: "Orders", icon: "🧾" },
  { href: "/admin/products", label: "Products", icon: "👟" },
  { href: "/admin/stats", label: "Stats", icon: "📊" },
  { href: "/admin/profit-loss", label: "Profit/Loss", icon: "💰" },
  { href: "/admin/loyalty", label: "Loyalty", icon: "🎁" },
  { href: "/admin/laybuy", label: "Lay-buy", icon: "🗓️" },
  { href: "/admin/restock", label: "Restock List", icon: "📦" },
  { href: "/admin/deals", label: "Discounts", icon: "🔥" },
  { href: "/admin/testimonials", label: "Testimonials", icon: "💬" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="luxury-ambient luxury-ambient-still min-h-screen">
      <div className="relative mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="glass-neutral flex flex-wrap items-center justify-between gap-4 rounded-3xl p-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-flame">
              Tshidi the Plug admin
            </p>
            <h2 className="text-xl font-bold">Control centre</h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              prefetch={false}
              className="rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition hover:border-flame hover:text-flame"
            >
              View shop
            </Link>
            <LogoutButton />
          </div>
        </div>

        <AdminTabs tabs={tabs} />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
