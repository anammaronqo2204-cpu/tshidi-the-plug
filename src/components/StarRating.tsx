export function StarRating({
  rating,
  reviews,
  size = "sm",
}: {
  rating: number;
  reviews?: number;
  size?: "sm" | "md";
}) {
  const full = Math.round(rating);
  return (
    <span className="flex items-center gap-1.5">
      <span className={size === "sm" ? "text-[11px]" : "text-sm"} aria-hidden>
        {"★★★★★".slice(0, full)}
        <span className="text-ink/20">{"★★★★★".slice(full)}</span>
      </span>
      <span className={`${size === "sm" ? "text-[11px]" : "text-xs"} text-ink/50`}>
        {rating.toFixed(1)}
        {typeof reviews === "number" ? ` (${reviews})` : ""}
      </span>
    </span>
  );
}
