"use client";

import { useState } from "react";

const SECTIONS = [
  {
    title: "🛒 Pour les acheteurs",
    items: [
      { q: "Comment chercher un produit ?", a: "Utilise la grande barre de recherche en haut de la page. Tape un mot-clé, ou utilise le bouton 📷 pour chercher avec une photo. Tu peux aussi filtrer par île, région, catégorie et prix." },
      { q: "Comment contacter un vendeur ?", a: "Ouvre l'annonce et clique sur « Contacter le vendeur ». Tu peux aussi cliquer sur « Je suis intéressé(e) » pour passer une commande." },
      { q: "Comment demander une livraison ?", a: "Si l'annonce propose la livraison par moto, coche « Je veux être livré par moto » lors de ta commande. Un livreur près de chez toi s'occupera du reste !" },
      { q: "Que faire si je reçois le mauvais produit ?", a: "Va sur ta commande et clique sur « Signaler un problème ». L'équipe N-marke examinera le litige et t'aidera à trouver une solution." },
    ],
  },
  {
    title: "📦 Pour les vendeurs",
    items: [
      { q: "Comment publier une annonce ?", a: "Clique sur « Vendre » puis « Publier une annonce ». Ajoute des photos, un titre, un prix, choisis ta catégorie et ta région, et c'est en ligne !" },
      { q: "Comment renouveler une annonce ?", a: "Une annonce en vente entre particuliers expire après 30 jours. Tu peux la republier depuis « Mes annonces »." },
      { q: "Comment passer en premium ?", a: "Va dans « Paiement » et choisis l'abonnement Premium (3 000 KMF/mois après la période gratuite). Tu auras des annonces illimitées et plus de visibilité." },
      { q: "Comment mettre une annonce en avant ?", a: "Dans « Mes annonces », clique sur « Mettre en avant ». C'est gratuit pendant la période de lancement !" },
    ],
  },
  {
    title: "🏍️ Pour les livreurs",
    items: [
      { q: "Comment s'inscrire comme livreur ?", a: "Clique sur « Livreurs » puis « Devenir livreur ». Renseigne ton île et ta région dans ton profil, choisis ta disponibilité, et c'est tout !" },
      { q: "Comment accepter une livraison ?", a: "Quand un acheteur te choisit, tu reçois une notification. Va dans ton tableau de bord livreur et clique sur « Accepter »." },
      { q: "Comment mettre à jour mon statut ?", a: "Dans ton tableau de bord, fais évoluer le statut : en route, colis récupéré, en livraison, puis livré." },
    ],
  },
  {
    title: "💳 Paiements",
    items: [
      { q: "Comment payer via M-Vola ?", a: "Choisis M-Vola, envoie le montant au numéro indiqué, note la référence de transaction, puis entre-la dans le formulaire." },
      { q: "Comment payer via Pokéra ?", a: "Même principe : choisis Pokéra, effectue le transfert, puis entre ta référence." },
      { q: "Que faire si mon paiement n'est pas validé ?", a: "L'équipe vérifie chaque paiement manuellement. Si ça prend du temps, contacte le support depuis cette page." },
    ],
  },
];

export default function AidePage() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function contact(e: React.FormEvent) {
    e.preventDefault();
    const admin = await fetch("/api/admin/stats").then((r) => r.json()).catch(() => null);
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-extrabold text-ocean-900 dark:text-white">Centre d'aide 💬</h1>
      <p className="mb-8 text-neutral-500">Comment peut-on t'aider aujourd'hui ?</p>

      {SECTIONS.map((s) => (
        <div key={s.title} className="mb-6">
          <h2 className="mb-3 text-lg font-bold text-ocean-900 dark:text-white">{s.title}</h2>
          <div className="space-y-2">
            {s.items.map((item) => {
              const key = s.title + item.q;
              const isOpen = open[key];
              return (
                <div key={key} className="card overflow-hidden">
                  <button onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))} className="flex w-full items-center justify-between p-4 text-left">
                    <span className="font-semibold text-ocean-800 dark:text-ocean-100">{item.q}</span>
                    <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                  </button>
                  {isOpen && <p className="border-t border-cream-100 px-4 py-3 text-sm text-neutral-600 dark:border-night-700 dark:text-neutral-300">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Contact support */}
      <div id="contact" className="card mt-8 p-6">
        <h2 className="mb-2 font-bold text-ocean-900 dark:text-white">📮 Contacter le support</h2>
        <p className="mb-4 text-sm text-neutral-500">Une question ? L'équipe N-marke te répond rapidement.</p>
        {sent ? (
          <p className="rounded-2xl bg-leaf-50 p-3 text-sm font-semibold text-leaf-700">Merci ! Ton message a bien été envoyé à l'équipe. 🙏</p>
        ) : (
          <form onSubmit={contact}>
            <textarea className="input mb-3 min-h-[100px]" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Écris ton message ici…" required />
            <button type="submit" className="btn-primary">Envoyer le message</button>
          </form>
        )}
      </div>
    </div>
  );
}
