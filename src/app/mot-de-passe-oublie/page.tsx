"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "reset">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
    const d = await r.json();
    setBusy(false);
    if (d.ok) {
      setSuccess(d.message);
      setStep("reset");
    } else setError(d.error);
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, code, password }) });
    const d = await r.json();
    setBusy(false);
    if (d.ok) {
      setSuccess(d.message);
      setTimeout(() => router.push("/connexion"), 1500);
    } else setError(d.error);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="card p-8">
        <div className="mb-6 text-center">
          <span className="text-5xl">🔐</span>
          <h1 className="mt-2 text-2xl font-extrabold text-ocean-900 dark:text-white">Mot de passe oublié</h1>
          <p className="text-sm text-neutral-500">On va t'aider à le récupérer en 2 minutes.</p>
        </div>

        {success && <p className="mb-4 rounded-2xl bg-leaf-50 p-3 text-sm font-semibold text-leaf-700">{success}</p>}
        {error && <p className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}

        {step === "phone" ? (
          <form onSubmit={sendCode} className="space-y-4">
            <div>
              <label className="label">Ton numéro de téléphone</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+269…" required inputMode="tel" />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? "Envoi…" : "Recevoir un code par email"}</button>
          </form>
        ) : (
          <form onSubmit={reset} className="space-y-4">
            <div>
              <label className="label">Code reçu par email</label>
              <input className="input text-center text-2xl tracking-[0.4em]" value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" inputMode="numeric" maxLength={6} required />
            </div>
            <div>
              <label className="label">Nouveau mot de passe</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6 caractères minimum" required minLength={6} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? "Enregistrement…" : "Changer mon mot de passe"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
