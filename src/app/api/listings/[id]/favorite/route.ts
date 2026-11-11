import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";
import { notify } from "@/lib/notifications";

// Ajoute / retire un favori (bascule). Retourne le nouvel état.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ ok: false, error: "Annonce introuvable." }, { status: 404 });

  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: user.id, listingId: listing.id } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, isFavorite: false, message: "Retiré de tes favoris." });
  }

  await prisma.favorite.create({ data: { userId: user.id, listingId: listing.id } });

  // Alerte de baisse de prix : notifier le vendeur qu'il y a de l'intérêt
  if (listing.sellerId !== user.id) {
    await notify({
      userId: listing.sellerId,
      type: "favorite",
      title: "Quelqu'un est intéressé par ton article ! ❤️",
      body: `« ${listing.title} » vient d'être ajouté aux favoris.`,
      link: `/annonce/${listing.slug}`,
    });
  }

  return NextResponse.json({ ok: true, isFavorite: true, message: "Ajouté à tes favoris ! ❤️" });
}
