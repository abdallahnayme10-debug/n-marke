export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-cream-200 dark:bg-night-700" />
        ))}
      </div>
    </div>
  );
}
