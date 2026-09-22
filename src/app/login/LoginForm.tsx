"use client";

import { useState } from "react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Hard navigation forces the browser to send the freshly set cookie.
        window.location.href = "/admin";
        return;
      }

      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Login failed. Please try again.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <div>
        <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-ink/45">
          Admin password
        </label>
        <input
          name="password"
          type="password"
          autoFocus
          required
          placeholder="Enter password"
          className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm outline-none focus:border-flame"
        />
      </div>
      {error ? (
        <p className="rounded-xl bg-flame/10 px-4 py-2 text-xs font-semibold text-flame">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-ink px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-cream transition hover:bg-flame disabled:opacity-60"
      >
        {pending ? "Checking…" : "Enter control centre"}
      </button>
    </form>
  );
}
