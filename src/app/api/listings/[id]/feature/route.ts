import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireVerifiedUser } from "@/lib/api";
import { isFreePeriod } from "@/lib/billing";

// Mettre une annonce en avant.
// Pendant la période gratuite : gratuit. Après : crée un paiement à valider.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireVerifiedUser();
  if (error) return error;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing || listing.sellerId !== user.id) {
    return NextResponse.json({ ok: false, error: "Annonce introuvable." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const days = Number(body?.days) || 7;

  if (await isFreePeriod()) {
    await prisma.listing.update({
      where: { id: listing.id },
      data: { isFeatured: true, featuredUntil: new Date(Date.now() + days * 86400000) },
    });
    return NextResponse.json({
      ok: true,
      message: `Ton annonce est mise en avant pendant ${days} jours (offert pendant la période gratuite !). 🎉`,
    });
  }

  // Après la période gratuite : paiement requis
  const prices: Record<number, number> = { 3: 500, 7: 1000, 30: 2500 };
  const amount = prices[days] || 1000;
  await prisma.payment.create({
    data: {
      userId: user.id,
      service: "feature",
      description: `Mise en avant ${days} jours — « ${listing.title} »`,
      amount,
      method: "mvola",
    },
  });

  return NextResponse.json({
    ok: true,
    requiresPayment: true,
    amount,
    message: `Pour mettre ton annonce en avant ${days} jours, il faut payer ${amount} KMF. Va dans « Paiements » pour valider.`,
  });
}
