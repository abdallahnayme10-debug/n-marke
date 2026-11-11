"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, ISLANDS } from "@/lib/constants";

type Suggestion = { type: string; label: string; href: string; icon?: string };

export default function SearchBar({ hero = false }: { hero?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [popular, setPopular] = useState<{ query: string; count: number }[]>([]);
  const [open, setOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoStatus, setPhotoStatus] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/search/recent")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setRecent(d.recent || []);
          setPopular(d.popular || []);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => setSuggestions(d.suggestions || []))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  function submit(query?: string) {
    const term = query ?? q;
    router.push(`/recherche?q=${encodeURIComponent(term || "")}`);
    setOpen(false);
  }

  async function handlePhoto(file: File) {
    setPhotoBusy(true);
    setPhotoStatus("Analyse de ta photo… 🔍");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/search/vision", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem("nmarke-vision", JSON.stringify({ analysis: data.analysis, items: data.items, message: data.message }));
        router.push("/recherche?vision=1");
      } else {
        setPhotoStatus(data.error || "Oups, on n'a pas pu analyser cette photo.");
      }
    } catch {
      setPhotoStatus("Oups, une erreur est survenue.");
    } finally {
      setPhotoBusy(false);
      setPhotoOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <div className={`flex items-center gap-2 rounded-3xl border-2 border-ocean-100 bg-white p-2 shadow-soft dark:border-night-700 dark:bg-night-800 ${hero ? "sm:p-3" : ""}`}>
        <span className="pl-2 text-lg">🔍</span>
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Chercher un produit, une marque, une catégorie…"
          className="w-full bg-transparent text-sm text-ocean-900 placeholder:text-neutral-400 focus:outline-none dark:text-white sm:text-base"
        />
        <button
          onClick={() => setPhotoOpen((v) => !v)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-leaf-100 text-xl hover:bg-leaf-200 dark:bg-night-700"
          title="Rechercher par photo"
          aria-label="Rechercher par photo"
        >
          📷
        </button>
        <button onClick={() => submit()} className="btn-primary hidden shrink-0 sm:inline-flex">
          Chercher
        </button>
      </div>

      {/* Menu photo */}
      {photoOpen && (
        <div className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-3xl border border-cream-200 bg-white p-2 shadow-soft-lg dark:border-night-700 dark:bg-night-800">
          <button
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.setAttribute("capture", "environment");
                fileRef.current.click();
              }
            }}
            className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-ocean-800 hover:bg-cream-100 dark:text-ocean-100 dark:hover:bg-night-700"
          >
            📸 Prendre une photo maintenant
          </button>
          <button
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.removeAttribute("capture");
                fileRef.current.click();
              }
            }}
            className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-ocean-800 hover:bg-cream-100 dark:text-ocean-100 dark:hover:bg-night-700"
          >
            🖼️ Choisir une photo de ma galerie
          </button>
          <p className="px-4 py-2 text-xs text-neutral-400">Ta photo est analysée puis supprimée immédiatement.</p>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
      />

      {/* Statut analyse photo */}
      {photoBusy && <p className="mt-2 text-center text-sm font-semibold text-ocean-600 dark:text-ocean-300">{photoStatus}</p>}

      {/* Dropdown suggestions / récent / populaire */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-soft-lg dark:border-night-700 dark:bg-night-800">
          {q.trim() && suggestions.length > 0 && (
            <div className="p-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQ(s.label);
                    router.push(s.href);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-2xl px-4 py-2.5 text-left text-sm text-ocean-800 hover:bg-cream-100 dark:text-ocean-100 dark:hover:bg-night-700"
                >
                  <span>{s.type === "catégorie" ? s.icon : s.type === "marque" ? "🏷️" : "🛍️"}</span>
                  <span className="line-clamp-1">{s.label}</span>
                </button>
              ))}
            </div>
          )}

          {!q.trim() && recent.length > 0 && (
            <div className="p-3">
              <p className="px-2 pb-1 text-xs font-bold uppercase tracking-wide text-neutral-400">Recherches récentes</p>
              <div className="flex flex-wrap gap-2">
                {recent.map((r, i) => (
                  <button key={i} onClick={() => submit(r)} className="chip bg-cream-100 text-ocean-700 hover:bg-cream-200 dark:bg-night-700 dark:text-ocean-200">
                    🕘 {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!q.trim() && popular.length > 0 && (
            <div className="border-t border-cream-100 p-3 dark:border-night-700">
              <p className="px-2 pb-1 text-xs font-bold uppercase tracking-wide text-neutral-400">Recherches populaires</p>
              <div className="flex flex-wrap gap-2">
                {popular.map((p, i) => (
                  <button key={i} onClick={() => submit(p.query)} className="chip bg-sand-100 text-sand-800 hover:bg-sand-200 dark:bg-night-700 dark:text-sand-200">
                    🔥 {p.query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtres rapides */}
      {hero && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            onChange={(e) => e.target.value && router.push(`/recherche?island=${e.target.value}`)}
            className="rounded-2xl border-2 border-cream-200 bg-white px-3 py-2 text-sm font-semibold text-ocean-800 dark:border-night-700 dark:bg-night-800 dark:text-ocean-100"
            defaultValue=""
          >
            <option value="">📍 Toutes les îles</option>
            {ISLANDS.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
          <select
            onChange={(e) => e.target.value && router.push(`/recherche?category=${e.target.value}`)}
            className="rounded-2xl border-2 border-cream-200 bg-white px-3 py-2 text-sm font-semibold text-ocean-800 dark:border-night-700 dark:bg-night-800 dark:text-ocean-100"
            defaultValue=""
          >
            <option value="">🗂️ Toutes les catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c.name} value={c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <button onClick={() => router.push("/recherche?delivery=1")} className="chip bg-leaf-100 text-leaf-700 hover:bg-leaf-200 dark:bg-night-700 dark:text-leaf-200">
            🏍️ Livraison moto
          </button>
          <button onClick={() => router.push("/recherche?type=occasion")} className="chip bg-sand-100 text-sand-800 hover:bg-sand-200 dark:bg-night-700 dark:text-sand-200">
            🟠 Occasions
          </button>
        </div>
      )}
    </div>
  );
}
