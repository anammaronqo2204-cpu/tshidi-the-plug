import Link from "next/link";
import {
  activateDailyDeal,
  createCombo,
  createPool,
  deleteCombo,
  deletePool,
  endDailyDeal,
  toggleCombo,
  togglePool,
  updateAutoDealSettings,
} from "@/lib/admin-actions";
import {
  getAllCombosAdmin,
  getAllPoolsAdmin,
  getAutoDealAdmin,
  getDailyDealAdmin,
  getProductsForDealSelect,
  getProductsForPoolSelect,
} from "@/lib/admin-data";
import { getCategories } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import { poolRuleText } from "@/lib/pools";
import { PoolProductPicker } from "./PoolProductPicker";

export const dynamic = "force-dynamic";
export const metadata = { title: "Discounts & Combos · Admin" };

const input =
  "w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-flame";
const label = "text-[10px] font-black uppercase tracking-[0.2em] text-ink/45";

export default async function AdminDealsPage() {
  const [activeDeal, dealProducts, combos, poolProducts, poolCategories, pools, autoDeal] = await Promise.all([
    getDailyDealAdmin(),
    getProductsForDealSelect(),
    getAllCombosAdmin(),
    getProductsForPoolSelect(),
    getCategories(),
    getAllPoolsAdmin(),
    getAutoDealAdmin(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-flame">
            Promotions
          </p>
          <h1 className="display-tight mt-2 text-4xl font-black sm:text-6xl">
            Discounts &amp; Combos
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-ink/55">
            Run a one-day discount — on one product or the whole store — or set up a
            permanent &quot;buy both, save&quot; combo between two products.
          </p>
        </div>
        <Link
          prefetch={false}
          href="/admin"
          className="rounded-full border border-ink/15 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.2em]"
        >
          Back to dashboard
        </Link>
      </div>

      {/* ---------------- DISCOUNT OF THE DAY ---------------- */}
      <section className="glass-neutral mt-8 rounded-3xl p-6">
        <h2 className="text-xl font-black">Discount of the day</h2>
        <p className="mt-1 text-sm text-ink/55">
          Auto-expires at midnight (Africa/Johannesburg) — no need to remember to turn it off.
        </p>

        {activeDeal ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-ink p-5 text-cream">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-volt">
                Live now — −{activeDeal.percentOff}%
              </p>
              <p className="mt-1 text-lg font-black">
                {activeDeal.scope === "store"
                  ? "Everything in store"
                  : activeDeal.product?.name ?? "Selected product"}
              </p>
              <p className="mt-1 text-xs text-cream/60">
                Ends {activeDeal.endsAt.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}
              </p>
            </div>
            <form action={endDailyDeal}>
              <input type="hidden" name="id" value={activeDeal.id} />
              <button className="rounded-full border border-cream/25 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] hover:border-flame hover:text-flame">
                End deal now
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-white p-5 text-sm font-semibold text-ink/55 ring-1 ring-ink/5">
            No discount is running right now.
          </div>
        )}

        <form action={activateDailyDeal} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Applies to</label>
            <div className="mt-2 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm font-bold">
                <input type="radio" name="scope" value="store" defaultChecked className="accent-[#8a5a44]" />
                Whole store — everything currently in stock
              </label>
              <label className="flex items-center gap-2 text-sm font-bold">
                <input type="radio" name="scope" value="product" className="accent-[#8a5a44]" />
                One product only
              </label>
            </div>
          </div>
          <div>
            <label className={label}>Product (only used for &quot;One product only&quot;)</label>
            <select name="productId" className={`${input} mt-1`}>
              <option value="">Select a product…</option>
              {dealProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} — {p.name} ({formatMoney(p.priceCents)}, {p.stock} in stock)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Percent off</label>
            <input
              name="percentOff"
              type="number"
              min="5"
              max="90"
              defaultValue={20}
              className={`${input} mt-1`}
            />
          </div>
          <div className="sm:col-span-2">
            <button className="rounded-full bg-ink px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-cream hover:bg-flame">
              Go live for today
            </button>
          </div>
        </form>
      </section>

      {/* ---------------- AUTO SPECIAL OF THE DAY ---------------- */}
      <section className="glass-neutral mt-8 rounded-3xl p-6">
        <h2 className="text-xl font-black">Special of the day — auto rotation</h2>
        <p className="mt-1 text-sm text-ink/55">
          Runs on its own: every day, once the deal above isn&apos;t live, it automatically
          picks one product — skipping anything already in a pool or combo deal — and
          discounts it until midnight. It cycles through every eligible product once
          before repeating.
        </p>

        <div className="mt-5 rounded-2xl bg-white p-5 text-sm font-semibold text-ink/70 ring-1 ring-ink/5">
          {autoDeal.eligibleCount === 0 ? (
            <p>No eligible products right now — everything in stock is already in a pool or combo deal.</p>
          ) : (
            <p>
              {autoDeal.usedCount} of {autoDeal.eligibleCount} eligible products have had a turn this cycle.
              {autoDeal.usedCount >= autoDeal.eligibleCount ? " Starting over next pick." : ""}
            </p>
          )}
        </div>

        <form action={updateAutoDealSettings} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={autoDeal.enabled}
                className="accent-[#8a5a44]"
              />
              Auto-pick a special of the day
            </label>
          </div>
          <div>
            <label className={label}>Percent off</label>
            <input
              name="percentOff"
              type="number"
              min="5"
              max="90"
              defaultValue={autoDeal.percentOff}
              className={`${input} mt-1`}
            />
          </div>
          <div className="flex items-end sm:col-span-2">
            <button className="rounded-full bg-ink px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-cream hover:bg-flame">
              Save
            </button>
          </div>
        </form>
      </section>

      {/* ---------------- COMBO DEALS ---------------- */}
      <section className="glass-neutral mt-8 rounded-3xl p-6">
        <h2 className="text-xl font-black">Combo deals — buy both, save</h2>
        <p className="mt-1 text-sm text-ink/55">
          Pick two products. When a customer has both in their cart, the discount applies
          automatically to each — no code needed. It&apos;s limited to stock naturally: once
          either item sells out, it disappears from the shop and the combo can&apos;t trigger.
        </p>

        <form action={createCombo} className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <label className={label}>Product A</label>
            <select name="productAId" required className={`${input} mt-1`}>
              <option value="">Select a product…</option>
              {dealProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} — {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Product B</label>
            <select name="productBId" required className={`${input} mt-1`}>
              <option value="">Select a product…</option>
              {dealProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} — {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Percent off (each item)</label>
            <input
              name="percentOff"
              type="number"
              min="5"
              max="90"
              defaultValue={15}
              className={`${input} mt-1`}
            />
          </div>
          <div className="sm:col-span-3">
            <button className="rounded-full bg-ink px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-cream hover:bg-flame">
              Create combo
            </button>
          </div>
        </form>

        <div className="mt-8 space-y-3">
          {combos.length === 0 ? (
            <p className="text-sm font-semibold text-ink/50">No combos set up yet.</p>
          ) : (
            combos.map((combo) => {
              const outOfStock =
                (combo.productA?.stock ?? 0) <= 0 || (combo.productB?.stock ?? 0) <= 0;
              return (
                <div
                  key={combo.id}
                  className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-ink/5"
                >
                  <div className="flex -space-x-3">
                    {[combo.productA, combo.productB].map((p, i) =>
                      p ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={p.images[0]}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
                        />
                      ) : null,
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-black">
                      {combo.productA?.name ?? "Deleted product"} + {combo.productB?.name ?? "Deleted product"}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-ink/40">
                      −{combo.percentOff}% each · {combo.active ? "Active" : "Paused"}
                      {outOfStock ? " · one item is out of stock" : ""}
                    </p>
                  </div>
                  <form action={toggleCombo}>
                    <input type="hidden" name="id" value={combo.id} />
                    <input type="hidden" name="active" value={combo.active ? "false" : "true"} />
                    <button
                      className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest ${
                        combo.active ? "bg-sand text-ink" : "bg-ink text-cream"
                      }`}
                    >
                      {combo.active ? "Pause" : "Resume"}
                    </button>
                  </form>
                  <form action={deleteCombo}>
                    <input type="hidden" name="id" value={combo.id} />
                    <button className="rounded-full border border-flame/30 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-flame hover:bg-flame hover:text-white">
                      Delete
                    </button>
                  </form>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ---------------- POOL DEALS ---------------- */}
      <section className="glass-neutral mt-8 rounded-3xl p-6">
        <h2 className="text-xl font-black">Pool deals — bulk-select, any N from the pool</h2>
        <p className="mt-1 text-sm text-ink/55">
          Bulk-select a batch of products (a whole category, a brand, or a hand-picked mix) and
          set one rule for the pool: pick any N of them together and get a fixed total price or a
          percent off each. It doesn&apos;t matter which items the customer picks from the pool —
          the cart works the deal out automatically. Buying more than N just applies the deal
          again for every extra full group.
        </p>

        <form action={createPool} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className={label}>Pool name</label>
              <input
                name="name"
                required
                placeholder="e.g. T-Shirts, or Sneakers — Batch 1"
                className={`${input} mt-1`}
              />
            </div>
            <div>
              <label className={label}>Pick any</label>
              <input
                name="pickCount"
                type="number"
                min="1"
                max="10"
                defaultValue={2}
                className={`${input} mt-1`}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className={label}>Discount type</label>
              <div className="mt-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input
                    type="radio"
                    name="discountType"
                    value="percent"
                    defaultChecked
                    className="accent-[#8a5a44]"
                  />
                  Percent off each item
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="radio" name="discountType" value="fixed" className="accent-[#8a5a44]" />
                  Fixed total price for the group
                </label>
              </div>
            </div>
            <div>
              <label className={label}>Percent off (used if &quot;Percent off&quot;)</label>
              <input
                name="percentOff"
                type="number"
                min="1"
                max="90"
                defaultValue={10}
                className={`${input} mt-1`}
              />
            </div>
            <div>
              <label className={label}>Fixed price in R (used if &quot;Fixed total&quot;)</label>
              <input name="fixedPrice" type="text" placeholder="e.g. 1000" className={`${input} mt-1`} />
            </div>
          </div>

          <div>
            <label className={label}>Products in this pool — bulk-select by category or brand</label>
            <div className="mt-2">
              <PoolProductPicker
                products={poolProducts}
                categories={poolCategories.map((c) => ({ slug: c.slug, name: c.name }))}
              />
            </div>
          </div>

          <button className="rounded-full bg-ink px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-cream hover:bg-flame">
            Create pool deal
          </button>
        </form>

        <div className="mt-8 space-y-3">
          {pools.length === 0 ? (
            <p className="text-sm font-semibold text-ink/50">No pool deals set up yet.</p>
          ) : (
            pools.map((pool) => (
              <div
                key={pool.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-ink/5"
              >
                <div className="flex -space-x-3">
                  {pool.products.slice(0, 4).map((p, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={p.images[0]}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
                    />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-black">{pool.name}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink/40">
                    {poolRuleText(pool, formatMoney)} · {pool.productCount} products
                    {pool.inStockCount < pool.productCount
                      ? ` (${pool.inStockCount} in stock)`
                      : ""}{" "}
                    · {pool.active ? "Active" : "Paused"}
                  </p>
                </div>
                <form action={togglePool}>
                  <input type="hidden" name="id" value={pool.id} />
                  <input type="hidden" name="active" value={pool.active ? "false" : "true"} />
                  <button
                    className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest ${
                      pool.active ? "bg-sand text-ink" : "bg-ink text-cream"
                    }`}
                  >
                    {pool.active ? "Pause" : "Resume"}
                  </button>
                </form>
                <form action={deletePool}>
                  <input type="hidden" name="id" value={pool.id} />
                  <button className="rounded-full border border-flame/30 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-flame hover:bg-flame hover:text-white">
                    Delete
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
