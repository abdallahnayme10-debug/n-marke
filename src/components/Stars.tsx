export default function Stars({ rating, size = "text-base" }: { rating: number; size?: string }) {
  const rounded = Math.round(rating);
  return (
    <span className={`${size} leading-none`} aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rounded ? "text-sand-400" : "text-neutral-300 dark:text-night-700"}>
          ★
        </span>
      ))}
    </span>
  );
}
