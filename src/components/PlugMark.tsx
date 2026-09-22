"use client";

import Link from "next/link";
import { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { site } from "@/lib/site";

/** The two-prong plug monogram used across the header, footer and loaders. */
export function PlugIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M9 2v5M15 2v5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M6 7h12v4.2A6 6 0 0 1 12 17.2 6 6 0 0 1 6 11.2V7Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M12 17.4V22" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

// Tap the logo 7 times within this window to reach the admin panel. It's not linked or
// mentioned anywhere in the visible UI on purpose — this is the only way in for customers
// browsing the site. Going to /admin still requires a real login either way; this just
// keeps the door itself invisible.
const SECRET_TAP_COUNT = 7;
const SECRET_TAP_WINDOW_MS = 2500;

export function Wordmark({
  variant = "dark",
  className = "",
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  const badge = variant === "dark" ? "bg-ink text-volt" : "bg-volt text-ink";
  const sub = variant === "dark" ? "text-ink/50" : "text-cream/50";
  const router = useRouter();
  const pathname = usePathname();
  const tapTimes = useRef<number[]>([]);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    const now = Date.now();
    tapTimes.current = [...tapTimes.current, now].filter(
      (t) => now - t < SECRET_TAP_WINDOW_MS,
    );

    if (tapTimes.current.length >= SECRET_TAP_COUNT) {
      tapTimes.current = [];
      event.preventDefault();
      router.push("/admin");
    }
    // Otherwise let the click behave completely normally — it just navigates home,
    // same as always. Nothing visibly changes until the 7th tap lands.
  }

  return (
    <Link
      href="/"
      prefetch={pathname?.startsWith("/admin") ? false : undefined}
      onClick={handleClick}
      className={`flex items-center gap-2.5 ${className}`}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${badge}`}>
        <PlugIcon className="h-5 w-5" />
      </span>
      <span className="leading-none">
        <span className="block text-[17px] font-black tracking-tight">{site.logoTop}</span>
        <span className={`block text-[9.5px] font-bold uppercase tracking-[0.32em] ${sub}`}>
          {site.logoBottom}
        </span>
      </span>
    </Link>
  );
}
