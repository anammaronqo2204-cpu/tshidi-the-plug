import { CheckoutView } from "@/components/CheckoutView";
import { BackButton } from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <BackButton className="mb-3" />
      <h1 className="display-tight text-4xl font-black sm:text-6xl">Checkout</h1>
      <p className="mt-2 text-sm text-ink/55">
        Three quick steps and your parcel is on its way.
      </p>
      <div className="mt-10">
        <CheckoutView />
      </div>
    </div>
  );
}
