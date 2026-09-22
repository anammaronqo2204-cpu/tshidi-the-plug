"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export type AdminTab = { href: string; label: string; icon: string };

// Shows a tiny spinner inside the tab that was just tapped, the instant it's tapped,
// so the button never feels dead while the next admin page loads from the server.
// (useLinkStatus must be rendered *inside* a <Link>.)
function PendingSpinner() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className="h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current"
    />
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminTabs({ tabs }: { tabs: AdminTab[] }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement | null>(null);
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  // On a phone (and on desktop once there are enough tabs) the tab row scrolls
  // sideways — keep the current tab in view. This scrolls the nav's OWN scrollLeft
  // directly instead of calling activeRef.scrollIntoView(): scrollIntoView walks up
  // through every scrollable ancestor to center the element, and for a tab near the
  // end of the row (Discounts, Testimonials, Settings) centering it needed more room
  // than the tab strip alone could give, so the browser scrolled the whole admin page
  // sideways instead — every page using this component looked shifted/cut off on the
  // left whenever one of those tabs was active. Scrolling nav.scrollLeft directly
  // keeps the effect contained to the pill strip and never touches the page scroll.
  useEffect(() => {
    const nav = navRef.current;
    const active = activeRef.current;
    if (!nav || !active) return;
    const target = active.offsetLeft - nav.clientWidth / 2 + active.clientWidth / 2;
    nav.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [pathname]);

  return (
    <nav
      ref={navRef}
      aria-label="Admin sections"
      className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1"
    >
      {tabs.map((tab) => {
        const active = isActive(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            // Admin pages are all live database views. Prefetching them in the
            // background (9 tabs x every page view) just floods the server and makes
            // the tab you actually tap wait in line, so it's switched off here.
            prefetch={false}
            ref={active ? activeRef : undefined}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
              active
                ? "border-ink bg-ink text-cream"
                : "border-ink/10 bg-white/80 hover:border-flame hover:text-flame"
            }`}
          >
            <span aria-hidden>{tab.icon}</span>
            {tab.label}
            <PendingSpinner />
          </Link>
        );
      })}
    </nav>
  );
}
