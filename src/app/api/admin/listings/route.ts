import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

// Annonces signalées + celles qui expirent bientôt (admin).
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [reported, expiring] = await Promise.all([
    prisma.listing.findMany({
      where: { reports: { some: { status: "ouvert" } } },
      include: { category: true, seller: { select: { name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.listing.findMany({
      where: { status: "active", expiresAt: { lte: new Date(Date.now() + 3 * 86400000), not: null } },
      include: { category: true },
      orderBy: { expiresAt: "asc" },
    }),
  ]);

  return NextResponse.json({ ok: true, reported, expiring });
}
