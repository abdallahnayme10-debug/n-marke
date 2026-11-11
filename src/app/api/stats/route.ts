import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { REGIONS } from "@/lib/constants";
import { getFreePeriodDaysRemaining, getFreePeriodMode } from "@/lib/billing";

export const dynamic = "force-dynamic";

// Statistiques publiques affichées sur la page d'accueil.
export async function GET() {
  const [activeListings, users, deliveries, freeDays, freeMode] = await Promise.all([
    prisma.listing.count({ where: { status: "active" } }),
    prisma.user.count(),
    prisma.delivery.count({ where: { status: "livre" } }),
    getFreePeriodDaysRemaining(),
    getFreePeriodMode(),
  ]);

  // Nombre de régions couvertes (régions où il y a au moins une annonce active)
  const regions = await prisma.listing.groupBy({ by: ["region"], where: { status: "active" } });

  return NextResponse.json({
    ok: true,
    stats: {
      activeListings,
      users,
      deliveries,
      regionsCovered: regions.length,
      freeDays: Math.max(0, freeDays),
      freePeriodActive: freeMode === "indefinite" || freeDays > 0,
      freePeriodIndefinite: freeMode === "indefinite",
      totalRegions: Object.values(REGIONS).flat().length,
    },
  });
}
