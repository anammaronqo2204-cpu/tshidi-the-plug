"use client";

import { useEffect, useState } from "react";
import JSZip from "jszip";
import { bulkCreateProducts } from "@/lib/admin-actions";
import { shrinkImageForUpload } from "@/lib/shrink-image";

// Images are uploaded to /api/admin/upload, which stores the bytes in Netlify Blobs.
const UPLOAD_TIMEOUT_MS = 30_000;

async function uploadImageToBlobStore(blob: Blob, fileName: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, fileName);
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
      throw new Error(`Upload of "${fileName}" timed out after 30s.`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

const input = "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-flame";
const label = "text-[10px] font-black uppercase tracking-[0.2em] text-ink/45";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

// Detects a price (and optional bundle deal) baked into the *zip's own* filename,
// e.g. "Wax_Jeans_Renamed_R1500.zip" -> 1500, "1200.zip" -> 1200,
// "Kids_Shoes_Renamed_R800__x2_for_R1450.zip" -> 800 (ignores the bundle figure).
function parseBatchPriceFromZipName(zipFilename: string): number | null {
  const base = zipFilename.replace(/\.zip$/i, "").replace(/_/g, " ");
  const withoutBundle = base.replace(/x\s?\d+\s*for\s*R?\s?\d{3,5}/gi, " ");
  const withR = withoutBundle.match(/R\s?(\d{3,5})/i);
  if (withR) return Math.round(Number(withR[1]) * 100);
  const bare = withoutBundle.match(/\b(\d{3,5})\b/);
  return bare ? Math.round(Number(bare[1]) * 100) : null;
}

// Detects a price (and optional bundle deal) baked into an *individual image's*
// filename, e.g. "...Black Cream R1500.jpeg" -> price 1500, name without the price;
// "...Pair R1000, x2 for R1800.jpeg" -> price 1000 + a "2 for R1800" bundle note.
function parseItemSuffix(nameWithoutExt: string) {
  const match = nameWithoutExt.match(
    /^(.*?)[\s,-]*R\s?(\d{3,5})(?:\s*,?\s*x\s?(\d+)\s*for\s*R\s?(\d{3,5}))?\s*$/i,
  );
  if (!match) return { cleanName: nameWithoutExt, priceCents: null as number | null, bundleNote: null as string | null };
  const cleanName = match[1].trim();
  const priceCents = Math.round(Number(match[2]) * 100);
  const bundleNote = match[3] && match[4] ? `Bundle deal: ${match[3]} for R${match[4]}` : null;
  return { cleanName, priceCents, bundleNote };
}

// Known brands, longest-name-first so "New Balance" matches before a bare "New"
// would, and "Travis Scott x Air Jordan" matches before "Air Jordan" would.
// Add to this list any brand you sell that isn't covered yet.
const KNOWN_BRANDS = [
  "Travis Scott x Air Jordan",
  "Travis Scott x Nike",
  "Air Jordan",
  "New Balance",
  "Under Armour",
  "Nike",
  "Adidas",
  "Lacoste",
  "Puma",
  "Converse",
  "Vans",
  "Reebok",
  "Asics",
  "Fila",
  "Crocs",
  "Skechers",
  "Timberland",
  "Yeezy",
  "Balenciaga",
  "Gucci",
].sort((a, b) => b.length - a.length);

// Matches a known brand at the start of the name (word-boundary safe), e.g.
// "Nike Air Max 1" -> brand "Nike". Falls back to the first word if nothing
// in the list matches, so an unlisted brand still gets *something* filled in
// (editable per-row afterwards).
function detectBrand(name: string): string {
  for (const brand of KNOWN_BRANDS) {
    const re = new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(name)) return brand;
  }
  const firstWord = name.split(" ")[0];
  return firstWord || "Unbranded";
}

