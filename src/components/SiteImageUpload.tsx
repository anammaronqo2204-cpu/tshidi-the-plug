"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSiteImage } from "@/lib/admin-actions";
import type { SiteImageKey } from "@/lib/site-images";

const UPLOAD_TIMEOUT_MS = 30_000;

async function uploadImageToBlobStore(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, file.name);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || `Upload failed (${res.status})`);
    }
    const data = (await res.json()) as { url: string };
    return data.url;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`Upload of "${file.name}" timed out after 30s.`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export default function SiteImageUpload({
  imageKey,
  label,
  helpText,
  currentUrl,
}: {
  imageKey: SiteImageKey;
  label: string;
  helpText: string;
  currentUrl: string;
}) {
  const [preview, setPreview] = useState(currentUrl);
  const [broken, setBroken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function handleFile(file: File | null) {
    if (!file) return;
    setError("");
    setSaved(false);
    setBusy(true);
    try {
      const url = await uploadImageToBlobStore(file);
      setPreview(url);
      setBroken(false);
      const result = await updateSiteImage(imageKey, url);
      if (result.ok) {
        setSaved(true);
        startTransition(() => router.refresh());
      } else {
        setError("Couldn't save that photo. Try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-ink/10 bg-white/70 p-4">
      <div className="h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-sand/60 ring-1 ring-ink/5">
        {preview && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-center text-[9px] font-bold uppercase tracking-wide text-ink/30">
            No photo yet
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-black">{label}</p>
        <p className="mt-0.5 text-[11px] text-ink/50">{helpText}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label
            className={`cursor-pointer rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition ${
              !busy ? "bg-ink text-cream hover:bg-flame" : "cursor-not-allowed bg-ink/20 text-ink/40"
            }`}
          >
            {busy ? "Uploading…" : "📷 Upload photo"}
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
          {saved && !pending ? (
            <span className="text-[11px] font-semibold text-emerald-600">Saved — live now.</span>
          ) : null}
        </div>
        {error ? <p className="mt-1.5 text-[11px] font-semibold text-flame">{error}</p> : null}
      </div>
    </div>
  );
}
