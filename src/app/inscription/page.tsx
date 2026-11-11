"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ISLANDS, REGIONS } from "@/lib/constants";
import GoogleButton from "@/components/GoogleButton";

export default function InscriptionPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [island, setIsland] = useState("");
  const [region, setRegion] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, password, island: island || undefined, region: region || undefined, referralCode: referralCode || undefined }),
    });
    const d = await r.json();
    setBusy(false);
    if (d.ok) {
      setSuccess(d.message);
      setStep("verify");
    } else setError(d.error);
  }

  async function submitVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const d = await r.json();
    setBusy(false);
    if (d.ok) {
      router.push("/?welcome=1");
      router.refresh();
    } else setError(d.error);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="card p-8">
        <div className="mb-6 text-center">
          <span className="text-5xl">🌴</span>
          <h1 className="mt-2 text-2xl font-extrabold text-ocean-900 dark:text-white">Rejoins N-marke</h1>
          <p className="text-sm text-neutral-500">Crée ton compte en 30 secondes. C'est gratuit !</p>
        </div>

        {success && <p className="mb-4 rounded-2xl bg-leaf-50 p-3 text-sm font-semibold text-leaf-700">{success}</p>}
        {error && <p className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}

        {step === "form" ? (
          <form onSubmit={submitForm} className="space-y-4">
            <div>
              <label className="label">Nom ou pseudo</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Fatima" required minLength={2} />
            </div>
            <div>
              <label className="label">Numéro de téléphone</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+269 3XX XX XX" required inputMode="tel" />
              <p className="mt-1 text-xs text-neutral-400">Sert à te connecter.</p>
            </div>
            <div>
              <label className="label">Adresse email</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" required />
              <p className="mt-1 text-xs text-neutral-400">On t'enverra un code de confirmation par email.</p>
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6 caractères minimum" required minLength={6} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Île</label>
                <select className="input" value={island} onChange={(e) => { setIsland(e.target.value); setRegion(""); }}>
                  <option value="">Choisis…</option>
                  {ISLANDS.map((i) => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Région</label>
                <select className="input" value={region} onChange={(e) => setRegion(e.target.value)} disabled={!island}>
                  <option value="">Choisis…</option>
                  {(island ? REGIONS[island] || [] : []).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Code de parrainage (facultatif)</label>
              <input className="input" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="NMK-XXXXXX" />
            </div>
            <button type="submit" className="btn-primary w-full text-base" disabled={busy}>
              {busy ? "Inscription…" : "S'inscrire 🚀"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitVerify} className="space-y-4">
            <p className="text-sm text-neutral-500">On a envoyé un code de confirmation par email à <strong>{email}</strong>. Entre-le ci-dessous 👇</p>
            <div>
              <label className="label">Code de vérification</label>
              <input className="input text-center text-2xl tracking-[0.5em]" value={code} onChange={(e) => setCode(e.target.value)} placeholder="0000" inputMode="numeric" maxLength={4} required />
            </div>
            <button type="submit" className="btn-primary w-full text-base" disabled={busy}>
              {busy ? "Vérification…" : "Confirmer mon email ✅"}
            </button>
          </form>
        )}

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-cream-200 dark:bg-night-700" />
          <span className="text-xs font-semibold text-neutral-400">ou</span>
          <span className="h-px flex-1 bg-cream-200 dark:bg-night-700" />
        </div>
        <GoogleButton label="S'inscrire avec Google" />

        <p className="mt-6 text-center text-sm text-neutral-500">
          Déjà inscrit ?{" "}
          <Link href="/connexion" className="font-bold text-ocean-500 hover:underline">Connecte-toi</Link>
        </p>
      </div>
    </div>
  );
}
