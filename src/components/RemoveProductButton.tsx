"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/lib/admin-actions";

export default function RemoveProductButton({ id, name }: { id: number; name: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    // Stop the click from also toggling the parent <details>/<summary> open/closed —
    // this button lives in the summary row so it's visible without expanding anything.
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Remove "${name}" from inventory? This can't be undone.`)) return;
    setError("");

    const formData = new FormData();
    formData.set("id", String(id));
    startTransition(async () => {
      try {
        await deleteProduct(formData);
        router.refresh();
      } catch (err) {
        // Without this, a failed delete left the button stuck on "Removing…"
        // forever with no clue why. Now it resets and says what went wrong.
        setError(err instanceof Error ? err.message : "Couldn't remove this product. Try again.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="shrink-0 rounded-full border border-flame/30 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-flame transition hover:bg-flame hover:text-white disabled:opacity-40"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
      {error ? <span className="text-[10px] font-semibold text-flame">{error}</span> : null}
    </div>
  );
}
