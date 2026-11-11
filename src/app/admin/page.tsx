"use client";

import { useEffect, useState } from "react";
import { formatKMF } from "@/lib/constants";
import { timeAgo } from "@/lib/format";

type Tab = "apercu" | "gratuit" | "paiements" | "utilisateurs" | "litiges" | "bannieres";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("apercu");
  const [stats, setStats] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [feedback, setFeedback] = useState("");
  const [notAdmin, setNotAdmin] = useState(false);

  useEffect(() => {
    loadStats();
    loadPayments();
    loadUsers();
    loadReports();
    loadBanners();
  }, []);

  async function loadStats() {
    const r = await fetch("/api/admin/stats");
    const d = await r.json();
    if (!d.ok) setNotAdmin(true);
    else setStats(d.stats);
  }
  async function loadPayments() {
    const r = await fetch("/api/admin/payments");
    const d = await r.json();
    if (d.ok) setPayments(d.payments);
  }
  async function loadUsers() {
    const r = await fetch("/api/admin/users");
    const d = await r.json();
    if (d.ok) setUsers(d.users);
  }
  async function loadReports() {
    const r = await fetch("/api/admin/reports");
    const d = await r.json();
    if (d.ok) setReports(d.reports);
  }
  async function loadBanners() {
    const r = await fetch("/api/admin/banners");
    const d = await r.json();
    if (d.ok) setBanners(d.banners);
  }

  async function action(url: string, method: string, body: any) {
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    setFeedback(d.message || d.error);
    loadStats(); loadPayments(); loadUsers(); loadReports(); loadBanners();
  }

  if (notAdmin) {
    return <div className="mx-auto max-w-md px-4 py-16 text-center text-neutral-500">Cette page est réservée à l'administrateur. 🔐</div>;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "apercu", label: "📊 Aperçu" },
    { id: "gratuit", label: "🎁 Période gratuite" },
    { id: "paiements", label: "💳 Paiements" },
    { id: "utilisateurs", label: "👥 Utilisateurs" },
    { id: "litiges", label: "🚨 Litiges" },
    { id: "bannieres", label: "🎨 Bannières" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-ocean-900 dark:text-white">Tableau de bord administrateur 🛠️</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-2xl px-4 py-2 text-sm font-bold ${tab === t.id ? "bg-ocean-500 text-white" : "bg-cream-100 text-ocean-700 dark:bg-night-700 dark:text-ocean-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {feedback && <p className="mb-4 rounded-2xl bg-leaf-50 p-3 text-sm font-semibold text-leaf-700">{feedback}</p>}

      {tab === "apercu" && stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Utilisateurs" value={stats.users.total} sub={`${stats.users.newToday} aujourd'hui`} />
          <StatCard label="Annonces actives" value={stats.listings.active} sub={`${stats.listings.total} au total`} />
          <StatCard label="Livreurs" value={stats.delivery.couriers} sub={`${stats.delivery.totalDeliveries} livraisons`} />
          <StatCard label="Paiements en attente" value={stats.payments.pending} sub={`${stats.payments.total} au total`} />
          <StatCard label="Litiges ouverts" value={stats.disputes.open} sub={`${stats.disputes.resolved} résolus`} />
          <StatCard label="Parrainages" value={stats.referrals} sub="total" />
          <StatCard label="Jours gratuits restants" value={stats.freePeriod.freeDays} sub={stats.freePeriod.active ? "Actif" : "Terminé"} />

          {/* Catégories */}
          <div className="card p-4 sm:col-span-2 lg:col-span-4">
            <h3 className="mb-2 font-bold text-ocean-900 dark:text-white">Annonces par catégorie</h3>
            <div className="flex flex-wrap gap-2">
              {stats.categories.map((c: any) => (
                <span key={c.name} className="chip bg-cream-100 text-ocean-700 dark:bg-night-700 dark:text-ocean-200">{c.icon} {c.name} : {c.count}</span>
              ))}
            </div>
          </div>

          {/* Top recherches */}
          <div className="card p-4 sm:col-span-2">
            <h3 className="mb-2 font-bold text-ocean-900 dark:text-white">🔍 Mots-clés les plus recherchés</h3>
            {stats.topSearches.map((s: any) => (
              <div key={s.query} className="flex justify-between text-sm">
                <span className="text-ocean-800 dark:text-ocean-100">{s.query}</span>
                <span className="text-neutral-400">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "gratuit" && stats && (
        <div className="card max-w-md p-6">
          <h2 className="mb-2 font-bold text-ocean-900 dark:text-white">Période gratuite</h2>
          <p className="mb-4 text-sm text-neutral-500">
            {stats.freePeriod.active
              ? `Il reste ${stats.freePeriod.freeDays} jours de gratuité.`
              : "La période gratuite est terminée."}
          </p>
          <div className="flex gap-2">
            <button onClick={() => action("/api/admin/free-period", "POST", { action: "prolonger", days: 30 })} className="btn-secondary flex-1">+30 jours</button>
            <button onClick={() => action("/api/admin/free-period", "POST", { action: "arreter" })} className="btn-ghost flex-1 border border-cream-200">Arrêter</button>
          </div>
        </div>
      )}

      {tab === "paiements" && (
        <div className="space-y-3">
          {payments.length === 0 ? (
            <p className="text-neutral-400">Aucun paiement en attente. 🎉</p>
          ) : (
            payments.map((p) => (
              <div key={p.id} className="card flex items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="font-bold text-ocean-900 dark:text-white">{p.description}</p>
                  <p className="text-sm text-neutral-500">{p.user.name} · {p.user.phone} · {p.method === "mvola" ? "M-Vola" : "Pokéra"} · réf: {p.reference || "—"}</p>
                  <p className="font-bold text-sand-600">{formatKMF(p.amount)} · {timeAgo(p.createdAt)}</p>
                </div>
                <button onClick={() => action(`/api/payments/${p.id}`, "PATCH", { action: "valider" })} className="btn-secondary py-2 text-xs">✅ Valider</button>
                <button onClick={() => action(`/api/payments/${p.id}`, "PATCH", { action: "rejeter" })} className="btn-ghost py-2 text-xs border border-cream-200 text-red-500">❌ Rejeter</button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "utilisateurs" && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="card flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-bold text-ocean-900 dark:text-white">
                  {u.name} {u.isCourier && "🏍️"} {u.role === "admin" && "🛠️"}
                  {u.lockedUntil && new Date(u.lockedUntil) > new Date() && <span className="badge ml-2 bg-red-100 text-red-600">🔒 Bloqué</span>}
                </p>
                <p className="text-sm text-neutral-500">{u.phone} · {u.island} · {u.region} · {u.sellerTier} · {u._count.listings} annonces · {u._count.reportsOn} litiges</p>
              </div>
              {u.lockedUntil && new Date(u.lockedUntil) > new Date() && (
                <button onClick={() => action("/api/admin/users", "POST", { action: "unblock", userId: u.id })} className="btn-outline py-2 text-xs">Débloquer</button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "litiges" && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <p className="text-neutral-400">Aucun litige ouvert. 🎉</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="card p-4">
                <p className="font-bold text-ocean-900 dark:text-white">🚨 {r.type} — {r.listing?.title || "Sans annonce"}</p>
                <p className="text-sm text-neutral-500">{r.description}</p>
                <p className="mt-1 text-xs text-neutral-400">Signaleur : {r.reporter?.name} · Contre : {r.against?.name} · {timeAgo(r.createdAt)}</p>
                <button onClick={() => action("/api/admin/reports", "PATCH", { id: r.id, resolution: "Traité par l'équipe N-marke." })} className="btn-secondary mt-2 py-2 text-xs">Marquer résolu</button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "bannieres" && (
        <div>
          <BannerForm onDone={() => { loadBanners(); loadStats(); }} />
          <div className="mt-4 space-y-2">
            {banners.map((b) => (
              <div key={b.id} className="card flex items-center gap-3 p-4">
                <span className="text-2xl">{b.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-ocean-900 dark:text-white">{b.title}</p>
                  <p className="text-sm text-neutral-500">{b.message}</p>
                </div>
                <button onClick={() => action(`/api/admin/banners/${b.id}`, "PATCH", { active: !b.active })} className="btn-outline py-2 text-xs">{b.active ? "Désactiver" : "Activer"}</button>
                <button onClick={() => action(`/api/admin/banners/${b.id}`, "DELETE", {})} className="btn-ghost py-2 text-xs text-red-500">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-extrabold text-ocean-700 dark:text-ocean-200">{value}</p>
      <p className="text-sm font-semibold text-ocean-900 dark:text-white">{label}</p>
      {sub && <p className="text-xs text-neutral-400">{sub}</p>}
    </div>
  );
}

function BannerForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [emoji, setEmoji] = useState("🎉");
  const [color, setColor] = useState("#C8963E");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, emoji, color }),
    });
    setTitle(""); setMessage("");
    onDone();
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <h3 className="font-bold text-ocean-900 dark:text-white">Créer une bannière (Aïd, rentrée, promo…)</h3>
      <input className="input" placeholder="Titre (ex : Aïd Moubarak)" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <input className="input" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} required />
      <div className="flex gap-2">
        <input className="input" placeholder="Emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
        <input type="color" className="h-12 w-16 cursor-pointer rounded-2xl border-0" value={color} onChange={(e) => setColor(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary">Créer</button>
    </form>
  );
}
