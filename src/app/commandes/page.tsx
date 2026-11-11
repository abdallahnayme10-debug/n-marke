"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ORDER_STATUSES, formatKMF } from "@/lib/constants";
import { timeAgo } from "@/lib/format";

export default function CommandesPage() {
  const [tab, setTab] = useState<"buyer" | "seller">("buyer");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orders?role=${tab}`)
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tab]);

  async function updateStatus(id: string, status: string) {
    const r = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const d = await r.json();
    setFeedback(d.message || d.error);
    setOrders((o) => o.map((x) => (x.id === id ? { ...x, status } : x)));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-extrabold text-ocean-900 dark:text-white">Mes commandes 🛒</h1>

      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab("buyer")} className={`rounded-2xl px-4 py-2 text-sm font-bold ${tab === "buyer" ? "bg-ocean-500 text-white" : "bg-cream-100 text-ocean-700 dark:bg-night-700 dark:text-ocean-200"}`}>Mes achats</button>
        <button onClick={() => setTab("seller")} className={`rounded-2xl px-4 py-2 text-sm font-bold ${tab === "seller" ? "bg-ocean-500 text-white" : "bg-cream-100 text-ocean-700 dark:bg-night-700 dark:text-ocean-200"}`}>Mes ventes</button>
      </div>

      {feedback && <p className="mb-4 rounded-2xl bg-leaf-50 p-3 text-sm font-semibold text-leaf-700">{feedback}</p>}

      {loading ? (
        <p className="text-center text-neutral-400">Chargement…</p>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">
          <p className="text-5xl">🛒</p>
          <p className="mt-2">{tab === "buyer" ? "Tu n'as pas encore de commande." : "Tu n'as pas encore de vente."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-cream-100 dark:bg-night-700">
                  {o.listing.photos?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.listing.photos[0]} alt="" className="h-full w-full object-cover" />
                  ) : <div className="grid h-full w-full place-items-center">🛍️</div>}
                </div>
                <div className="flex-1">
                  <Link href={`/annonce/${o.listing.slug}`} className="font-bold text-ocean-900 hover:underline dark:text-white">{o.listing.title}</Link>
                  <p className="text-sm text-neutral-500">Qté : {o.quantity} · {formatKMF(o.total)}</p>
                  <p className="text-xs text-neutral-400">
                    {tab === "buyer" ? `Vendeur : ${o.seller.name}` : `Acheteur : ${o.buyer.name}`} · {timeAgo(o.createdAt)}
                  </p>
                  <span className="badge mt-1 bg-ocean-100 text-ocean-700 dark:bg-night-700 dark:text-ocean-200">
                    {ORDER_STATUSES[o.status]?.emoji} {ORDER_STATUSES[o.status]?.label}
                  </span>
                </div>
              </div>

              {/* Actions selon le rôle */}
              <div className="mt-3 flex flex-wrap gap-2 border-t border-cream-100 pt-3 dark:border-night-700">
                {tab === "seller" && o.status === "recue" && (
                  <>
                    <button onClick={() => updateStatus(o.id, "confirmee")} className="btn-secondary py-2 text-xs">✅ Confirmer</button>
                    <button onClick={() => updateStatus(o.id, "annulee")} className="btn-ghost py-2 text-xs border border-cream-200">Refuser</button>
                  </>
                )}
                {tab === "seller" && o.status === "confirmee" && (
                  <button onClick={() => updateStatus(o.id, "preparation")} className="btn-outline py-2 text-xs">📦 En préparation</button>
                )}
                {tab === "seller" && o.status === "preparation" && (
                  <button onClick={() => updateStatus(o.id, "livraison")} className="btn-outline py-2 text-xs">🏍️ En livraison</button>
                )}
                {tab === "seller" && o.status === "livraison" && (
                  <button onClick={() => updateStatus(o.id, "livree")} className="btn-secondary py-2 text-xs">🎉 Marquer livrée</button>
                )}
                {tab === "buyer" && ["recue", "confirmee"].includes(o.status) && (
                  <button onClick={() => updateStatus(o.id, "annulee")} className="btn-ghost py-2 text-xs border border-cream-200">Annuler</button>
                )}
                <Link href={`/messages?to=${tab === "buyer" ? o.seller.id : o.buyer.id}`} className="btn-outline py-2 text-xs">💬 Message</Link>
                {o.deliveryRequested && <Link href="/livreurs" className="btn-outline py-2 text-xs">🏍️ Voir livraison</Link>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
