"use client";

import { useRouter } from "next/navigation";

/** Goes back to wherever the customer actually came from (scroll position, filters, search
 * term intact) instead of a fixed link to a generic listing page. */
export function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-ink/40 transition hover:text-flame ${className}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="m14 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}
