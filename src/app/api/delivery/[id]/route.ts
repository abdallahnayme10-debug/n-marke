import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";
import { notify } from "@/lib/notifications";
import { DELIVERY_STATUSES } from "@/lib/constants";

// Mise à jour du statut d'une livraison (livreur principalement).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const delivery = await prisma.delivery.findUnique({ where: { id: params.id } });
  if (!delivery) return NextResponse.json({ ok: false, error: "Livraison introuvable." }, { status: 404 });

  const isCourier = delivery.courierId === user.id;
  const isSeller = delivery.sellerId === user.id;
  const isBuyer = delivery.buyerId === user.id;
  if (!isCourier && !isSeller && !isBuyer && user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Action non autorisée." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status;

  if (status === "annulee") {
    // Le livreur refuse la course
    await prisma.delivery.update({ where: { id: delivery.id }, data: { status: "annulee" } });
    return NextResponse.json({ ok: true, message: "Course refusée." });
  }

  if (!DELIVERY_STATUSES[status]) {
    return NextResponse.json({ ok: false, error: "Statut invalide." }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { status };
  if (status === "en_route_vendeur" && !delivery.acceptedAt) updateData.acceptedAt = new Date();
  if (status === "livre") updateData.deliveredAt = new Date();

  await prisma.delivery.update({ where: { id: delivery.id }, data: updateData });

  // Notifier l'acheteur (et le vendeur) de l'avancement
  await notify({
    userId: delivery.buyerId,
    type: "delivery",
    title: "Suivi de ta livraison",
    body: `${DELIVERY_STATUSES[status].label} ${DELIVERY_STATUSES[status].emoji}`,
    sms: status === "livre" || status === "en_route_vendeur",
    smsMessage: `N-marke : ${DELIVERY_STATUSES[status].label}.`,
  });

  if (status === "livre") {
    await notify({
      userId: delivery.sellerId,
      type: "delivery",
      title: "Article livré ! 🎉",
      body: "La livraison est terminée.",
    });
  }

  return NextResponse.json({ ok: true, message: "Statut mis à jour !" });
}
