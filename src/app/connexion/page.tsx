"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GoogleButton from "@/components/GoogleButton";

export default function ConnexionPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const d = await r.json();
    setBusy(false);
    if (d.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(d.error);
      if (d.needsVerification) router.push("/inscription");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="card p-8">
        <div className="mb-6 text-center">
          <span className="text-5xl">👋</span>
          <h1 className="mt-2 text-2xl font-extrabold text-ocean-900 dark:text-white">Content de te revoir</h1>
          <p className="text-sm text-neutral-500">Connecte-toi avec ton numéro de téléphone.</p>
        </div>

        {error && <p className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Numéro de téléphone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+269…" required inputMode="tel" />
          </div>
          <div>
            <label className="label">Mot de passe</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary w-full text-base" disabled={busy}>
            {busy ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-cream-200 dark:bg-night-700" />
          <span className="text-xs font-semibold text-neutral-400">ou</span>
          <span className="h-px flex-1 bg-cream-200 dark:bg-night-700" />
        </div>
        <GoogleButton />

        <div className="mt-4 flex flex-col gap-2 text-center text-sm">
          <Link href="/mot-de-passe-oublie" className="font-bold text-ocean-500 hover:underline">Mot de passe oublié ?</Link>
          <Link href="/inscription" className="text-neutral-500 hover:underline">Pas encore de compte ? Inscris-toi</Link>
        </div>
      </div>
    </div>
  );
}
