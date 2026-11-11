"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatKMF, LISTING_TYPES } from "@/lib/constants";
import { timeAgo } from "@/lib/format";

export default function MesAnnoncesPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetch("/api/my-listings").then((r) => r.json()).then((d) => { setListings(d.listings || []); setLoading(false); }).catch(() => setLoading(false));
    fetch("/api/seller-stats").then((r) => r.json()).then((d) => d.ok && setStats(d.stats)).catch(() => {});
  }, []);

  async function feature(id: string) {
    const r = await fetch(`/api/listings/${id}/feature`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ days: 7 }) });
    const d = await r.json();
    setFeedback(d.message || d.error);
  }

  async function remove(id: string) {
    if (!confirm("Retirer cette annonce ?")) return;
    await fetch(`/api/listings/${id}`, { method: "DELETE" });
    setListings((l) => l.map((x) => (x.id === id ? { ...x, status: "disabled" } : x)));
    setFeedback("Annonce retirée.");
  }

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-10 text-center text-neutral-400">Chargement…</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ocean-900 dark:text-white">Mes annonces 📦</h1>
        <Link href="/publier" className="btn-primary">+ Publier</Link>
      </div>

      {feedback && <p className="mb-4 rounded-2xl bg-leaf-50 p-3 text-sm font-semibold text-leaf-700">{feedback}</p>}

      {/* Statistiques vendeur */}
      {stats && (
        <div className="card mb-6 p-5">
          <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">📊 Mes statistiques</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-cream-100 p-3 text-center dark:bg-night-700">
              <p className="text-2xl font-extrabold text-ocean-700 dark:text-ocean-200">{stats.totalListings}</p>
              <p className="text-xs text-neutral-500">Annonces</p>
            </div>
            <div className="rounded-2xl bg-cream-100 p-3 text-center dark:bg-night-700">
              <p className="text-2xl font-extrabold text-leaf-600">{stats.totalSales}</p>
              <p className="text-xs text-neutral-500">Ventes livrées</p>
            </div>
            <div className="rounded-2xl bg-cream-100 p-3 text-center dark:bg-night-700">
              <p className="text-2xl font-extrabold text-sand-600">{stats.mostPopular ? stats.mostPopular.views : 0}</p>
              <p className="text-xs text-neutral-500">Vues (top annonce)</p>
            </div>
            <div className="rounded-2xl bg-cream-100 p-3 text-center dark:bg-night-700">
              <p className="text-2xl font-extrabold text-ocean-700 dark:text-ocean-200">{stats.bestCategory || "—"}</p>
              <p className="text-xs text-neutral-500">Meilleure catégorie</p>
            </div>
          </div>

          {/* Détail par annonce */}
          <div className="mt-4 space-y-2">
            {stats.perListing.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl bg-cream-50 px-3 py-2 text-sm dark:bg-night-800">
                <span className="font-semibold text-ocean-800 dark:text-ocean-100">{s.title}</span>
                <span className="text-xs text-neutral-500">👁️ {s.views} · ❤️ {s.favorites} · 💬 {s.contacts} · 🛒 {s.orders}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste des annonces */}
      {listings.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">
          <p className="text-5xl">📦</p>
          <p className="mt-2">Tu n'as pas encore d'annonce. <Link href="/publier" className="font-bold text-ocean-500">Publie la première !</Link></p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className={`card flex gap-4 p-4 ${l.status !== "active" ? "opacity-60" : ""}`}>
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-cream-100 dark:bg-night-700">
                {l.photos?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.photos[0]} alt="" className="h-full w-full object-cover" />
                ) : <div className="grid h-full w-full place-items-center text-3xl">🛍️</div>}
              </div>
              <div className="flex-1">
                <Link href={`/annonce/${l.slug}`} className="font-bold text-ocean-900 hover:underline dark:text-white">{l.title}</Link>
                <p className="text-sm font-extrabold text-sand-600 dark:text-sand-400">{formatKMF(l.price)}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="badge bg-cream-100 text-neutral-500 dark:bg-night-700">👁️ {l.views} vues</span>
                  <span className="badge bg-cream-100 text-neutral-500 dark:bg-night-700">❤️ {l._count.favorites}</span>
                  <span className="badge bg-cream-100 text-neutral-500 dark:bg-night-700">🛒 {l._count.orders} cmd</span>
                  {l.isFeatured && <span className="badge bg-sand-200 text-sand-800">✨ À la une</span>}
                  {l.status !== "active" && <span className="badge bg-neutral-200 text-neutral-500">Désactivée</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {!l.isFeatured && l.status === "active" && <button onClick={() => feature(l.id)} className="btn-outline py-1.5 text-xs">✨ Mettre en avant</button>}
                <Link href={`/publier?edit=${l.id}`} className="btn-ghost py-1.5 text-xs border border-cream-200">✏️ Modifier</Link>
                <button onClick={() => remove(l.id)} className="btn-ghost py-1.5 text-xs border border-cream-200 text-red-500">🗑️ Retirer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
