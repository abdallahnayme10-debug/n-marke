"use client";

import Link from "next/link";
import { useState } from "react";
import { LISTING_TYPES, SELLER_TIERS, formatKMF } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { useTheme } from "@/app/providers";

export type ListingCardData = {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  type: string;
  island: string;
  region: string;
  deliveryAvailable: boolean;
  views: number;
  photos?: string[];
  createdAt: string | Date;
  seller?: { name: string; sellerTier: string } | null;
  isFavorite?: boolean;
};

const ISLAND_LABELS: Record<string, string> = {
  "grande-comore": "Grande Comore",
  anjouan: "Anjouan",
  moheli: "Mohéli",
};

export default function ProductCard({ listing, onToggleFavorite }: { listing: ListingCardData; onToggleFavorite?: (id: string) => void }) {
  const { dataSaver } = useTheme();
  const [showPhoto, setShowPhoto] = useState(!dataSaver);
  const [fav, setFav] = useState(listing.isFavorite || false);

  const typeMeta = LISTING_TYPES[listing.type as keyof typeof LISTING_TYPES] || LISTING_TYPES.disponible;
  const tierMeta = SELLER_TIERS[(listing.seller?.sellerTier as keyof typeof SELLER_TIERS) || "occasionnel"];
  const photo = listing.photos?.[0];

  async function toggleFav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !fav;
    setFav(next);
    if (onToggleFavorite) onToggleFavorite(listing.id);
    try {
      await fetch(`/api/listings/${listing.id}/favorite`, { method: "POST" });
    } catch {}
  }

  return (
    <Link
      href={`/annonce/${listing.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg dark:bg-night-800"
    >
      {/* Photo */}
      <div className="relative aspect-square overflow-hidden bg-cream-100 dark:bg-night-700">
        {showPhoto && photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={listing.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center text-5xl opacity-50">🛍️</div>
        )}
        {dataSaver && !showPhoto && (
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowPhoto(true);
            }}
            className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold text-ocean-700 shadow"
          >
            Voir la photo
          </button>
        )}

        {/* Badge type */}
        <span className={`absolute left-2 top-2 badge ${typeMeta.badge}`}>{typeMeta.label}</span>

        {/* Cœur favori */}
        <button
          onClick={toggleFav}
          aria-label="Ajouter aux favoris"
          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-lg shadow transition-transform hover:scale-110"
        >
          {fav ? "❤️" : "🤍"}
        </button>

        {listing.deliveryAvailable && (
          <span className="absolute bottom-2 left-2 badge bg-leaf-500/90 text-white">🏍️ Livraison</span>
        )}
      </div>

      {/* Infos */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-bold text-ocean-900 dark:text-white">{listing.title}</h3>
        <p className="mt-1 text-base font-extrabold text-sand-600 dark:text-sand-400">{formatKMF(listing.price)}</p>
        <div className="mt-2 flex flex-1 items-end justify-between gap-2">
          <div className="min-w-0">
            {listing.seller && (
              <span className={`badge ${tierMeta.badge}`}>{tierMeta.label}</span>
            )}
            <p className="mt-1 truncate text-xs text-neutral-500">
              📍 {ISLAND_LABELS[listing.island] || listing.island} · {listing.region}
            </p>
          </div>
          <span className="shrink-0 text-xs text-neutral-400">{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
