"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/lib/format";
import { bankAccounts, courierTiers, provinces, shippingCentsForTier, site } from "@/lib/site";

const field =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-ink";
const label = "text-[11px] font-black uppercase tracking-[0.2em] text-ink/45";

/**
 * Shrinks + re-encodes an image entirely in the browser and hands back a JPEG
 * data URL. No file storage service needed — the resulting string (a couple
 * hundred KB, typically) gets saved straight into the orders table.
 */
function compressImageToDataUrl(file: File, maxDimension = 1400, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read that image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const scale = maxDimension / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function CheckoutView() {
  const { cart, refresh } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [delivery, setDelivery] = useState("large");
  const [payment, setPayment] = useState("eft");
  const [province, setProvince] = useState("Gauteng");
  const [proofUrl, setProofUrl] = useState("");
  const [proofUploading, setProofUploading] = useState(false);
  const [proofError, setProofError] = useState("");
  const [customerName, setCustomerName] = useState("");

  async function handleProofFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProofError("Please upload a photo (JPG, PNG, etc).");
      return;
    }
    setProofError("");
    setProofUploading(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      setProofUrl(dataUrl);
    } catch {
      setProofError("Couldn't read that photo. Try a different one.");
    } finally {
      setProofUploading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (payment === "eft" && !proofUrl) {
      setError("Please upload proof of payment before placing your order.");
      return;
    }

    setBusy(true);
    setError("");

    const data = Object.fromEntries(new FormData(event.currentTarget).entries());

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        deliveryMethod: delivery,
        paymentMethod: payment,
        proofOfPaymentUrl: proofUrl,
      }),
    });

    const payload = (await res.json().catch(() => ({}))) as {
      orderNumber?: string;
      error?: string;
    };

    if (!res.ok || !payload.orderNumber) {
      setError(payload.error ?? "We could not place that order. Please try again.");
      setBusy(false);
      return;
    }

    await refresh();
    router.push(`/order/${payload.orderNumber}`);
  }

  if (cart.lines.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-16 text-center ring-1 ring-ink/5">
        <p className="text-6xl">🧾</p>
        <h2 className="mt-5 text-3xl font-black">Nothing to check out yet</h2>
        <p className="mt-2 text-sm text-ink/55">Add a few items to your bag and come back.</p>
        <Link
          href="/shop"
          className="mt-7 inline-block rounded-full bg-ink px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-cream"
        >
          Browse the store
        </Link>
      </div>
    );
  }

  const deliveryCost = shippingCentsForTier(delivery, province);
  const total = cart.subtotalCents + deliveryCost;

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-flame">
            1 · Your details
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={label} htmlFor="customerName">
                Full name (used as your payment reference)
              </label>
              <input
                id="customerName"
                name="customerName"
                required
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className={`${field} mt-1.5`}
                placeholder="Thandi Mokoena"
              />
            </div>
            <div>
              <label className={label} htmlFor="email">
                Email
              </label>
              <input id="email" name="email" type="email" required className={`${field} mt-1.5`} placeholder="you@email.co.za" />
            </div>
            <div>
              <label className={label} htmlFor="phone">
                Mobile number
              </label>
              <input id="phone" name="phone" required className={`${field} mt-1.5`} placeholder="082 000 0000" />
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-flame">
            2 · Delivery
          </h2>

          <p className="mt-2 rounded-xl bg-sand/70 px-4 py-3 text-xs font-semibold text-ink/60">
            Ordering sneakers or something bulky? Go for a <span className="font-black">large parcel</span> so it fits properly.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {courierTiers.map((tier) => {
              const localPrice = formatMoney(tier.localCents);
              const nationalPrice = formatMoney(tier.nationalCents);
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setDelivery(tier.id)}
                  className={`relative rounded-2xl border p-4 text-left transition ${
                    delivery === tier.id ? "border-ink bg-sand" : "border-ink/15 hover:border-ink/40"
                  }`}
                >
                  {tier.recommended ? (
                    <span className="absolute right-3 top-3 rounded-full bg-flame/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-flame">
                      Recommended
                    </span>
                  ) : null}
                  <p className="pr-16 text-sm font-black">{tier.title}</p>
                  <p className="text-xs text-ink/50">{tier.copy}</p>
                  <p className="mt-1 text-xs font-bold text-ink/70">
                    {localPrice} {site.localProvince} · {nationalPrice} rest of SA
                  </p>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setDelivery("collect")}
              className={`rounded-2xl border p-4 text-left transition sm:col-span-2 ${
                delivery === "collect" ? "border-ink bg-sand" : "border-ink/15 hover:border-ink/40"
              }`}
            >
              <p className="text-sm font-black">Collect in person</p>
              <p className="text-xs text-ink/50">Free · {site.city.split(",")[0]}</p>
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={label} htmlFor="address">
                Street address
              </label>
              <input id="address" name="address" required className={`${field} mt-1.5`} placeholder="14 Vilakazi Street, Orlando West" />
            </div>
            <div>
              <label className={label} htmlFor="city">
                City / Town
              </label>
              <input id="city" name="city" required className={`${field} mt-1.5`} placeholder="Soweto" />
            </div>
            <div>
              <label className={label} htmlFor="province">
                Province
              </label>
              <select
                id="province"
                name="province"
                required
                value={province}
                onChange={(event) => setProvince(event.target.value)}
                className={`${field} mt-1.5`}
              >
                {provinces.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="postalCode">
                Postal code
              </label>
              <input id="postalCode" name="postalCode" required className={`${field} mt-1.5`} placeholder="1804" />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="notes">
                Delivery notes (optional)
              </label>
              <textarea id="notes" name="notes" rows={3} className={`${field} mt-1.5`} placeholder="Gate code, best time to deliver…" />
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 ring-1 ring-ink/5">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-flame">3 · Payment</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { id: "eft", title: "EFT / Bank transfer", copy: "100% upfront — banking details sent instantly" },
              {
                id: "laybye",
                title: "Lay-bye (3 months)",
                copy: "3 monthly payments · product released after the last one",
              },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setPayment(option.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  payment === option.id ? "border-ink bg-sand" : "border-ink/15 hover:border-ink/40"
                }`}
              >
                <p className="text-sm font-black">{option.title}</p>
                <p className="text-xs text-ink/50">{option.copy}</p>
              </button>
            ))}
          </div>
          <p className="mt-4 rounded-xl bg-sand/70 px-4 py-3 text-xs font-semibold text-ink/60">
            EFT orders are paid 100% upfront. Lay-bye splits your total into 3 equal
            monthly payments (maximum 3 months) — your order is held and only released for delivery
            once the final installment is paid.
          </p>

          {payment === "eft" ? (
            <>
              <p className="mt-6 rounded-xl bg-blue-50 px-4 py-3 text-xs font-semibold text-ink/70">
                <span className="font-black">Please note:</span> every payment is checked before an
                order is confirmed. Your order is only packed and sent once your payment has been
                verified — we&apos;ll WhatsApp you the moment it&apos;s confirmed.
              </p>

              <p className="mt-5 flex items-baseline justify-between text-sm">
                <span className="font-black">Make an EFT for {formatMoney(total)} to:</span>
              </p>

              <div className="mt-3 space-y-4">
                {bankAccounts.map((account) => (
                  <div key={account.accountNumber} className="overflow-hidden rounded-2xl ring-1 ring-ink/10">
                    <div className="bg-ink px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-cream">
                      {account.bank}
                    </div>
                    <div className="grid gap-3 p-4 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-ink/40">Account name</p>
                        <p className="text-sm font-bold">{account.accountName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-ink/40">Account no.</p>
                        <p className="text-sm font-black text-flame">{account.accountNumber}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 rounded-xl bg-volt/20 px-4 py-3 text-xs font-semibold text-ink/70">
                Please use <span className="font-black">{customerName || "your full name"}</span> as
                your payment reference so we can match your payment.
              </p>

              <div className="mt-6">
                <label className={label}>4 · Upload proof of payment</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <label
                    className={`cursor-pointer rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] transition ${
                      proofUploading ? "cursor-not-allowed bg-ink/20 text-ink/40" : "bg-ink text-cream hover:bg-flame"
                    }`}
                  >
                    {proofUploading ? "Uploading…" : "📷 Take photo"}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      disabled={proofUploading}
                      onChange={(event) => handleProofFile(event.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                  </label>
                  <label
                    className={`cursor-pointer rounded-full border px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] transition ${
                      proofUploading
                        ? "cursor-not-allowed border-ink/10 text-ink/40"
                        : "border-ink/20 text-ink hover:border-flame hover:text-flame"
                    }`}
                  >
                    Upload from gallery
                    <input
                      type="file"
                      accept="image/*"
                      disabled={proofUploading}
                      onChange={(event) => handleProofFile(event.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                  </label>
                </div>

                {proofError ? <p className="mt-2 text-xs font-bold text-flame">{proofError}</p> : null}

                {proofUrl ? (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-ink/10 bg-sand/50 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={proofUrl} alt="Proof of payment" className="h-16 w-16 rounded-lg object-cover" />
                    <p className="text-xs font-bold text-ink/70">Proof of payment attached ✓</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-ink/45">
                    Your order is created right away and confirmed once we&apos;ve checked your payment.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="mt-2 text-xs text-ink/50">
              Your order is recorded and Tshidi will confirm the lay-bye installment details with you
              directly on WhatsApp.
            </p>
          )}
        </section>
      </div>

      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="rounded-3xl bg-ink p-6 text-cream">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-volt">Your order</h2>

          <ul className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1">
            {cart.lines.map((line) => (
              <li key={line.id} className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={line.image} alt="" className="h-16 w-14 rounded-lg object-cover" />
                <div className="min-w-0 flex-1 text-xs">
                  <p className="truncate font-bold">{line.name}</p>
                  <p className="text-cream/50">
                    {line.size} × {line.quantity}
                  </p>
                </div>
                <span className="text-xs font-bold">{formatMoney(line.lineTotalCents)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-cream/15 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-cream/60">Subtotal</dt>
              <dd className="font-bold">{formatMoney(cart.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cream/60">
                Delivery{delivery !== "collect" ? ` · ${province}` : ""}
              </dt>
              <dd className="font-bold">{deliveryCost === 0 ? "FREE" : formatMoney(deliveryCost)}</dd>
            </div>
            <div className="flex justify-between border-t border-cream/15 pt-3 text-xl font-black">
              <dt>Total</dt>
              <dd>{formatMoney(total)}</dd>
            </div>
          </dl>

          <p className="mt-3 text-[11px] leading-relaxed text-cream/45">
            Orders are processed in {site.processingDays} before {site.courierName} collects your
            parcel.
          </p>

          {error ? (
            <p className="mt-4 rounded-xl bg-flame/20 px-4 py-3 text-xs font-bold text-flame">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || proofUploading}
            className="mt-5 w-full rounded-full bg-volt py-4 text-xs font-black uppercase tracking-[0.2em] text-ink transition hover:bg-cream disabled:opacity-60"
          >
            {busy ? "Placing order…" : "Place order"}
          </button>

          <p className="mt-3 text-center text-[11px] text-cream/45">
            Need help? WhatsApp {site.phone}
          </p>
        </div>
      </aside>
    </form>
  );
}
