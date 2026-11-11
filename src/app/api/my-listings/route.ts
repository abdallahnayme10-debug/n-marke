import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";

// Mes annonces (tableau de bord vendeur).
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const listings = await prisma.listing.findMany({
    where: { sellerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      _count: { select: { favorites: true, orders: true, stockAlerts: true, comments: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    listings: listings.map((l) => ({
      ...l,
      photos: JSON.parse(l.photos || "[]"),
      tags: JSON.parse(l.tags || "[]"),
    })),
  });
}
