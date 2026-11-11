import Link from "next/link";
import { prisma } from "@/lib/db";
import { REGIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const ISLAND_META: Record<string, { label: string; emoji: string; color: string }> = {
  "grande-comore": { label: "Grande Comore", emoji: "🌋", color: "from-ocean-400 to-ocean-600" },
  anjouan: { label: "Anjouan", emoji: "🏝️", color: "from-leaf-400 to-leaf-600" },
  moheli: { label: "Mohéli", emoji: "🌴", color: "from-sand-400 to-sand-600" },
};

export default async function CartePage() {
  const groups = await prisma.listing.groupBy({
    by: ["island", "region"],
    where: { status: "active" },
    _count: { id: true },
  });

  const couriers = await prisma.user.groupBy({
    by: ["island", "region"],
    where: { isCourier: true },
    _count: { id: true },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-extrabold text-ocean-900 dark:text-white">Carte des vendeurs 🗺️</h1>
      <p className="mb-8 text-neutral-500">Explore les annonces et les livreurs par île et par région.</p>

      <div className="space-y-8">
        {Object.entries(ISLAND_META).map(([key, meta]) => (
          <div key={key} className={`rounded-4xl bg-gradient-to-br ${meta.color} p-6 shadow-soft`}>
            <h2 className="mb-4 text-xl font-bold text-white">{meta.emoji} {meta.label}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(REGIONS[key] || []).map((region) => {
                const listings = groups.find((g) => g.island === key && g.region === region)?._count.id || 0;
                const livreurs = couriers.find((c) => c.island === key && c.region === region)?._count.id || 0;
                return (
                  <Link
                    key={region}
                    href={`/recherche?island=${key}&region=${encodeURIComponent(region)}`}
                    className="rounded-2xl bg-white/95 p-4 transition-transform hover:-translate-y-1 hover:shadow-warm"
                  >
                    <p className="font-bold text-ocean-900">📍 {region}</p>
                    <p className="text-sm text-neutral-500">
                      {listings} annonce{listings > 1 ? "s" : ""} · {livreurs} livreur{livreurs > 1 ? "s" : ""}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
