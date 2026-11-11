import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, requireVerifiedUser } from "@/lib/api";

// Lister les livreurs disponibles, avec note moyenne et nb de livraisons.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const island = url.searchParams.get("island") || undefined;
  const region = url.searchParams.get("region") || undefined;

  const couriers = await prisma.user.findMany({
    where: { isCourier: true, ...(island ? { island } : {}), ...(region ? { region } : {}) },
    select: {
      id: true, name: true, profilePhoto: true, island: true, region: true, isCourier: true,
      _count: { select: { deliveries: { where: { status: "livre" } } } },
    },
  });

  // Note moyenne : on utilise les avis reçus en tant que livreur (via Review sellerId)
  const withRating = await Promise.all(
    couriers.map(async (c) => {
      const reviews = await prisma.review.findMany({ where: { sellerId: c.id }, select: { rating: true } });
      const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
      return { ...c, deliveriesCount: c._count.deliveries, rating: Math.round(avg * 10) / 10, reviewsCount: reviews.length };
    })
  );

  return NextResponse.json({ ok: true, couriers: withRating });
}

// S'inscrire comme livreur.
export async function POST(req: Request) {
  const { user, error } = await requireVerifiedUser();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const availability = body?.availability || "temps plein";
  if (!["temps plein", "temps partiel", "weekends"].includes(availability)) {
    return NextResponse.json({ ok: false, error: "Choisis une disponibilité valide." }, { status: 400 });
  }
  if (!user.island || !user.region) {
    return NextResponse.json(
      { ok: false, error: "Renseigne d'abord ton île et ta région dans ton profil." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isCourier: true, role: user.role === "admin" ? "admin" : "courier" },
  });

  return NextResponse.json({ ok: true, message: "Bienvenue parmi les livreurs N-marke ! 🏍️" });
}
