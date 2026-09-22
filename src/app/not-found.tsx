import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-flame">404</p>
      <h1 className="display-tight mt-3 text-5xl font-black sm:text-7xl">
        This one&apos;s sold out.
      </h1>
      <p className="mt-4 max-w-md text-sm text-ink/60">
        The page you were looking for isn&apos;t here anymore — but there&apos;s plenty of heat left
        in the store.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-ink px-7 py-4 text-xs font-black uppercase tracking-[0.2em] text-cream"
        >
          Back home
        </Link>
        <Link
          href="/shop"
          className="rounded-full border border-ink/20 px-7 py-4 text-xs font-black uppercase tracking-[0.2em]"
        >
          Shop everything
        </Link>
      </div>
    </div>
  );
}
