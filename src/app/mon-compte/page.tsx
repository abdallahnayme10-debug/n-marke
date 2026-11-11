"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ISLANDS, REGIONS, SELLER_TIERS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { useTheme } from "@/app/providers";

export default function MonComptePage() {
  const router = useRouter();
  const { theme, setTheme, dataSaver, setDataSaver } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [island, setIsland] = useState("");
  const [region, setRegion] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [newPhone, setNewPhone] = useState("");
  const [feedback, setFeedback] = useState("");
  const [referrals, setReferrals] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (!d.ok) {
        router.push("/connexion");
        return;
      }
      setUser(d.user);
      setName(d.user.name);
      setBio(d.user.bio || "");
      setIsland(d.user.island || "");
      setRegion(d.user.region || "");
      setSmsEnabled(d.user.smsEnabled);
    });
    fetch("/api/referral").then((r) => r.json()).then((d) => d.ok && setReferrals(d.count)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    const r = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio, island: island || undefined, region: region || undefined, smsEnabled }),
    });
    const d = await r.json();
    setFeedback(d.message || d.error);
  }

  async function changeNumber() {
    const r = await fetch("/api/auth/change-number", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPhone }),
    });
    const d = await r.json();
    setFeedback(d.message || d.error);
  }

  if (!user) return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-neutral-400">Chargement…</div>;

  const tierMeta = SELLER_TIERS[user.sellerTier as keyof typeof SELLER_TIERS] || SELLER_TIERS.occasionnel;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-ocean-100 text-2xl dark:bg-night-700">
            {user.profilePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profilePhoto} alt="" className="h-full w-full rounded-full object-cover" />
            ) : "🙂"}
          </span>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-ocean-900 dark:text-white">{user.name}</h1>
            <span className={`badge mt-1 ${tierMeta.badge}`}>{tierMeta.label}</span>
            {user.isCourier && <span className="badge mt-1 ml-2 bg-leaf-100 text-leaf-700">🏍️ Livreur</span>}
          </div>
        </div>
        <p className="mt-3 text-sm text-neutral-500">
          📍 {ISLANDS.find((i) => i.value === user.island)?.label || "—"} · {user.region || "—"} · membre depuis {formatDate(user.createdAt)}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Link href="/mes-annonces" className="rounded-2xl bg-cream-100 p-3 dark:bg-night-700">
            <p className="text-xl">📦</p><p className="text-xs font-bold text-ocean-800 dark:text-ocean-100">Mes annonces</p>
          </Link>
          <Link href="/favoris" className="rounded-2xl bg-cream-100 p-3 dark:bg-night-700">
            <p className="text-xl">❤️</p><p className="text-xs font-bold text-ocean-800 dark:text-ocean-100">Favoris</p>
          </Link>
          <Link href="/commandes" className="rounded-2xl bg-cream-100 p-3 dark:bg-night-700">
            <p className="text-xl">🛒</p><p className="text-xs font-bold text-ocean-800 dark:text-ocean-100">Commandes</p>
          </Link>
        </div>
      </div>

      {feedback && <p className="mt-4 rounded-2xl bg-leaf-50 p-3 text-sm font-semibold text-leaf-700 dark:bg-night-800">{feedback}</p>}

      {/* Infos */}
      <section className="card mt-6 p-6">
        <h2 className="mb-4 font-bold text-ocean-900 dark:text-white">Mes informations</h2>
        <label className="label">Nom / pseudo</label>
        <input className="input mb-3" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="label">Bio (courte présentation)</label>
        <textarea className="input mb-3" value={bio} onChange={(e) => setBio(e.target.value)} />
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
        <button onClick={save} className="btn-primary mt-4">Enregistrer</button>
      </section>

      {/* Préférences */}
      <section className="card mt-6 p-6">
        <h2 className="mb-4 font-bold text-ocean-900 dark:text-white">Préférences</h2>
        <div className="mb-4">
          <label className="label">Mode d'affichage (sombre / clair)</label>
          <div className="flex gap-2">
            {(["light", "dark", "auto"] as const).map((t) => (
              <button key={t} onClick={() => setTheme(t)} className={`rounded-2xl px-4 py-2 text-sm font-bold ${theme === t ? "bg-ocean-500 text-white" : "bg-cream-100 text-ocean-700 dark:bg-night-700 dark:text-ocean-200"}`}>
                {t === "light" ? "☀️ Clair" : t === "dark" ? "🌙 Sombre" : "🕐 Auto"}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-ocean-800 dark:text-ocean-100">
          <input type="checkbox" className="h-5 w-5 accent-leaf-500" checked={dataSaver} onChange={(e) => setDataSaver(e.target.checked)} />
          📉 Mode économie de données (photos en basse qualité, vidéos à la demande)
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-ocean-800 dark:text-ocean-100">
          <input type="checkbox" className="h-5 w-5 accent-leaf-500" checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} />
          💬 Recevoir les notifications par SMS
        </label>
      </section>

      {/* Parrainage */}
      <section className="card mt-6 p-6">
        <h2 className="mb-2 font-bold text-ocean-900 dark:text-white">🎁 Parrainage</h2>
        <p className="text-sm text-neutral-500">Ton code : <span className="rounded-lg bg-cream-100 px-2 py-1 font-mono font-bold text-ocean-700 dark:bg-night-700 dark:text-ocean-200">{user.referralCode}</span></p>
        <p className="mt-1 text-sm text-neutral-500">👥 {referrals} filleul(s) parrainé(s)</p>
        <Link href="/parrainage" className="btn-outline mt-3">En savoir plus</Link>
      </section>

      {/* Changement de numéro */}
      <section className="card mt-6 p-6">
        <h2 className="mb-2 font-bold text-ocean-900 dark:text-white">🔁 Changer mon numéro</h2>
        <p className="mb-3 text-sm text-neutral-500">Tu as changé de numéro ? Demande un transfert, l'équipe vérifiera manuellement.</p>
        <div className="flex gap-2">
          <input className="input" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Nouveau numéro" />
          <button onClick={changeNumber} className="btn-outline shrink-0">Envoyer</button>
        </div>
      </section>
    </div>
  );
}
