"use client";

import { useEffect, useState } from "react";
import { FEATURE_PLANS, PREMIUM_PRICE, formatKMF } from "@/lib/constants";

const MVOLA_NUMBER = process.env.NEXT_PUBLIC_MVOLA_NUMBER || "+2694909765";

export default function PaiementPage() {
  const [service, setService] = useState<"premium" | "feature">("premium");
  const [plan, setPlan] = useState(FEATURE_PLANS[0]);
  const [method, setMethod] = useState<"mvola" | "pokera">("mvola");
  const [reference, setReference] = useState("");
  const [payments, setPayments] = useState<any[]>([]);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  const amount = service === "premium" ? PREMIUM_PRICE : plan.price;

  useEffect(() => {
    fetch("/api/payments").then((r) => r.json()).then((d) => d.ok && setPayments(d.payments)).catch(() => {});
  }, []);

  async function submit() {
    setBusy(true);
    setFeedback("");
    const r = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service,
        description: service === "premium" ? "Abonnement Premium 1 mois" : `Mise en avant ${plan.days} jours`,
        amount,
        method,
        reference,
      }),
    });
    const d = await r.json();
    setBusy(false);
    setFeedback(d.message || d.error);
    if (d.ok) {
      setPayments((p) => [d.payment, ...p]);
      setReference("");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-ocean-900 dark:text-white">Paiement 💳</h1>

      <div className="card p-6">
        <div className="mb-4 flex gap-2">
          <button onClick={() => setService("premium")} className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold ${service === "premium" ? "bg-ocean-500 text-white" : "bg-cream-100 text-ocean-700 dark:bg-night-700 dark:text-ocean-200"}`}>
            ⭐ Premium<br /><span className="text-xs font-normal">{formatKMF(PREMIUM_PRICE)}/mois</span>
          </button>
          <button onClick={() => setService("feature")} className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold ${service === "feature" ? "bg-ocean-500 text-white" : "bg-cream-100 text-ocean-700 dark:bg-night-700 dark:text-ocean-200"}`}>
            ✨ Mise en avant
          </button>
        </div>

        {service === "feature" && (
          <div className="mb-4 space-y-2">
            {FEATURE_PLANS.map((p) => (
              <button key={p.days} onClick={() => setPlan(p)} className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-sm font-bold ${plan.days === p.days ? "border-ocean-400 bg-ocean-50 dark:bg-night-700" : "border-cream-200 dark:border-night-700"}`}>
                <span>{p.label}</span>
                <span className="text-sand-600">{formatKMF(p.price)}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mb-4 rounded-2xl bg-cream-100 p-4 text-center dark:bg-night-700">
          <p className="text-sm text-neutral-500">Montant à payer</p>
          <p className="text-3xl font-extrabold text-sand-600 dark:text-sand-400">{formatKMF(amount)}</p>
        </div>

        <div className="mb-4 flex gap-2">
          <button onClick={() => setMethod("mvola")} className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold ${method === "mvola" ? "bg-[#f5a623] text-white" : "bg-cream-100 text-ocean-700 dark:bg-night-700 dark:text-ocean-200"}`}>M-Vola</button>
          <button onClick={() => setMethod("pokera")} className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold ${method === "pokera" ? "bg-[#7b2ff2] text-white" : "bg-cream-100 text-ocean-700 dark:bg-night-700 dark:text-ocean-200"}`}>Pokéra</button>
        </div>

        <div className="mb-4 rounded-2xl bg-ocean-50 p-4 text-sm text-ocean-800 dark:bg-night-700 dark:text-ocean-200">
          <p className="font-bold">📱 Comment payer :</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Envoie {formatKMF(amount)} au numéro <strong>{method === "mvola" ? MVOLA_NUMBER : "le numéro Pokéra communiqué"}</strong></li>
            <li>Note la référence de la transaction reçue</li>
            <li>Entre cette référence ci-dessous et valide</li>
          </ol>
        </div>

        <label className="label">Référence de transaction</label>
        <input className="input mb-4" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ex : TX123456789" />

        <button onClick={submit} className="btn-primary w-full" disabled={busy || !reference}>
          {busy ? "Envoi…" : "J'ai effectué le paiement ✅"}
        </button>
        <p className="mt-2 text-center text-xs text-neutral-400">Ton paiement sera vérifié par l'équipe N-marke puis validé.</p>

        {feedback && <p className="mt-4 rounded-2xl bg-leaf-50 p-3 text-sm font-semibold text-leaf-700">{feedback}</p>}
      </div>

      {/* Historique */}
      {payments.length > 0 && (
        <div className="card mt-6 p-5">
          <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">Historique des paiements</h2>
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-cream-50 px-3 py-2 text-sm dark:bg-night-800">
                <span className="font-semibold text-ocean-800 dark:text-ocean-100">{p.description}</span>
                <div className="text-right">
                  <p className="font-bold text-sand-600">{formatKMF(p.amount)}</p>
                  <span className={`badge ${p.status === "valide" ? "bg-leaf-100 text-leaf-700" : p.status === "rejete" ? "bg-red-100 text-red-600" : "bg-sand-100 text-sand-800"}`}>
                    {p.status === "valide" ? "✅ Validé" : p.status === "rejete" ? "❌ Rejeté" : "⏳ En attente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
