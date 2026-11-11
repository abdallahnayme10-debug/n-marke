"use client";

import { useEffect, useState } from "react";

export default function ProprietairePage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [config, setConfig] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/owner/login").then((r) => r.json()).then((d) => {
      setAuthed(d.authenticated);
      if (d.authenticated) loadConfig();
    }).catch(() => setAuthed(false));
  }, []);

  async function loadConfig() {
    const r = await fetch("/api/owner/config");
    const d = await r.json();
    if (d.ok) setConfig(d.config);
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await fetch("/api/owner/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const d = await r.json();
    setBusy(false);
    if (d.ok) {
      setAuthed(true);
      setPassword("");
      loadConfig();
    } else setError(d.error);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFeedback("");
    const r = await fetch("/api/owner/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
    const d = await r.json();
    setBusy(false);
    setFeedback(d.message || d.error);
    if (d.ok) setConfig(d.config);
  }

  async function logout() {
    await fetch("/api/owner/logout", { method: "POST" });
    setAuthed(false);
  }

  function set(key: string, value: string) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  if (authed === null) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-neutral-400">Chargement…</div>;
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <div className="card p-8 text-center">
          <p className="text-5xl">🔐</p>
          <h1 className="mt-3 text-2xl font-extrabold text-ocean-900 dark:text-white">Espace propriétaire</h1>
          <p className="mt-1 text-sm text-neutral-500">Entre le mot de passe secret pour accéder à la gestion.</p>
          {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}
          <form onSubmit={login} className="mt-5 space-y-3">
            <input type="password" className="input text-center" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" autoFocus />
            <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? "Vérification…" : "Entrer"}</button>
          </form>
        </div>
      </div>
    );
  }

  const input = (key: string, label: string, opts: { secret?: boolean; placeholder?: string } = {}) => (
    <div>
      <label className="label">{label}{opts.secret ? " (secret)" : ""}</label>
      <input
        className="input"
        value={config[key] || ""}
        onChange={(e) => set(key, e.target.value)}
        placeholder={opts.secret ? "•••••••• (laisser vide pour ne pas changer)" : opts.placeholder}
        type={opts.secret ? "password" : "text"}
      />
    </div>
  );

  const area = (key: string, label: string, rows = 6) => (
    <div>
      <label className="label">{label}</label>
      <textarea className="input min-h-[100px]" rows={rows} value={config[key] || ""} onChange={(e) => set(key, e.target.value)} />
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ocean-900 dark:text-white">🛠️ Espace propriétaire</h1>
        <button onClick={logout} className="btn-ghost border border-cream-200 py-2 text-xs">Se déconnecter</button>
      </div>

      {feedback && <p className="mb-4 rounded-2xl bg-leaf-50 p-3 text-sm font-semibold text-leaf-700 dark:bg-night-800">{feedback}</p>}

      <form onSubmit={save} className="space-y-6">
        {/* Période gratuite */}
        <section className="card p-5">
          <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">🎁 Période gratuite</h2>
          <label className="label">Mode</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => set("freePeriodMode", "indefinite")} className={`flex-1 rounded-2xl px-4 py-2 text-sm font-bold ${config.freePeriodMode !== "dated" ? "bg-leaf-500 text-white" : "bg-cream-100 text-ocean-700 dark:bg-night-700 dark:text-ocean-200"}`}>
              Gratuit jusqu'à nouvel ordre
            </button>
            <button type="button" onClick={() => set("freePeriodMode", "dated")} className={`flex-1 rounded-2xl px-4 py-2 text-sm font-bold ${config.freePeriodMode === "dated" ? "bg-ocean-500 text-white" : "bg-cream-100 text-ocean-700 dark:bg-night-700 dark:text-ocean-200"}`}>
              Avec date de fin
            </button>
          </div>
          {config.freePeriodMode === "dated" && (
            <div className="mt-3">
              <label className="label">Date de fin</label>
              <input type="date" className="input" value={(config.freePeriodEnd || "").slice(0, 10)} onChange={(e) => set("freePeriodEnd", new Date(e.target.value).toISOString())} />
            </div>
          )}
        </section>

        {/* Paiements */}
        <section className="card p-5">
          <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">💳 Modes de paiement</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {input("pm_mvola_number", "Numéro marchand M-Vola", { placeholder: "+269…" })}
            {input("pm_pokera_number", "Numéro Pokéra", { placeholder: "+269…" })}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-ocean-800 dark:text-ocean-100">
            <input type="checkbox" className="h-5 w-5 accent-ocean-500" checked={config.pm_kartapay_enabled === "1"} onChange={(e) => set("pm_kartapay_enabled", e.target.checked ? "1" : "0")} />
            Activer KartaPay
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {input("pm_kartapay_key", "Clé KartaPay", { secret: true })}
            {input("pm_mvola_api_base", "URL API M-Vola", { placeholder: "https://api.mvola.km" })}
            {input("pm_mvola_key", "M-Vola consumer key", { secret: true })}
            {input("pm_mvola_secret", "M-Vola consumer secret", { secret: true })}
            {input("pm_mvola_passkey", "M-Vola passkey", { secret: true })}
          </div>
        </section>

        {/* APIs */}
        <section className="card p-5">
          <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">🔌 Clés API</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Fournisseur SMS</label>
              <select className="input" value={config.api_sms_provider || ""} onChange={(e) => set("api_sms_provider", e.target.value)}>
                <option value="">Aucun (simulé)</option>
                <option value="twilio">Twilio</option>
                <option value="africastalking">Africa's Talking</option>
              </select>
            </div>
            {input("api_sms_key", "Clé SMS", { secret: true })}
            {input("api_vision_key", "Google Vision (recherche photo)", { secret: true })}
            {input("api_google_id", "Google OAuth client ID", { secret: true })}
            {input("api_google_secret", "Google OAuth client secret", { secret: true })}
            {input("api_cloudinary_name", "Cloudinary cloud name", { secret: true })}
            {input("api_cloudinary_key", "Cloudinary API key", { secret: true })}
            {input("api_cloudinary_secret", "Cloudinary API secret", { secret: true })}
          </div>
        </section>

        {/* Règles */}
        <section className="card p-5">
          <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">📏 Règles et textes légaux</h2>
          <div className="space-y-3">
            {area("rule_conditions", "Conditions générales d'utilisation", 8)}
            {area("rule_confidentialite", "Politique de confidentialité", 8)}
            {area("rule_regles", "Règles de la plateforme (interdictions…)", 8)}
          </div>
        </section>

        <button type="submit" className="btn-primary w-full text-base" disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer tous les réglages 💾"}
        </button>
      </form>
    </div>
  );
}
