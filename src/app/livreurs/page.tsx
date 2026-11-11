"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Stars from "@/components/Stars";
import { ISLANDS, REGIONS, DELIVERY_RATES } from "@/lib/constants";

export default function LivreursPage() {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [island, setIsland] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (island) p.set("island", island);
    if (region) p.set("region", region);
    fetch(`/api/couriers?${p.toString()}`)
      .then((r) => r.json())
      .then((d) => { setCouriers(d.couriers || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [island, region]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ocean-900 dark:text-white">Livreurs à moto 🏍️</h1>
        <Link href="/inscription-livreur" className="btn-primary">Devenir livreur</Link>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex gap-2">
        <select className="input" value={island} onChange={(e) => { setIsland(e.target.value); setRegion(""); }}>
          <option value="">Toutes les îles</option>
          {ISLANDS.map((i) => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>
        <select className="input" value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">Toutes les régions</option>
          {(island ? REGIONS[island] || [] : Object.values(REGIONS).flat()).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-center text-neutral-400">Chargement…</p>
      ) : couriers.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">
          <p className="text-5xl">🏍️</p>
          <p className="mt-2">Aucun livreur trouvé dans cette zone pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {couriers.map((c) => (
            <div key={c.id} className="card flex items-center gap-4 p-5">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-leaf-100 text-2xl dark:bg-night-700">
                {c.profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.profilePhoto} alt={c.name} className="h-full w-full rounded-full object-cover" />
                ) : "🏍️"}
              </span>
              <div className="flex-1">
                <p className="font-bold text-ocean-900 dark:text-white">{c.name}</p>
                <div className="flex items-center gap-2">
                  <Stars rating={c.rating} size="text-sm" />
                  <span className="text-xs text-neutral-400">{c.rating.toFixed(1)} ({c.reviewsCount} avis)</span>
                </div>
                <p className="text-xs text-neutral-500">📍 {c.region} · {c.deliveriesCount} livraisons</p>
              </div>
              <span className="badge bg-leaf-100 text-leaf-700">Disponible</span>
            </div>
          ))}
        </div>
      )}

      {/* Tarifs indicatifs */}
      <div className="card mt-8 p-5">
        <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">💰 Tarifs indicatifs de livraison</h2>
        <div className="space-y-2">
          {DELIVERY_RATES.map((r) => (
            <div key={r.label} className="flex items-center justify-between rounded-xl bg-cream-50 px-3 py-2 text-sm dark:bg-night-800">
              <span className="font-semibold text-ocean-800 dark:text-ocean-100">{r.label}</span>
              <span className="font-bold text-sand-600">{r.min}–{r.max} KMF</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
