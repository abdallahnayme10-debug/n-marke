"use client";

import { useEffect, useState } from "react";
import { AD_PLANS, formatKMF } from "@/lib/constants";
import { timeAgo } from "@/lib/format";

export default function PublicitePage() {
  const [planId, setPlanId] = useState<string>(AD_PLANS[0].id);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState("");
  const [method, setMethod] = useState("mvola");
  const [myListings, setMyListings] = useState<any[]>([]);
  const [myAds, setMyAds] = useState<any[]>([]);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/my-listings").then((r) => r.json()).then((d) => d.ok && setMyListings(d.listings)).catch(() => {});
    fetch("/api/ads?mine=1").then((r) => r.json()).then((d) => d.ok && setMyAds(d.ads)).catch(() => {});
  }, []);

  const plan = AD_PLANS.find((p) => p.id === planId)!;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFeedback("");
    const r = await fetch("/api/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, title, link, image: image || null, method }),
    });
    const d = await r.json();
    setBusy(false);
    setFeedback(d.message || d.error);
    if (d.ok) {
      setTitle(""); setLink(""); setImage("");
      fetch("/api/ads?mine=1").then((r) => r.json()).then((x) => x.ok && setMyAds(x.ads)).catch(() => {});
    }
  }

  const STATUS = {
    en_attente: { label: "⏳ En attente de paiement", cls: "bg-sand-100 text-sand-800" },
    active: { label: "✅ Active", cls: "bg-leaf-100 text-leaf-700" },
    expiree: { label: "⌛ Expirée", cls: "bg-neutral-100 text-neutral-500" },
    rejetee: { label: "❌ Rejetée", cls: "bg-red-100 text-red-600" },
  } as any;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="text-center">
        <p className="text-5xl">📣</p>
        <h1 className="mt-2 text-3xl font-extrabold text-ocean-900 dark:text-white">Fais de la publicité</h1>
        <p className="mt-2 text-neutral-500">Mets ton annonce ou ton business en avant et touche plus de monde aux Comores.</p>
      </div>

      {/* Plans */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {AD_PLANS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPlanId(p.id)}
            className={`card p-5 text-left transition-all ${planId === p.id ? "ring-2 ring-ocean-400" : "hover:-translate-y-1"}`}
          >
            <p className="text-3xl">{p.emoji}</p>
            <p className="mt-2 font-bold text-ocean-900 dark:text-white">{p.label}</p>
            <p className="text-sm text-neutral-500">{p.days} jours</p>
            <p className="mt-2 text-xl font-extrabold text-sand-600 dark:text-sand-400">{formatKMF(p.price)}</p>
            <p className="mt-1 text-xs text-neutral-400">{p.desc}</p>
          </button>
        ))}
      </div>

      {/* Formulaire */}
      <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
        <h2 className="font-bold text-ocean-900 dark:text-white">Créer ma campagne</h2>

        <div>
          <label className="label">Titre de la publicité</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Boutique de vêtements Fatima" required maxLength={80} />
        </div>

        {myListings.length > 0 && (
          <div>
            <label className="label">Lier à une de mes annonces</label>
            <select className="input" onChange={(e) => { const l = myListings.find((x) => x.id === e.target.value); if (l) { setLink(`/annonce/${l.slug}`); setTitle(l.title); if (!image && l.photos?.[0]) setImage(l.photos[0]); } }} defaultValue="">
              <option value="">Choisir une annonce…</option>
              {myListings.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">Lien vers lequel pointer</label>
          <input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/annonce/... ou https://..." required />
        </div>

        <div>
          <label className="label">Image (URL, facultatif)</label>
          <input className="input" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
        </div>

        <div>
          <label className="label">Méthode de paiement</label>
          <div className="flex gap-2">
            {["mvola", "pokera", "kartapay"].map((m) => (
              <button key={m} type="button" onClick={() => setMethod(m)} className={`flex-1 rounded-2xl px-3 py-2 text-sm font-bold capitalize ${method === m ? "bg-ocean-500 text-white" : "bg-cream-100 text-ocean-700 dark:bg-night-700 dark:text-ocean-200"}`}>
                {m === "mvola" ? "M-Vola" : m === "pokera" ? "Pokéra" : "KartaPay"}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-cream-100 p-4 text-center dark:bg-night-700">
          <p className="text-sm text-neutral-500">Total à payer</p>
          <p className="text-2xl font-extrabold text-sand-600 dark:text-sand-400">{formatKMF(plan.price)}</p>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Envoi…" : "Lancer ma publicité 🚀"}
        </button>
        {feedback && <p className="rounded-2xl bg-leaf-50 p-3 text-sm font-semibold text-leaf-700 dark:bg-night-800">{feedback}</p>}
      </form>

      {/* Mes campagnes */}
      {myAds.length > 0 && (
        <div className="card mt-6 p-5">
          <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">Mes publicités</h2>
          <div className="space-y-2">
            {myAds.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl bg-cream-50 px-3 py-2 text-sm dark:bg-night-800">
                <div>
                  <p className="font-semibold text-ocean-800 dark:text-ocean-100">{a.title}</p>
                  <p className="text-xs text-neutral-400">{formatKMF(a.amount)} · {a.days}j · {timeAgo(a.createdAt)}</p>
                </div>
                <span className={`badge ${STATUS[a.status]?.cls || ""}`}>{STATUS[a.status]?.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
