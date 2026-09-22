"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState("loading");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setState("done");
      setMessage("You're on the list — watch your inbox for drops.");
      setEmail("");
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setState("error");
      setMessage(data.error ?? "Something went wrong, try again.");
    }
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="your@email.co.za"
          className="w-full rounded-full border border-cream/20 bg-cream/10 px-5 py-3 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-volt"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="shrink-0 rounded-full bg-volt px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-ink transition hover:bg-cream disabled:opacity-60"
        >
          {state === "loading" ? "Adding…" : "Notify me"}
        </button>
      </div>
      {message ? (
        <p className={`mt-2 text-xs ${state === "error" ? "text-flame" : "text-volt"}`}>{message}</p>
      ) : null}
    </form>
  );
}
