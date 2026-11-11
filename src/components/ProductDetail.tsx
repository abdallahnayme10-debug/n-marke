"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LISTING_TYPES, SELLER_TIERS, formatKMF, ISLANDS } from "@/lib/constants";
import { formatDate, timeAgo } from "@/lib/format";
import ListingGrid from "./ListingGrid";
import Stars from "./Stars";
import { useTheme } from "@/app/providers";

type Props = {
  data: {
    listing: any;
    avgRating: number;
    reviewCount: number;
    reviews: any[];
    comments: any[];
    similar: any[];
    sellerListings: any[];
    alertCount: number;
    favoriteCount: number;
    openReports: number;
    qrDataUrl?: string;
  };
};

const ISLAND_LABELS: Record<string, string> = { "grande-comore": "Grande Comore", anjouan: "Anjouan", moheli: "Mohéli" };

export default function ProductDetail({ data }: Props) {
  const router = useRouter();
  const { dataSaver } = useTheme();
  const l = data.listing;
  const [fav, setFav] = useState(false);
  const [alertActive, setAlertActive] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(data.comments);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderQty, setOrderQty] = useState(1);
  const [orderDelivery, setOrderDelivery] = useState(false);
  const [orderAddress, setOrderAddress] = useState("");
  const [orderPhone, setOrderPhone] = useState("");
  const [feedback, setFeedback] = useState("");
  const [views, setViews] = useState(l.views);
  const [showPhoto, setShowPhoto] = useState(!dataSaver);
  const viewCounted = useRef(false);

  useEffect(() => {
    if (viewCounted.current) return;
    viewCounted.current = true;
    fetch(`/api/listings/${l.id}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => d.ok && setViews(d.views))
      .catch(() => {});
  }, [l.id]);

  const typeMeta = LISTING_TYPES[l.type as keyof typeof LISTING_TYPES] || LISTING_TYPES.disponible;
  const tierMeta = SELLER_TIERS[l.seller?.sellerTier as keyof typeof SELLER_TIERS] || SELLER_TIERS.occasionnel;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${baseUrl}/annonce/${l.slug}`;
  const shareText = `*${l.title}* — ${formatKMF(l.price)}\n${url}\n\nVu sur N-marke 🛍️`;

  async function toggleFav() {
    setFav((v) => !v);
    await fetch(`/api/listings/${l.id}/favorite`, { method: "POST" });
  }

  async function toggleAlert() {
    setAlertActive((v) => !v);
    const r = await fetch(`/api/listings/${l.id}/alert`, { method: "POST" });
    const d = await r.json();
    setFeedback(d.message || "");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  }
  function shareFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  }

  async function submitComment() {
    if (commentText.trim().length < 2) return setFeedback("Écris un commentaire un peu plus long 🙂");
    const r = await fetch(`/api/listings/${l.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: commentText }),
    });
    const d = await r.json();
    if (d.ok) {
      setComments((c: any[]) => [d.comment, ...c]);
      setCommentText("");
      setFeedback(d.message);
    } else setFeedback(d.error);
  }

  async function submitReview() {
    const r = await fetch(`/api/listings/${l.id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: reviewRating, comment: reviewText }),
    });
    const d = await r.json();
    setFeedback(d.message || d.error);
    if (d.ok) {
      setReviewOpen(false);
      router.refresh();
    }
  }

  async function submitOrder() {
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: l.id,
        quantity: orderQty,
        deliveryRequested: orderDelivery,
        deliveryAddress: orderAddress,
        deliveryPhone: orderPhone,
      }),
    });
    const d = await r.json();
    setFeedback(d.message || d.error);
    if (d.ok) {
      setOrderOpen(false);
      router.push("/commandes");
    }
  }

  const outOfStock = l.quantity === 0;
  const lowStock = l.quantity > 0 && l.quantity < 5;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Colonne photos / vidéo ── */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-cream-100 shadow-soft dark:bg-night-700">
            {!dataSaver || showPhoto ? (
              l.photos.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={l.photos[photoIdx]}
                  alt={l.title}
                  className="h-full w-full object-cover"
                  style={{ animation: "kenburns 8s ease-in-out infinite" }}
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-7xl opacity-40">🛍️</div>
              )
            ) : (
              <div className="grid h-full w-full place-items-center">
                <button onClick={() => setShowPhoto(true)} className="btn-primary">📷 Voir la photo</button>
              </div>
            )}
            <span className={`absolute left-3 top-3 badge ${typeMeta.badge}`}>{typeMeta.label}</span>
            <button onClick={toggleFav} className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-2xl shadow hover:scale-110">
              {fav ? "❤️" : "🤍"}
            </button>
            <div className="absolute bottom-3 left-3 flex gap-2">
              {l.photos.map((_: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setPhotoIdx(i)}
                  className={`h-2.5 rounded-full transition-all ${i === photoIdx ? "w-6 bg-white" : "w-2.5 bg-white/50"}`}
                />
              ))}
            </div>
          </div>

          {/* Miniatures */}
          {l.photos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {l.photos.map((p: string, i: number) => (
                <button key={i} onClick={() => setPhotoIdx(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${i === photoIdx ? "border-ocean-400" : "border-transparent"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Colonne infos ── */}
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="badge bg-cream-100 text-ocean-700 dark:bg-night-700 dark:text-ocean-200">#{l.articleNumber}</span>
            <button onClick={copyLink} className="text-ocean-500 hover:underline">{copied ? "Lien copié ! ✅" : "Copier le numéro"}</button>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold leading-tight text-ocean-900 dark:text-white sm:text-3xl">{l.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {l.seller && <span className={`badge ${tierMeta.badge}`}>{tierMeta.label}</span>}
            <span className="badge bg-cream-100 text-neutral-500 dark:bg-night-700">👁️ {views} personnes ont vu cette annonce</span>
          </div>

          <p className="mt-4 text-3xl font-extrabold text-sand-600 dark:text-sand-400">{formatKMF(l.price)}</p>
          {l.negotiable && <p className="text-sm font-semibold text-neutral-500">💰 Prix à débattre</p>}

          {/* Disponibilité */}
          <div className="mt-3">
            {outOfStock ? (
              <div className="rounded-2xl bg-red-50 p-3 dark:bg-red-900/20">
                <p className="font-bold text-red-600">Épuisé 😔</p>
                <button onClick={toggleAlert} className="btn-outline mt-2 w-full">
                  {alertActive ? "Alerte activée ✅" : "🔔 Notifie-moi quand c'est disponible"}
                </button>
                {data.alertCount > 0 && <p className="mt-1 text-xs text-neutral-500">{data.alertCount} personne(s) attendent cet article</p>}
              </div>
            ) : (
              <p className={`font-bold ${lowStock ? "text-orange-500" : "text-leaf-600"}`}>
                {l.quantity === 1 ? "⚡ Dernier en stock !" : lowStock ? `Plus que ${l.quantity} en stock` : `${l.quantity} disponibles`}
              </p>
            )}
          </div>

          {/* Détails */}
          <div className="mt-4 space-y-2 rounded-3xl bg-cream-50 p-4 text-sm dark:bg-night-800">
            {l.brand && <p><span className="font-bold text-neutral-500">Marque :</span> {l.brand}</p>}
            {l.model && <p><span className="font-bold text-neutral-500">Modèle :</span> {l.model}</p>}
            {l.condition && <p><span className="font-bold text-neutral-500">État :</span> {conditionLabel(l.condition)}</p>}
            {l.size && <p><span className="font-bold text-neutral-500">Taille :</span> {l.size}</p>}
            {l.color && <p><span className="font-bold text-neutral-500">Couleur :</span> {l.color}</p>}
            <p><span className="font-bold text-neutral-500">Localisation :</span> 📍 {ISLAND_LABELS[l.island] || l.island} · {l.region}{l.neighborhood ? ` · ${l.neighborhood}` : ""}</p>
            {l.type === "commande" && l.orderLeadTime && <p><span className="font-bold text-neutral-500">Délai :</span> {l.orderLeadTime}</p>}
            {l.type === "commande" && l.orderDeposit && <p><span className="font-bold text-neutral-500">Acompte :</span> {l.orderDepositPct}% à la commande</p>}
          </div>

          {/* Tags */}
          {l.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {l.tags.map((t: string) => (
                <Link key={t} href={`/recherche?q=${encodeURIComponent(t)}`} className="chip bg-cream-100 text-ocean-700 hover:bg-cream-200 dark:bg-night-700 dark:text-ocean-200">#{t}</Link>
              ))}
            </div>
          )}

          {/* Livraison */}
          {l.deliveryAvailable && (
            <div className="mt-4 rounded-3xl border-2 border-leaf-200 bg-leaf-50 p-4 dark:border-night-700 dark:bg-night-800">
              <p className="font-bold text-leaf-700 dark:text-leaf-300">🏍️ Livraison par moto disponible</p>
              {l.deliveryZones && <p className="text-sm text-neutral-600 dark:text-neutral-300">Zones : {l.deliveryZones}</p>}
              {l.deliveryTime && <p className="text-sm text-neutral-600 dark:text-neutral-300">Délai estimé : {l.deliveryTime}</p>}
              {l.deliveryFeePaidBy && <p className="text-sm text-neutral-600 dark:text-neutral-300">Frais payés par : {l.deliveryFeePaidBy === "buyer" ? "l'acheteur" : l.deliveryFeePaidBy === "seller" ? "le vendeur" : "offerts"}</p>}
            </div>
          )}

          {/* Boutons d'action */}
          <div className="mt-5 flex flex-col gap-3">
            {!outOfStock && (
              <button onClick={() => setOrderOpen(true)} className="btn-primary w-full text-base">Je suis intéressé(e) / Passer commande</button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Link href={`/messages?to=${l.seller?.id}`} className="btn-outline">💬 Contacter le vendeur</Link>
              <button onClick={shareWhatsApp} className="btn bg-[#25D366] text-white hover:brightness-95">🟢 WhatsApp</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={shareFacebook} className="btn bg-[#1877F2] text-white hover:brightness-95">🔵 Facebook</button>
              <button onClick={copyLink} className="btn-ghost border-2 border-cream-200">{copied ? "✅ Lien copié !" : "🔗 Copier le lien"}</button>
            </div>
          </div>

          {/* Profil vendeur */}
          <div className="mt-6 rounded-3xl bg-white p-4 shadow-soft dark:bg-night-800">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-ocean-100 text-xl dark:bg-night-700">
                {l.seller?.profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.seller.profilePhoto} alt="" className="h-full w-full rounded-full object-cover" />
                ) : "🙂"}
              </span>
              <div className="flex-1">
                <p className="font-bold text-ocean-900 dark:text-white">{l.seller?.name}</p>
                <p className="text-xs text-neutral-500">📍 {ISLAND_LABELS[l.seller?.island] || ""} · {l.seller?.region} · membre depuis {formatDate(l.seller?.createdAt)}</p>
              </div>
              <div className="text-right">
                <Stars rating={data.avgRating} />
                <p className="text-xs text-neutral-400">{data.reviewCount} avis</p>
              </div>
            </div>
            {data.openReports > 0 && (
              <p className="mt-2 text-xs font-semibold text-orange-500">⚠️ {data.openReports} litige(s) non résolu(s)</p>
            )}
          </div>

          {/* Feedback */}
          {feedback && <p className="mt-4 rounded-2xl bg-leaf-50 p-3 text-sm font-semibold text-leaf-700 dark:bg-night-800 dark:text-leaf-300">{feedback}</p>}
        </div>
      </div>

      {/* ── Description ── */}
      <section className="mt-8">
        <h2 className="section-title mb-3">Description</h2>
        <div className="card whitespace-pre-line p-5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">{l.description}</div>
      </section>

      {/* ── QR code ── */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card flex items-center gap-4 p-5">
          {data.qrDataUrl ? (
            <div className="shrink-0 overflow-hidden rounded-2xl bg-white p-2 shadow-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.qrDataUrl} alt="QR code de l'annonce" className="h-28 w-28" />
            </div>
          ) : null}
          <div>
            <p className="font-bold text-ocean-900 dark:text-white">QR code de cette annonce</p>
            <p className="text-sm text-neutral-500">Imprime-le ou envoie-le sur WhatsApp pour partager ton produit.</p>
          </div>
        </div>
      </section>

      {/* ── Commentaires ── */}
      <section className="mt-10">
        <h2 className="section-title mb-4">Commentaires ({comments.length})</h2>
        <div className="card p-4">
          <textarea
            className="input min-h-[80px]"
            placeholder="Écris un commentaire…"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button onClick={submitComment} className="btn-primary mt-2">Publier</button>
        </div>
        <div className="mt-4 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="card flex gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream-100 text-lg dark:bg-night-700">🙂</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-ocean-900 dark:text-white">{c.author?.name}{c.author?.isCourier ? " 🏍️" : ""}</p>
                  <span className="text-xs text-neutral-400">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Avis ── */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Avis ({data.reviewCount})</h2>
          <button onClick={() => setReviewOpen((v) => !v)} className="btn-outline py-2">⭐ Donner mon avis</button>
        </div>
        {data.avgRating > 0 && (
          <div className="card mb-4 flex items-center gap-3 p-5">
            <span className="text-4xl font-extrabold text-sand-500">{data.avgRating.toFixed(1)}</span>
            <Stars rating={data.avgRating} size="text-2xl" />
          </div>
        )}
        {reviewOpen && (
          <div className="card mb-4 p-4">
            <div className="mb-2 flex gap-1 text-2xl">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} onClick={() => setReviewRating(i)} className={i <= reviewRating ? "text-sand-400" : "text-neutral-300"}>★</button>
              ))}
            </div>
            <textarea className="input min-h-[80px]" placeholder="Ton expérience…" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
            <button onClick={submitReview} className="btn-primary mt-2">Envoyer mon avis</button>
          </div>
        )}
        <div className="space-y-3">
          {data.reviews.map((r) => (
            <div key={r.id} className="card flex gap-3 p-4">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-ocean-900 dark:text-white">{r.author?.name}</p>
                  <Stars rating={r.rating} />
                </div>
                {r.comment && <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{r.comment}</p>}
                <p className="mt-1 text-xs text-neutral-400">{timeAgo(r.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Autres annonces du vendeur ── */}
      {data.sellerListings.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title mb-4">Autres annonces de {l.seller?.name}</h2>
          <ListingGrid items={data.sellerListings} />
        </section>
      )}

      {/* ── Articles similaires ── */}
      {data.similar.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title mb-4">Tu pourrais aussi aimer ❤️</h2>
          <ListingGrid items={data.similar} />
        </section>
      )}

      {/* ── Modal commande ── */}
      {orderOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ocean-900/60 p-4 backdrop-blur-sm sm:items-center" onClick={() => setOrderOpen(false)}>
          <div className="w-full max-w-md rounded-4xl bg-white p-6 shadow-soft-lg dark:bg-night-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-xl font-bold text-ocean-900 dark:text-white">Passer une commande</h3>
            <p className="mb-4 text-sm text-neutral-500">{l.title} — {formatKMF(l.price)}</p>
            <label className="label">Quantité</label>
            <input type="number" min={1} max={l.quantity} className="input mb-3" value={orderQty} onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value)))} />
            {l.deliveryAvailable && (
              <label className="flex items-center gap-2 rounded-2xl border-2 border-cream-200 p-3 text-sm font-semibold text-ocean-800 dark:border-night-700 dark:text-ocean-100">
                <input type="checkbox" className="h-5 w-5 accent-leaf-500" checked={orderDelivery} onChange={(e) => setOrderDelivery(e.target.checked)} />
                🏍️ Je veux être livré par moto
              </label>
            )}
            {orderDelivery && (
              <>
                <label className="label mt-3">Adresse de livraison</label>
                <input className="input mb-2" value={orderAddress} onChange={(e) => setOrderAddress(e.target.value)} placeholder="Quartier, repère…" />
                <label className="label">Ton téléphone</label>
                <input className="input mb-3" value={orderPhone} onChange={(e) => setOrderPhone(e.target.value)} placeholder="+269…" />
              </>
            )}
            <div className="mt-4 flex gap-3">
              <button onClick={() => setOrderOpen(false)} className="btn-ghost flex-1">Annuler</button>
              <button onClick={submitOrder} className="btn-primary flex-1">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function conditionLabel(c: string): string {
  const map: Record<string, string> = { neuf: "Neuf", "comme-neuf": "Comme neuf", "bon-etat": "Bon état", "etat-correct": "État correct", pieces: "Pour pièces" };
  return map[c] || c;
}
