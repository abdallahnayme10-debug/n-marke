import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";
import { notify } from "@/lib/notifications";
import { ORDER_STATUSES } from "@/lib/constants";

const FLOW = ["recue", "confirmee", "preparation", "livraison", "livree"];

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      listing: true,
      buyer: { select: { id: true, name: true, phone: true, region: true, island: true, profilePhoto: true } },
      seller: { select: { id: true, name: true, phone: true, region: true, island: true, profilePhoto: true } },
      deliveries: { include: { courier: { select: { id: true, name: true, phone: true, profilePhoto: true } } } },
    },
  });

  if (!order || (order.buyerId !== user.id && order.sellerId !== user.id && user.role !== "admin")) {
    return NextResponse.json({ ok: false, error: "Commande introuvable." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ ok: false, error: "Commande introuvable." }, { status: 404 });

  const isSeller = order.sellerId === user.id;
  const isBuyer = order.buyerId === user.id;
  if (!isSeller && !isBuyer && user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Action non autorisée." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status;

  // Vendeur : confirmer / refuser / avancer le statut. Acheteur : annuler.
  if (isBuyer && status === "annulee") {
    await prisma.order.update({ where: { id: order.id }, data: { status: "annulee" } });
    await notify({
      userId: order.sellerId,
      type: "order",
      title: "Commande annulée",
      body: "L'acheteur a annulé la commande.",
    });
    return NextResponse.json({ ok: true, message: "Commande annulée." });
  }

  if (!ORDER_STATUSES[status]) {
    return NextResponse.json({ ok: false, error: "Statut invalide." }, { status: 400 });
  }

  await prisma.order.update({ where: { id: order.id }, data: { status } });

  const otherId = isSeller ? order.buyerId : order.sellerId;
  await notify({
    userId: otherId,
    type: "order",
    title: "Mise à jour de commande",
    body: `Statut : ${ORDER_STATUSES[status].label} ${ORDER_STATUSES[status].emoji}`,
    sms: status === "confirmee" || status === "livree",
    smsMessage: `N-marke : ${ORDER_STATUSES[status].label}.`,
  });

  return NextResponse.json({ ok: true, message: "Statut mis à jour !" });
}
