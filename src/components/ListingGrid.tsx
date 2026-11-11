"use client";

import { useEffect, useState } from "react";
import ProductCard, { ListingCardData } from "./ProductCard";

type ViewMode = "grid" | "list";

export default function ListingGrid({ items, emptyText = "Aucune annonce pour le moment." }: { items: ListingCardData[]; emptyText?: string }) {
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    const saved = localStorage.getItem("nmarke-view");
    if (saved === "list" || saved === "grid") setView(saved);
  }, []);

  function changeView(v: ViewMode) {
    setView(v);
    localStorage.setItem("nmarke-view", v);
  }

  if (!items.length) {
    return (
      <div className="card p-10 text-center">
        <p className="text-4xl">🛍️</p>
        <p className="mt-3 font-semibold text-neutral-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-1">
        <button onClick={() => changeView("grid")} className={`grid h-10 w-10 place-items-center rounded-xl text-lg ${view === "grid" ? "bg-ocean-100 dark:bg-night-700" : "hover:bg-cream-100 dark:hover:bg-night-700"}`} aria-label="Vue grille">▦</button>
        <button onClick={() => changeView("list")} className={`grid h-10 w-10 place-items-center rounded-xl text-lg ${view === "list" ? "bg-ocean-100 dark:bg-night-700" : "hover:bg-cream-100 dark:hover:bg-night-700"}`} aria-label="Vue liste">☰</button>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((l) => (
            <ProductCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((l) => (
            <ProductCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
