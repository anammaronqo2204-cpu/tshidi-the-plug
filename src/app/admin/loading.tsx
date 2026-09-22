// Shown instantly while any admin page is fetching its data, so tapping a tab
// gives immediate feedback instead of the old page just sitting there.
export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="h-3 w-32 animate-pulse rounded-full bg-ink/10" />
      <div className="mt-4 h-10 w-64 max-w-full animate-pulse rounded-xl bg-ink/10" />
      <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded-full bg-ink/5" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-ink/5" />
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-ink/5" />
        ))}
      </div>
    </div>
  );
}
