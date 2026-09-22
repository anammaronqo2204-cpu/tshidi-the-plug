"use client";

import { useEffect, useState } from "react";

export function DealCountdown({
  endsAt,
  variant = "dark",
}: {
  endsAt: string;
  variant?: "dark" | "light";
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = Math.max(0, new Date(endsAt).getTime() - now);
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  const pad = (value: number) => String(value).padStart(2, "0");

  const chip =
    variant === "dark"
      ? "bg-cream/10 text-cream ring-1 ring-cream/15"
      : "bg-white text-ink ring-1 ring-ink/10";
  const label = variant === "dark" ? "text-cream/50" : "text-ink/45";

  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] font-bold uppercase tracking-[0.22em] ${label}`}>
        Ends in
      </span>
      {[
        [pad(hours), "hrs"],
        [pad(minutes), "min"],
        [pad(seconds), "sec"],
      ].map(([value, unit]) => (
        <span key={unit} className={`rounded-lg px-2.5 py-1.5 text-sm font-bold tabular-nums ${chip}`}>
          {value}
          <span className={`ml-1 text-[9px] font-semibold uppercase ${label}`}>{unit}</span>
        </span>
      ))}
    </div>
  );
}
