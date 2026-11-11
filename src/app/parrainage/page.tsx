"use client";

import { useEffect, useState } from "react";

export default function ParrainagePage() {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral").then((r) => r.json()).then((d) => d.ok && setData(d)).catch(() => {});
  }, []);

  async function copy() {
    if (!data) return;
    await navigator.clipboard.writeText(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-4xl bg-gradient-to-br from-sand-400 to-sand-500 p-8 text-center text-white shadow-warm">
        <p className="text-5xl">🎁</p>
        <h1 className="mt-2 text-2xl font-extrabold">Parraine tes amis</h1>
        <p className="mt-2 text-sm text-white/90">Invite tes amis sur N-marke et gagne des récompenses !</p>

        <div className="mt-6 rounded-3xl bg-white/20 p-4">
          <p className="text-xs uppercase tracking-wide text-white/80">Ton code de parrainage</p>
          <p className="text-3xl font-extrabold tracking-wider">{data?.referralCode || "…"}</p>
          <button onClick={copy} className="btn mt-3 bg-white text-sand-700 hover:bg-white/90">
            {copied ? "✅ Copié !" : "📋 Copier le code"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-2xl">🤝</p>
          <p className="mt-1 font-bold text-ocean-900 dark:text-white">Pour toi (le parrain)</p>
          <p className="text-sm text-neutral-500">7 jours de mise en avant gratuite (ou 7 jours de premium) pour chaque ami inscrit.</p>
        </div>
        <div className="card p-5">
          <p className="text-2xl">🎉</p>
          <p className="mt-1 font-bold text-ocean-900 dark:text-white">Pour ton ami (le filleul)</p>
          <p className="text-sm text-neutral-500">3 jours de mise en avant gratuite à l'inscription.</p>
        </div>
      </div>

      {data && (
        <div className="card mt-6 p-5">
          <h2 className="mb-2 font-bold text-ocean-900 dark:text-white">👥 {data.count} filleul(s) parrainé(s)</h2>
          <p className="text-sm text-neutral-500">Continue à partager ton code pour gagner plus de récompenses !</p>
        </div>
      )}
    </div>
  );
}
