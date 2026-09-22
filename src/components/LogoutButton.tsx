"use client";

import { useState } from "react";

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      window.location.href = "/login";
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className="rounded-full bg-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cream transition hover:bg-flame disabled:opacity-60"
    >
      {pending ? "…" : "Log out"}
    </button>
  );
}
