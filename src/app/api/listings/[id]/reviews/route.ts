import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";

// Avis avec note en étoiles (1 à 5) — réservé aux acheteurs ayant une commande livrée chez ce vendeur.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ ok: false, error: "Annonce introuvable." }, { status: 404 });
  if (listing.sellerId === user.id) {
    return NextResponse.json({ ok: false, error: "Tu ne peux pas noter ta propre annonce." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const rating = Number(body?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ ok: false, error: "Donne une note entre 1 et 5 étoiles." }, { status: 400 });
  }

  const hasPurchased = await prisma.order.findFirst({
    where: { buyerId: user.id, sellerId: listing.sellerId, status: "livree" },
  });
  if (!hasPurchased && user.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Seuls les acheteurs ayant reçu une commande de ce vendeur peuvent le noter." },
      { status: 403 }
    );
  }

  const review = await prisma.review.create({
    data: {
      listingId: listing.id,
      authorId: user.id,
      sellerId: listing.sellerId,
      rating,
      comment: (body?.comment || "").trim().slice(0, 1000),
    },
  });

  return NextResponse.json({ ok: true, review, message: "Merci pour ton avis ! ⭐" });
}
