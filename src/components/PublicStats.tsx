"use client";

import { useEffect, useRef, useState } from "react";

type Stats = {
  activeListings: number;
  users: number;
  deliveries: number;
  regionsCovered: number;
};

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let start: number | null = null;
    let raf: number;
    function step(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function Stat({ value, label, emoji }: { value: number; label: string; emoji: string }) {
  const count = useCountUp(value);
  return (
    <div className="text-center">
      <div className="text-3xl">{emoji}</div>
      <div className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">{count.toLocaleString("fr-FR")}</div>
      <div className="mt-1 text-sm font-semibold text-white/80">{label}</div>
    </div>
  );
}

export default function PublicStats({ stats }: { stats: Stats }) {
  return (
    <section className="mx-auto mt-16 max-w-6xl px-4">
      <div className="rounded-4xl bg-gradient-to-br from-ocean-600 to-leaf-600 p-8 shadow-soft-lg sm:p-12">
        <h2 className="text-center text-xl font-bold text-white sm:text-2xl">Une communauté qui grandit chaque jour 🌱</h2>
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat value={stats.activeListings} label="Annonces actives" emoji="🛍️" />
          <Stat value={stats.users} label="Utilisateurs inscrits" emoji="👥" />
          <Stat value={stats.deliveries} label="Livraisons effectuées" emoji="🏍️" />
          <Stat value={stats.regionsCovered} label="Régions couvertes" emoji="📍" />
        </div>
      </div>
    </section>
  );
}