function nameFromFilename(filename: string) {
  const base = filename.split("/").pop() ?? filename;
  const stripped = base.replace(IMAGE_EXT, "");
  const { cleanName, priceCents, bundleNote } = parseItemSuffix(stripped);
  // Filenames are already human-readable (e.g. "Nike Air Max 1 - White Purple
  // Sangria"), so just normalise whitespace/underscores — don't re-title-case,
  // that would mangle things like "TN", "OG", "F50".
  const spaced = cleanName.replace(/_+/g, " ").replace(/\s+/g, " ").trim();
  const brand = detectBrand(spaced);
  return { name: spaced, brand, priceCents, bundleNote };
}

// Auto-categorised sizes: pick a preset based on what the category is called,
// so the merchant doesn't have to retype the same size list on every batch.
// Still just fills the text box — fully editable per batch afterwards (e.g.
// trim a wig design down to the lengths it's actually stocked in).
const SIZE_PRESETS = {
  clothing: "S, M, L, XL",
  shoes: "4, 5, 6, 7, 8, 9, 10, 11, 12",
  wigs: "10, 12, 14, 16, 18, 20, 22",
} as const;

type SizeKind = keyof typeof SIZE_PRESETS;

function guessSizeKind(categoryName: string): SizeKind | null {
  const n = categoryName.toLowerCase();
  if (/\b(wig|weave|closure|frontal|braid|bundle|hair)\b/.test(n)) return "wigs";
  if (/\b(shoe|sneaker|slide|sandal|boot|heel|takkie|footwear|trainer)\b/.test(n)) return "shoes";
  if (/\b(shirt|tee|hoodie|jacket|tracksuit|jean|pant|trouser|dress|top|sweater|sweatshirt|jersey|clothing|apparel|skirt|short)\b/.test(n))
    return "clothing";
  return null;
}

type Row = {
  name: string;
  brand: string;
  imageUrl: string;
  fileName: string;
  priceOverride: number | null; // cents; null = use the batch price
  bundleNote: string | null;
  // Only used for wig-style categories: "10:1000, 12:1200, 14:1350" — one photo,
  // many sizes, each with its own rand price. When filled in, this row becomes
  // ONE product with a size dropdown instead of using priceOverride/batch price.
  sizePricingText: string;
};

// "10:1000, 12:1200" -> { "10": 1000, "12": 1200 }. Ignores blank/incomplete
// entries (e.g. a size the merchant hasn't typed a price for yet) so a
// half-filled row doesn't crash the submit — it just won't include that size.
function parseSizePricingText(text: string): Record<string, number> | null {
  const pairs = text
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [size, priceStr] = chunk.split(":").map((s) => s.trim());
      const price = Number(priceStr);
      return size && Number.isFinite(price) && price > 0 ? ([size, price] as const) : null;
    })
    .filter((pair): pair is readonly [string, number] => pair !== null);
  return pairs.length ? Object.fromEntries(pairs) : null;
}

// Default per-row template for a wig batch, so the merchant just has to fill
// in the numbers after each colon instead of typing the whole thing.
function sizePricingTemplate(kind: SizeKind | null): string {
  if (kind !== "wigs") return "";
  return SIZE_PRESETS.wigs
    .split(",")
    .map((s) => `${s.trim()}:`)
    .join(", ");
}

