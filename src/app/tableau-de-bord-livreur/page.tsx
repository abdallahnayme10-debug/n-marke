"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DELIVERY_STATUSES } from "@/lib/constants";
import { timeAgo } from "@/lib/format";

export default function TableauLivreurPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const r = await fetch("/api/delivery?role=courier");
    const d = await r.json();
    if (d.ok) setDeliveries(d.deliveries);
    setLoading(false);
  }

  async function update(id: string, status: string) {
    const r = await fetch(`/api/delivery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const d = await r.json();
    setFeedback(d.message || d.error);
    load();
  }

  const pending = deliveries.filter((d) => d.status === "en_attente");
  const active = deliveries.filter((d) => !["en_attente", "livre", "annulee"].includes(d.status));
  const done = deliveries.filter((d) => ["livre", "annulee"].includes(d.status));
  const totalDone = deliveries.filter((d) => d.status === "livre").length;
  const earnings = deliveries.filter((d) => d.status === "livre").reduce((s, d) => s + (d.price || 0), 0);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-10 text-center text-neutral-400">Chargement…</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-extrabold text-ocean-900 dark:text-white">Tableau de bord livreur 🏍️</h1>
      <p className="mb-6 text-sm text-neutral-500">{feedback}</p>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-ocean-700 dark:text-ocean-200">{totalDone}</p>
          <p className="text-xs text-neutral-500">Livraisons faites</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-leaf-600">{earnings.toLocaleString("fr-FR")}</p>
          <p className="text-xs text-neutral-500">Revenus (KMF)</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-sand-600">{pending.length}</p>
          <p className="text-xs text-neutral-500">En attente</p>
        </div>
      </div>

      {/* En attente */}
      <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">⏳ Demandes en attente</h2>
      {pending.length === 0 ? (
        <p className="mb-6 text-sm text-neutral-400">Aucune demande pour le moment.</p>
      ) : (
        <div className="mb-6 space-y-3">
          {pending.map((d) => (
            <div key={d.id} className="card p-4">
              <p className="font-bold text-ocean-900 dark:text-white">📦 {d.order?.listing?.title || "Livraison"}</p>
              <p className="text-sm text-neutral-500">De : {d.pickupAddress || "—"} → À : {d.dropoffAddress || "—"}</p>
              {d.price && <p className="text-sm font-bold text-sand-600">{d.price} KMF</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => update(d.id, "en_route_vendeur")} className="btn-secondary py-2 text-xs">✅ Accepter</button>
                <button onClick={() => update(d.id, "annulee")} className="btn-ghost py-2 text-xs border border-cream-200">Refuser</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* En cours */}
      <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">🛵 En cours</h2>
      {active.length === 0 ? (
        <p className="mb-6 text-sm text-neutral-400">Aucune livraison en cours.</p>
      ) : (
        <div className="mb-6 space-y-3">
          {active.map((d) => (
            <div key={d.id} className="card p-4">
              <p className="font-bold text-ocean-900 dark:text-white">📦 {d.order?.listing?.title || "Livraison"}</p>
              <span className="badge mt-1 bg-ocean-100 text-ocean-700 dark:bg-night-700 dark:text-ocean-200">
                {DELIVERY_STATUSES[d.status]?.emoji} {DELIVERY_STATUSES[d.status]?.label}
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {d.status === "en_route_vendeur" && <button onClick={() => update(d.id, "recupere")} className="btn-outline py-2 text-xs">📦 Colis récupéré</button>}
                {d.status === "recupere" && <button onClick={() => update(d.id, "en_cours")} className="btn-outline py-2 text-xs">🛵 En livraison</button>}
                {d.status === "en_cours" && <button onClick={() => update(d.id, "livre")} className="btn-secondary py-2 text-xs">🎉 Livré</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Historique */}
      <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">📚 Historique</h2>
      {done.length === 0 ? (
        <p className="text-sm text-neutral-400">Aucune livraison terminée.</p>
      ) : (
        <div className="space-y-2">
          {done.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl bg-cream-50 px-3 py-2 text-sm dark:bg-night-800">
              <span className="font-semibold text-ocean-800 dark:text-ocean-100">📦 {d.order?.listing?.title || "Livraison"}</span>
              <span className="text-xs text-neutral-500">{DELIVERY_STATUSES[d.status]?.label} · {timeAgo(d.updatedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
