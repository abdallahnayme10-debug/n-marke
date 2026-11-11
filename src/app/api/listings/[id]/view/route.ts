import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Incrémente le compteur de vues + journalisation par jour (stats vendeur).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ ok: false }, { status: 404 });

  await prisma.listing.update({ where: { id: listing.id }, data: { views: { increment: 1 } } });

  const dateKey = new Date().toISOString().slice(0, 10);
  const existing = await prisma.viewLog.findUnique({
    where: { listingId_date: { listingId: listing.id, date: dateKey } },
  });
  if (existing) {
    await prisma.viewLog.update({ where: { id: existing.id }, data: { count: { increment: 1 } } });
  } else {
    await prisma.viewLog.create({ data: { listingId: listing.id, date: dateKey, count: 1 } });
  }

  return NextResponse.json({ ok: true, views: listing.views + 1 });
}
