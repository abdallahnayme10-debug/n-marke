"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, ISLANDS, REGIONS, CONDITIONS, SUGGESTED_TAGS } from "@/lib/constants";

type CategoryData = { id: string; name: string; slug: string; icon: string; subcategories: { id: string; name: string }[] };

export default function PublierPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [type, setType] = useState("disponible");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [articleNumber, setArticleNumber] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [condition, setCondition] = useState("");
  const [island, setIsland] = useState("");
  const [region, setRegion] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState("");
  const [deliveryFeePaidBy, setDeliveryFeePaidBy] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [orderLeadTime, setOrderLeadTime] = useState("");
  const [orderDeposit, setOrderDeposit] = useState(false);
  const [orderDepositPct, setOrderDepositPct] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => d.ok && setCategories(d.categories))
      .catch(() => {});
  }, []);

  async function uploadPhotos(files: FileList) {
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, 6 - photos.length)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "listing");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (d.ok) urls.push(d.url);
    }
    setPhotos((p) => [...p, ...urls].slice(0, 6));
    setUploading(false);
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const suggestedTags = selectedCategory ? SUGGESTED_TAGS[selectedCategory.name] || SUGGESTED_TAGS.default : SUGGESTED_TAGS.default;

  function addTag(t: string) {
    const clean = t.trim().toLowerCase().replace(/^#/, "");
    if (clean && !tags.includes(clean) && tags.length < 10) setTags((x) => [...x, clean]);
    setTagInput("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    const body = {
      title,
      description,
      price: negotiable ? null : Number(price),
      negotiable,
      type,
      categoryId,
      subcategoryId: subcategoryId || null,
      brand: brand || null,
      model: model || null,
      articleNumber: articleNumber || null,
      quantity: Number(quantity) || 1,
      size: size || null,
      color: color || null,
      condition: condition || null,
      island,
      region,
      neighborhood: neighborhood || null,
      deliveryAvailable,
      deliveryZones: deliveryZones || null,
      deliveryFeePaidBy: deliveryFeePaidBy || null,
      deliveryTime: deliveryTime || null,
      orderLeadTime: orderLeadTime || null,
      orderDeposit,
      orderDepositPct: orderDepositPct ? Number(orderDepositPct) : null,
      photos,
      tags,
    };
    const r = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    setBusy(false);
    if (d.ok) {
      setSuccess(d.message);
      router.push(`/annonce/${d.listing.slug}`);
    } else setError(d.error);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ocean-900 dark:text-white">Publier une annonce 📦</h1>
      <p className="mb-6 text-sm text-neutral-500">Prends de belles photos, mets un prix juste, et c'est en ligne !</p>

      {success && <p className="mb-4 rounded-2xl bg-leaf-50 p-3 text-sm font-semibold text-leaf-700">{success}</p>}
      {error && <p className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>}

      <form onSubmit={submit} className="space-y-6">
        {/* Photos */}
        <section className="card p-5">
          <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">1. Photos (jusqu'à 6)</h2>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-2xl bg-cream-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setPhotos(photos.filter((_, x) => x !== i))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-red-500 text-xs text-white">✕</button>
              </div>
            ))}
            {photos.length < 6 && (
              <label className="grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-ocean-200 text-3xl text-ocean-300 hover:bg-cream-50 dark:border-night-700">
                📷
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && uploadPhotos(e.target.files)} />
              </label>
            )}
          </div>
          {uploading && <p className="mt-2 text-xs text-neutral-400">Téléversement… tes photos sont protégées par un filigrane N-marke.</p>}
          <p className="mt-2 text-xs text-neutral-400">🛡️ Un filigrane N-marke discret est ajouté pour protéger tes photos.</p>
        </section>

        {/* Infos générales */}
        <section className="card p-5">
          <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">2. Informations générales</h2>
          <label className="label">Nom du produit *</label>
          <input className="input mb-3" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Téléphone Samsung Galaxy S21" required minLength={3} />

          <label className="label">Description détaillée *</label>
          <textarea className="input mb-3 min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décris ton produit : état, couleur, particularités…" required minLength={10} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prix (KMF) *</label>
              <input type="number" className="input" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex : 15000" disabled={negotiable} />
            </div>
            <div>
              <label className="label">Type d'annonce</label>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="disponible">Disponible maintenant</option>
                <option value="commande">Sur commande</option>
                <option value="occasion">Occasion / Reconditionné</option>
                <option value="particulier">Vente entre particuliers</option>
              </select>
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-ocean-800 dark:text-ocean-100">
            <input type="checkbox" className="h-5 w-5 accent-sand-400" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} />
            💰 Prix à débattre
          </label>

          {/* Vente sur commande */}
          {type === "commande" && (
            <div className="mt-4 rounded-2xl bg-ocean-50 p-4 dark:bg-night-700">
              <p className="mb-2 font-bold text-ocean-700 dark:text-ocean-200">Détails de la vente sur commande</p>
              <label className="label">Délai de livraison estimé</label>
              <input className="input mb-2" value={orderLeadTime} onChange={(e) => setOrderLeadTime(e.target.value)} placeholder="Ex : 2 à 3 semaines" />
              <label className="flex items-center gap-2 text-sm font-semibold text-ocean-800 dark:text-ocean-100">
                <input type="checkbox" className="h-5 w-5 accent-ocean-400" checked={orderDeposit} onChange={(e) => setOrderDeposit(e.target.checked)} />
                Acompte demandé
              </label>
              {orderDeposit && (
                <input type="number" className="input mt-2" value={orderDepositPct} onChange={(e) => setOrderDepositPct(e.target.value)} placeholder="% d'acompte (ex : 30)" />
              )}
            </div>
          )}
        </section>

        {/* Classement */}
        <section className="card p-5">
          <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">3. Classement et identification</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Catégorie *</label>
              <select className="input" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId(""); }} required>
                <option value="">Choisis…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Sous-catégorie *</label>
              <select className="input" value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} required disabled={!categoryId}>
                <option value="">Choisis…</option>
                {(selectedCategory?.subcategories || []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Marque (recommandé)</label>
              <input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ex : Samsung" />
            </div>
            <div>
              <label className="label">Modèle (recommandé)</label>
              <input className="input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Ex : Galaxy S21" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Numéro d'article (facultatif)</label>
              <input className="input" value={articleNumber} onChange={(e) => setArticleNumber(e.target.value)} placeholder="Auto : NMK-XXXXX" />
            </div>
            <div>
              <label className="label">Nombre disponible *</label>
              <input type="number" min={1} className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Taille (si applicable)</label>
              <input className="input" value={size} onChange={(e) => setSize(e.target.value)} placeholder="Ex : M, 42…" />
            </div>
            <div>
              <label className="label">Couleur (si applicable)</label>
              <input className="input" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Ex : Bleu" />
            </div>
          </div>
          <div className="mt-3">
            <label className="label">État</label>
            <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="">Choisis…</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Localisation */}
        <section className="card p-5">
          <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">4. Localisation</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Île *</label>
              <select className="input" value={island} onChange={(e) => { setIsland(e.target.value); setRegion(""); }} required>
                <option value="">Choisis…</option>
                {ISLANDS.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Région *</label>
              <select className="input" value={region} onChange={(e) => setRegion(e.target.value)} required disabled={!island}>
                <option value="">Choisis…</option>
                {(island ? REGIONS[island] || [] : []).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Quartier ou point de repère (facultatif)</label>
            <input className="input" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Ex : Place Badjanani" />
          </div>
        </section>

        {/* Livraison */}
        <section className="card p-5">
          <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">5. Livraison par moto 🏍️</h2>
          <label className="flex items-center gap-2 text-sm font-semibold text-ocean-800 dark:text-ocean-100">
            <input type="checkbox" className="h-5 w-5 accent-leaf-500" checked={deliveryAvailable} onChange={(e) => setDeliveryAvailable(e.target.checked)} />
            Je propose la livraison par moto
          </label>
          {deliveryAvailable && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="label">Zones couvertes</label>
                <input className="input" value={deliveryZones} onChange={(e) => setDeliveryZones(e.target.value)} placeholder="Ex : Moroni et environs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Qui paie les frais ?</label>
                  <select className="input" value={deliveryFeePaidBy} onChange={(e) => setDeliveryFeePaidBy(e.target.value)}>
                    <option value="">Choisis…</option>
                    <option value="buyer">L'acheteur</option>
                    <option value="seller">Moi (le vendeur)</option>
                    <option value="free">Livraison offerte</option>
                  </select>
                </div>
                <div>
                  <label className="label">Délai estimé</label>
                  <input className="input" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} placeholder="Ex : 1 à 2 heures" />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Tags */}
        <section className="card p-5">
          <h2 className="mb-3 font-bold text-ocean-900 dark:text-white">6. Tags et mots-clés</h2>
          <p className="mb-2 text-xs text-neutral-500">Jusqu'à 10 tags pour aider les gens à trouver ton article.</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="chip bg-cream-100 text-ocean-700 dark:bg-night-700 dark:text-ocean-200">
                #{t}
                <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="ml-1 text-neutral-400 hover:text-red-500">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(tagInput))} placeholder="Ajoute un tag…" />
            <button type="button" onClick={() => addTag(tagInput)} className="btn-outline shrink-0">+</button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedTags.filter((t) => !tags.includes(t)).slice(0, 8).map((t) => (
              <button key={t} type="button" onClick={() => addTag(t)} className="chip bg-sand-100 text-sand-800 hover:bg-sand-200 dark:bg-night-700 dark:text-sand-200">+ {t}</button>
            ))}
          </div>
        </section>

        <button type="submit" className="btn-primary w-full text-base" disabled={busy || uploading}>
          {busy ? "Publication…" : "Publier mon annonce 🚀"}
        </button>
      </form>
    </div>
  );
}
