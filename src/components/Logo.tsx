import Link from "next/link";

export default function Logo({ size = 40, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="N-marke — accueil">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon.svg"
        alt="Logo N-marke"
        width={size}
        height={size}
        className="rounded-2xl shadow-soft"
      />
      {showText && (
        <span className="hidden font-display text-xl font-extrabold tracking-tight sm:block">
          <span className="text-ocean-900 dark:text-white">N-</span>
          <span className="text-sand-500">marke</span>
        </span>
      )}
    </Link>
  );
}
