"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatKMF } from "@/lib/constants";

export default function FavorisPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setFavorites(d.favorites);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-10 text-center text-neutral-400">Chargement…</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-ocean-900 dark:text-white">Mes favoris ❤️</h1>
      {favorites.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-5xl">🤍</p>
          <p className="mt-3 font-semibold text-neutral-500">Tu n'as pas encore de favoris. Clique sur le cœur d'une annonce pour la sauvegarder !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((f) => (
            <Link key={f.id} href={`/annonce/${f.listing.slug}`} className={`card flex gap-4 p-4 ${!f.listing.available ? "opacity-60" : ""}`}>
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-cream-100 dark:bg-night-700">
                {f.listing.photos?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.listing.photos[0]} alt="" className="h-full w-full object-cover" />
                ) : <div className="grid h-full w-full place-items-center text-3xl">🛍️</div>}
              </div>
              <div className="flex-1">
                <p className="font-bold text-ocean-900 dark:text-white">{f.listing.title}</p>
                <p className="text-sm font-extrabold text-sand-600 dark:text-sand-400">{formatKMF(f.listing.price)}</p>
                <p className="text-xs text-neutral-500">📍 {f.listing.region}</p>
                {!f.listing.available && <span className="badge mt-1 bg-neutral-100 text-neutral-500">Plus disponible</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