export default function BulkZipUpload({
  categoryOptions,
}: {
  categoryOptions: { slug: string; name: string }[];
}) {
  const [fallbackBrand, setFallbackBrand] = useState("");
  const [categorySlug, setCategorySlug] = useState(categoryOptions[0]?.slug ?? "sneakers");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [sizes, setSizes] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ created: number } | null>(null);

  // Pre-fill sizes for whatever category is selected by default, on first load.
  useEffect(() => {
    const initialCategory = categoryOptions[0];
    if (!initialCategory) return;
    const kind = guessSizeKind(initialCategory.name);
    if (kind) setSizes(SIZE_PRESETS[kind]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentCategoryName = categoryOptions.find((c) => c.slug === categorySlug)?.name ?? "";
  const currentKind = guessSizeKind(currentCategoryName);
  const isWigBatch = currentKind === "wigs";

  function handleCategoryChange(slug: string) {
    setCategorySlug(slug);
    const category = categoryOptions.find((c) => c.slug === slug);
    const kind = category ? guessSizeKind(category.name) : null;
    if (kind) setSizes(SIZE_PRESETS[kind]);
  }

  async function handleZip(file: File | null) {
    if (!file) return;
    setError("");
    setResult(null);
    setRows([]);
    setBusy(true);
    setStatus("Reading zip…");
    try {
      const detectedBatchPrice = parseBatchPriceFromZipName(file.name);
      if (detectedBatchPrice) setPrice(String(detectedBatchPrice / 100));

      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter(
        (entry) => !entry.dir && IMAGE_EXT.test(entry.name) && !entry.name.startsWith("__MACOSX"),
      );

      if (!entries.length) {
        setError("No image files found in that zip.");
        setBusy(false);
        setStatus("");
        return;
      }

      const uploaded: Row[] = [];
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        setStatus(`Uploading ${i + 1} of ${entries.length}: ${entry.name}`);
        const blob = await entry.async("blob");
        const fileName = entry.name.split("/").pop() ?? entry.name;
        // Shrink big photos first (much faster upload, and a much lighter shop/admin).
        // Name, brand and price are still read from the ORIGINAL filename below.
        const shrunk = await shrinkImageForUpload(blob, fileName);
        const url = await uploadImageToBlobStore(shrunk, shrunk.name);
        const { name, brand, priceCents, bundleNote } = nameFromFilename(fileName);
        const currentCategory = categoryOptions.find((c) => c.slug === categorySlug);
        const kind = currentCategory ? guessSizeKind(currentCategory.name) : null;
        uploaded.push({
          name,
          brand,
          imageUrl: url,
          fileName,
          priceOverride: priceCents,
          bundleNote,
          sizePricingText: sizePricingTemplate(kind),
        });
      }

      setRows(uploaded);
      const overrideCount = uploaded.filter((r) => r.priceOverride !== null).length;
      const unknownBrandCount = uploaded.filter((r) => !KNOWN_BRANDS.includes(r.brand)).length;
      setStatus(
        [
          `${uploaded.length} image(s) uploaded.`,
          overrideCount ? `${overrideCount} had their own price in the filename.` : null,
          unknownBrandCount ? `${unknownBrandCount} brand(s) weren't recognised — check those rows.` : "Brands detected from filenames — check the rows below.",
        ]
          .filter(Boolean)
          .join(" "),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't read or upload that zip. Check the file and your connection, then try again.",
      );
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  function updateName(index: number, value: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, name: value } : row)));
  }

  function updateBrand(index: number, value: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, brand: value } : row)));
  }

  function updatePriceOverride(index: number, value: string) {
    const cents = value.trim() ? Math.round(Number(value.replace(/[^0-9.]/g, "")) * 100) : null;
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, priceOverride: cents && cents > 0 ? cents : null } : row)));
  }

  function updateBundleNote(index: number, value: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, bundleNote: value.trim() || null } : row)));
  }

  function updateSizePricingText(index: number, value: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, sizePricingText: value } : row)));
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setError("");
    const batchPriceCents = Math.round(Number(price.replace(/[^0-9.]/g, "")) * 100);
    const rowSizePricing = rows.map((row) => (isWigBatch ? parseSizePricingText(row.sizePricingText) : null));
    // A row "has its own price" either the normal way (price in its filename)
    // or via a filled-in size:price table — either means the batch price box
    // above can stay empty for that row.
    const everyRowHasOwnPrice =
      rows.length > 0 && rows.every((row, i) => row.priceOverride !== null || rowSizePricing[i] !== null);
    if ((!batchPriceCents || batchPriceCents <= 0) && !everyRowHasOwnPrice) {
      setError(
        isWigBatch
          ? "Add a valid batch price, or fill in each row's size:price list below."
          : "Add a valid price — it applies to any item that doesn't have its own price set below.",
      );
      return;
    }
    if (!rows.length) {
      setError("Upload a zip first.");
      return;
    }
    if (isWigBatch && rowSizePricing.some((p) => p === null) && rows.some((r) => r.sizePricingText.trim())) {
      setError("One of the size:price rows looks incomplete — check every size has a number after its colon.");
      return;
    }
    setBusy(true);
    setStatus("Adding products to inventory…");
    try {
      const sizesList = sizes
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const outcome = await bulkCreateProducts({
        fallbackBrand: fallbackBrand.trim() || undefined,
        categorySlug,
        priceCents: batchPriceCents || 0,
        stock: Number(stock) || 0,
        sizes: sizesList,
        items: rows.map(({ name, brand, imageUrl, priceOverride, bundleNote }, i) => ({
          name,
          brand,
          imageUrl,
          priceCents: priceOverride ?? undefined,
          details: bundleNote ? [bundleNote] : undefined,
          sizePricing: rowSizePricing[i] ?? undefined,
        })),
      });
      setResult(outcome);
      setStatus("");
      if (outcome.created === rows.length) {
        setRows([]);
      } else {
        // Some (or all) rows didn't have a usable price and got silently dropped by
        // the server action before — now we say so instead of leaving the merchant
        // staring at rows that look like nothing happened.
        setError(
          isWigBatch
            ? `Only ${outcome.created} of ${rows.length} saved — the rest are missing a price. Check every size in their size:price box has a number after the colon (no blanks, e.g. "10:1000" not "10:").`
            : `Only ${outcome.created} of ${rows.length} saved — the rest are missing a price. Add a batch price above, or a per-row price.`,
        );
      }
    } catch {
      setError("Couldn't save the products. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass-neutral mt-6 rounded-3xl p-6">
      <h2 className="text-xl font-black">Bulk-add from zip</h2>
      <p className="mt-1 text-sm text-ink/55">
        Zip up already-renamed images, e.g. <span className="font-mono">Nike Air Max 1 - White Purple Sangria.jpeg</span>.
        Brand is detected from each filename automatically (editable per row below). If the zip&apos;s own filename has a
        price in it (e.g. <span className="font-mono">1500.zip</span>), that becomes the shared price for every item — or set one manually below.
        Sizes are also guessed from the category you pick — clothing gets S/M/L/XL, shoes get 4–12, and wigs/closures/hair get an inch range —
        edit the box if a specific batch needs something different.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        <div>
          <label className={label}>Fallback brand</label>
          <input
            value={fallbackBrand}
            onChange={(e) => setFallbackBrand(e.target.value)}
            className={`${input} mt-1`}
            placeholder="Only used if a filename's brand isn't recognised"
          />
        </div>
        <div>
          <label className={label}>Category</label>
          <select value={categorySlug} onChange={(e) => handleCategoryChange(e.target.value)} className={`${input} mt-1`}>
            {categoryOptions.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        {isWigBatch ? (
          <div className="md:col-span-2">
            <label className={label}>Price</label>
            <p className={`${input} mt-1 flex items-center text-ink/50`}>
              Set per length below — each wig gets its own size:price list ↓
            </p>
          </div>
        ) : (
          <div>
            <label className={label}>Price in rand (all items)</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} className={`${input} mt-1`} placeholder="1299" />
          </div>
        )}
        <div>
          <label className={label}>Stock units (each)</label>
          <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" min="0" className={`${input} mt-1`} />
        </div>
        {!isWigBatch ? (
          <div>
            <label className={label}>Sizes (all items) — auto-filled, editable</label>
            <input
              value={sizes}
              onChange={(e) => setSizes(e.target.value)}
              className={`${input} mt-1`}
              placeholder="6, 7, 8, 9, 10 or S, M, L, XL"
            />
          </div>
        ) : null}
      </div>

      {isWigBatch ? (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[11px] font-semibold text-amber-800">
          Wig category detected — each photo below becomes ONE product with a size dropdown. Fill in the
          rand price after each colon (e.g. <span className="font-mono">10:1000, 12:1200</span>); delete any
          size this particular wig doesn&apos;t come in.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label
          className={`cursor-pointer rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.2em] transition ${
            !busy ? "bg-ink text-cream hover:bg-flame" : "cursor-not-allowed bg-ink/20 text-ink/40"
          }`}
        >
          📦 Upload zip
          <input
            type="file"
            accept=".zip"
            disabled={busy}
            onChange={(e) => handleZip(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
        {status ? <span className="text-[11px] text-ink/50">{status}</span> : null}
      </div>

      {error ? <p className="mt-2 text-[11px] font-semibold text-flame">{error}</p> : null}
      {result ? (
        <p className="mt-2 text-[11px] font-semibold text-emerald-600">
          Added {result.created} product{result.created === 1 ? "" : "s"} to inventory.
        </p>
      ) : null}

      {rows.length ? (
        <div className="mt-5 space-y-2">
          {rows.map((row, index) => (
            <div key={`${row.fileName}-${index}`} className="rounded-xl border border-ink/10 bg-white/70 p-2 pr-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-sand/60 ring-1 ring-ink/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <input
                  value={row.name}
                  onChange={(e) => updateName(index, e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-ink/15 bg-white px-3 py-2 text-xs outline-none focus:border-flame"
                />
                <input
                  value={row.brand}
                  onChange={(e) => updateBrand(index, e.target.value)}
                  title="Detected brand — edit if it's wrong"
                  className={`w-28 shrink-0 rounded-lg border px-3 py-2 text-xs outline-none focus:border-flame ${
                    KNOWN_BRANDS.includes(row.brand) ? "border-ink/15 bg-white" : "border-amber-300 bg-amber-50"
                  }`}
                />
                {!isWigBatch ? (
                  <input
                    value={row.priceOverride !== null ? String(row.priceOverride / 100) : ""}
                    onChange={(e) => updatePriceOverride(index, e.target.value)}
                    placeholder="Batch price"
                    title="Price for this item only (leave blank to use the batch price above)"
                    className="w-24 shrink-0 rounded-lg border border-ink/15 bg-white px-3 py-2 text-xs outline-none focus:border-flame"
                  />
                ) : null}
                {row.bundleNote !== null ? (
                  <input
                    value={row.bundleNote}
                    onChange={(e) => updateBundleNote(index, e.target.value)}
                    title="Bundle deal note — saved as a detail bullet on the product (no bundle-pricing field exists yet)"
                    className="w-40 shrink-0 rounded-lg border border-ink/15 bg-amber-50 px-3 py-2 text-xs outline-none focus:border-flame"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="shrink-0 rounded-full border border-ink/10 px-2.5 py-1 text-[11px] font-black text-ink/40 hover:border-flame hover:text-flame"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
              {isWigBatch ? (
                <div className="mt-2 pl-[60px]">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-ink/40">
                    Sizes &amp; prices (inch:rand)
                  </label>
                  <input
                    value={row.sizePricingText}
                    onChange={(e) => updateSizePricingText(index, e.target.value)}
                    placeholder="10:1000, 12:1200, 14:1350"
                    className="mt-1 w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs outline-none focus:border-flame"
                  />
                </div>
              ) : null}
            </div>
          ))}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="mt-3 rounded-full bg-ink px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-cream hover:bg-flame disabled:opacity-40"
          >
            {busy ? "Adding…" : `Add ${rows.length} product${rows.length === 1 ? "" : "s"} to inventory`}
          </button>
        </div>
      ) : null}
    </section>
  );
}
