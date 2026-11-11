"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InscriptionLivreurPage() {
  const router = useRouter();
  const [availability, setAvailability] = useState("temps plein");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/couriers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability }),
    });
    const d = await r.json();
    setBusy(false);
    setFeedback(d.message || d.error);
    if (d.ok) setTimeout(() => router.push("/tableau-de-bord-livreur"), 1200);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="card p-8">
        <div className="mb-6 text-center">
          <span className="text-6xl">🏍️</span>
          <h1 className="mt-2 text-2xl font-extrabold text-ocean-900 dark:text-white">Deviens livreur</h1>
          <p className="text-sm text-neutral-500">Tu as une moto ? Gagne de l'argent en livrant près de chez toi.</p>
        </div>

        <div className="mb-6 space-y-2 rounded-2xl bg-leaf-50 p-4 text-sm text-leaf-800 dark:bg-night-700 dark:text-leaf-200">
          <p>✅ Pas de documents officiels requis</p>
          <p>✅ Tu choisis tes horaires</p>
          <p>✅ Tu reçois un badge « Livreur »</p>
        </div>

        {feedback && <p className="mb-4 rounded-2xl bg-leaf-50 p-3 text-sm font-semibold text-leaf-700">{feedback}</p>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Ta disponibilité</label>
            <select className="input" value={availability} onChange={(e) => setAvailability(e.target.value)}>
              <option value="temps plein">Temps plein</option>
              <option value="temps partiel">Temps partiel</option>
              <option value="weekends">Weekends</option>
            </select>
          </div>
          <p className="text-xs text-neutral-400">Renseigne ton île et ta région dans ton profil avant de t'inscrire comme livreur.</p>
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Inscription…" : "Je deviens livreur 🏍️"}
          </button>
        </form>
      </div>
    </div>
  );
}
