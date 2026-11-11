import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";
import { notify } from "@/lib/notifications";

// Lister les livraisons (selon le rôle) / créer une demande de livraison.
export async function GET(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const url = new URL(req.url);
  const role = url.searchParams.get("role") || "courier";

  const where =
    role === "courier"
      ? { courierId: user.id }
      : role === "seller"
        ? { sellerId: user.id }
        : { buyerId: user.id };

  const deliveries = await prisma.delivery.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      courier: { select: { id: true, name: true, phone: true, profilePhoto: true } },
      order: { include: { listing: { select: { title: true, slug: true, photos: true } } } },
    },
  });

  return NextResponse.json({ ok: true, deliveries });
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const { orderId, courierId, pickupAddress, dropoffAddress, price, zone } = body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.buyerId !== user.id) {
    return NextResponse.json({ ok: false, error: "Commande introuvable." }, { status: 404 });
  }

  const courier = await prisma.user.findUnique({ where: { id: courierId } });
  if (!courier || !courier.isCourier) {
    return NextResponse.json({ ok: false, error: "Livreur introuvable." }, { status: 404 });
  }

  const delivery = await prisma.delivery.create({
    data: {
      orderId: order.id,
      courierId,
      sellerId: order.sellerId,
      buyerId: user.id,
      pickupAddress: pickupAddress || "",
      dropoffAddress: dropoffAddress || "",
      price: price ? Number(price) : null,
      zone: zone || "",
      status: "en_attente",
    },
  });

  await notify({
    userId: courierId,
    type: "delivery",
    title: "Nouvelle demande de livraison 🏍️",
    body: "Un acheteur souhaite être livré. Accepte ou refuse la course.",
    link: "/tableau-de-bord-livreur",
    sms: true,
    smsMessage: "N-marke : une nouvelle demande de livraison t'attend !",
  });

  return NextResponse.json({ ok: true, delivery, message: "Demande de livraison envoyée au livreur !" });
}
