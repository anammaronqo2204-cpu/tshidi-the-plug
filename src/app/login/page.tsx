import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { PlugIcon } from "@/components/PlugMark";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin login" };

export default async function LoginPage() {
  if (await isAdminAuthed()) redirect("/admin");

  return (
    <div className="luxury-ambient flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="glass-neutral relative w-full max-w-md rounded-3xl p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-volt">
            <PlugIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-flame">
              Tshidi the Plug
            </p>
            <h1 className="text-2xl font-bold">Admin access</h1>
          </div>
        </div>

        <p className="mt-4 text-sm text-ink/60">
          This area is private. Sign in with your admin account to manage orders, inventory
          and testimonials.
        </p>

        <LoginForm />

        <Link
          href="/"
          className="mt-4 block text-center text-[11px] font-semibold uppercase tracking-widest text-ink/45 hover:text-ink"
        >
          ← Back to shop
        </Link>
      </div>
    </div>
  );
}
