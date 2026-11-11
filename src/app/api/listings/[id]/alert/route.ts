import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";

// "Notifie-moi quand c'est disponible" (article épuisé).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ ok: false, error: "Annonce introuvable." }, { status: 404 });

  const existing = await prisma.stockAlert.findUnique({
    where: { userId_listingId: { userId: user.id, listingId: listing.id } },
  });
  if (existing) {
    await prisma.stockAlert.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, active: false, message: "Alerte annulée." });
  }

  await prisma.stockAlert.create({ data: { userId: user.id, listingId: listing.id } });
  return NextResponse.json({
    ok: true,
    active: true,
    message: "C'est noté ! On te préviendra dès que ce sera disponible. 😊",
  });
}
