import { CartView } from "@/components/CartView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your bag" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="display-tight text-4xl font-black sm:text-6xl">Your bag</h1>
      <p className="mt-2 text-sm text-ink/55">
        Review your items, then check out — orders are processed in 2–3 working days before delivery.
      </p>
      <div className="mt-10">
        <CartView />
      </div>
    </div>
  );
}
