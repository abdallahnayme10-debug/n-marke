"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import SearchBar from "./SearchBar";
import ListingGrid from "./ListingGrid";
import { toCardData } from "@/lib/serialize";
import { ISLANDS, REGIONS, CATEGORIES } from "@/lib/constants";

type FilterState = {
  q: string;
  island: string;
  region: string;
  category: string;
  type: string;
  minPrice: string;
  maxPrice: string;
  delivery: boolean;
  brand: string;
  sort: string;
};

export default function SearchClient() {
  const router = useRouter();
  const params = useSearchParams();
  const vision = params.get("vision") === "1";

  const [filters, setFilters] = useState<FilterState>({
    q: params.get("q") || "",
    island: params.get("island") || "",
    region: params.get("region") || "",
    category: params.get("category") || "",
    type: params.get("type") || "",
    minPrice: params.get("minPrice") || "",
    maxPrice: params.get("maxPrice") || "",
    delivery: params.get("delivery") === "1",
    brand: params.get("brand") || "",
    sort: params.get("sort") || "recent",
  });
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [visionData, setVisionData] = useState<any>(null);

  useEffect(() => {
    if (vision) {
      const raw = sessionStorage.getItem("nmarke-vision");
      if (raw) {
        const d = JSON.parse(raw);
        setVisionData(d);
        setItems(d.items || []);
        setTotal(d.items?.length || 0);
        sessionStorage.removeItem("nmarke-vision");
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vision]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.q) p.set("q", filters.q);
    if (filters.island) p.set("island", filters.island);
    if (filters.region) p.set("region", filters.region);
    if (filters.category) p.set("category", filters.category);
    if (filters.type) p.set("type", filters.type);
    if (filters.minPrice) p.set("minPrice", filters.minPrice);
    if (filters.maxPrice) p.set("maxPrice", filters.maxPrice);
    if (filters.delivery) p.set("delivery", "1");
    if (filters.brand) p.set("brand", filters.brand);
    p.set("sort", filters.sort);
    p.set("limit", "48");
    return p.toString();
  }, [filters]);

  useEffect(() => {
    if (vision) return;
    setLoading(true);
    fetch(`/api/listings?${query}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setTotal(d.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, vision]);

  function set(name: keyof FilterState, value: string | boolean) {
    setFilters((f) => ({ ...f, [name]: value }));
  }

  function applyFilters() {
    const p = new URLSearchParams(query);
    router.push(`/recherche?${p.toString()}`, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <SearchBar />

      {visionData && (
        <div className="card mt-6 p-4">
          <p className="font-semibold text-ocean-800 dark:text-ocean-100">🔍 Résultats de ta recherche par photo</p>
          <p className="text-sm text-neutral-500">{visionData.message}</p>
          {visionData.analysis?.category && (
            <span className="badge mt-2 bg-leaf-100 text-leaf-700">{visionData.analysis.category}</span>
          )}
        </div>
      )}

      {/* Filtres */}
      <div className="card mt-6 space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="label">Île</label>
            <select className="input" value={filters.island} onChange={(e) => set("island", e.target.value)}>
              <option value="">Toutes</option>
              {ISLANDS.map((i) => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Région</label>
            <select className="input" value={filters.region} onChange={(e) => set("region", e.target.value)}>
              <option value="">Toutes</option>
              {(filters.island ? REGIONS[filters.island] || [] : Object.values(REGIONS).flat()).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Catégorie</label>
            <select className="input" value={filters.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">Toutes</option>
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Type d'annonce</label>
            <select className="input" value={filters.type} onChange={(e) => set("type", e.target.value)}>
              <option value="">Tous</option>
              <option value="disponible">Disponible maintenant</option>
              <option value="commande">Sur commande</option>
              <option value="occasion">Occasion / Reconditionné</option>
              <option value="particulier">Entre particuliers</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div>
            <label className="label">Prix min (KMF)</label>
            <input type="number" className="input" placeholder="0" value={filters.minPrice} onChange={(e) => set("minPrice", e.target.value)} />
          </div>
          <div>
            <label className="label">Prix max (KMF)</label>
            <input type="number" className="input" placeholder="500000" value={filters.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} />
          </div>
          <div>
            <label className="label">Marque</label>
            <input type="text" className="input" placeholder="Samsung…" value={filters.brand} onChange={(e) => set("brand", e.target.value)} />
          </div>
          <div>
            <label className="label">Trier par</label>
            <select className="input" value={filters.sort} onChange={(e) => set("sort", e.target.value)}>
              <option value="recent">Plus récent</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="popular">Plus vus</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-2 rounded-2xl border-2 border-cream-200 px-3 py-3 text-sm font-semibold text-ocean-800 dark:border-night-700 dark:text-ocean-100">
              <input type="checkbox" className="h-5 w-5 accent-leaf-500" checked={filters.delivery} onChange={(e) => set("delivery", e.target.checked)} />
              🏍️ Livraison moto
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-neutral-500">{loading ? "Recherche…" : `${total} annonce${total > 1 ? "s" : ""} trouvée${total > 1 ? "s" : ""}`}</p>
          <button onClick={applyFilters} className="btn-primary">Appliquer les filtres</button>
        </div>
      </div>

      {/* Résultats */}
      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-cream-200 dark:bg-night-700" />
            ))}
          </div>
        ) : (
          <ListingGrid items={items.map(toCardData)} emptyText="Aucune annonce ne correspond à ta recherche. Essaie d'autres mots-clés !" />
        )}
      </div>
    </div>
  );
}
