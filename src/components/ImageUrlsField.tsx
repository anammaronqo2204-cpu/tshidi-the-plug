"use client";

import { useId, useState } from "react";
import { shrinkImageForUpload } from "@/lib/shrink-image";

const label = "text-[10px] font-black uppercase tracking-[0.2em] text-ink/45";

function BrokenImage() {
  return (
    <div className="flex h-full w-full items-center justify-center text-[9px] font-bold uppercase tracking-wide text-ink/30">
      No preview
    </div>
  );
}

const UPLOAD_TIMEOUT_MS = 30_000;

// Uploads to /api/admin/upload, which stores the bytes in Netlify Blobs.
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

export default function ImageUrlsField({ initialImages = [] as string[] }: { initialImages?: string[] }) {
  const [urls, setUrls] = useState<string[]>(initialImages.length ? initialImages : [""]);
  const [broken, setBroken] = useState<Record<number, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const reactId = useId();

  const cleaned = urls.map((u) => u.trim()).filter(Boolean);

  function update(index: number, value: string) {
    setUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
    setBroken((prev) => ({ ...prev, [index]: false }));
  }

  function addRow(value = "") {
    setUrls((prev) => {
      const withoutTrailingBlank = prev.filter((u) => u.trim());
      return [...withoutTrailingBlank, value];
    });
  }

  function removeRow(index: number) {
    setUrls((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [""]));
  }

  function move(index: number, direction: -1 | 1) {
    setUrls((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return;
    setUploadError("");
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        if (!file.type.startsWith("image/")) continue;
        const url = await uploadImageToBlobStore(await shrinkImageForUpload(file, file.name));
        addRow(url);
      }
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : "Upload failed. Check your connection and that you're signed in, then try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between">
        <label className={label}>Product photos</label>
        <span className="text-[11px] text-ink/45">
          {cleaned.length ? `${cleaned.length} image${cleaned.length === 1 ? "" : "s"}` : "No images yet"}
        </span>
      </div>

      {/* This is what actually gets submitted — same "images" textarea the server action already expects. */}
      <textarea name="images" value={cleaned.join("\n")} readOnly className="hidden" aria-hidden />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label
          className={`cursor-pointer rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition ${
            !uploading ? "bg-ink text-cream hover:bg-flame" : "cursor-not-allowed bg-ink/20 text-ink/40"
          }`}
        >
          {uploading ? "Uploading…" : "📷 Upload photos from device"}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </label>
      </div>
      {uploadError ? (
        <p className="mt-1.5 text-[11px] font-semibold text-flame">{uploadError}</p>
      ) : null}

      <div className="mt-3 space-y-2">
        {urls.map((url, index) => {
          const trimmed = url.trim();
          const isMain = index === 0;
          return (
            <div
              key={`${reactId}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white/70 p-2 pr-3"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-sand/60 ring-1 ring-ink/5">
                {trimmed && !broken[index] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={trimmed}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                    onError={() => setBroken((prev) => ({ ...prev, [index]: true }))}
                  />
                ) : (
                  <BrokenImage />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span
                  className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${
                    isMain ? "bg-flame/10 text-flame" : "text-ink/35"
                  }`}
                >
                  {isMain ? "Main photo" : `Photo ${index + 1}`}
                </span>
                <input
                  value={url}
                  onChange={(e) => update(index, e.target.value)}
                  placeholder="https://images.pexels.com/... or upload above"
                  className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-xs outline-none focus:border-flame"
                />
              </div>

              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="rounded-md border border-ink/10 px-1.5 py-0.5 text-[10px] font-bold text-ink/50 hover:border-flame hover:text-flame disabled:opacity-25"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === urls.length - 1}
                  className="rounded-md border border-ink/10 px-1.5 py-0.5 text-[10px] font-bold text-ink/50 hover:border-flame hover:text-flame disabled:opacity-25"
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>

              <button
                type="button"
                onClick={() => removeRow(index)}
                className="shrink-0 rounded-full border border-ink/10 px-2.5 py-1 text-[11px] font-black text-ink/40 hover:border-flame hover:text-flame"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => addRow("")}
        className="mt-2 rounded-full border border-dashed border-ink/20 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-ink/50 hover:border-flame hover:text-flame"
      >
        + Add another photo URL
      </button>

      <p className="mt-2 text-[11px] text-ink/45">
        Upload straight from your device, or paste a direct image link. It&apos;ll preview here
        right away. The top photo is what shows first on the shop and product page — use the
        arrows to reorder.
      </p>
    </div>
  );
}
