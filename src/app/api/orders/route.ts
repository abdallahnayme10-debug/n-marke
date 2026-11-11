import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";
import { notify } from "@/lib/notifications";

// Créer une commande (acheteur) / lister les commandes (acheteur ou vendeur).
export async function GET(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const url = new URL(req.url);
  const role = url.searchParams.get("role") || "buyer";

  const orders = await prisma.order.findMany({
    where: role === "seller" ? { sellerId: user.id } : { buyerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { id: true, title: true, slug: true, photos: true, price: true, articleNumber: true } },
      buyer: { select: { id: true, name: true, phone: true, region: true, island: true, profilePhoto: true } },
      seller: { select: { id: true, name: true, phone: true, region: true, island: true, profilePhoto: true } },
      deliveries: true,
    },
  });

  return NextResponse.json({
    ok: true,
    orders: orders.map((o) => ({
      ...o,
      listing: { ...o.listing, photos: JSON.parse(o.listing.photos || "[]") },
    })),
  });
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const listingId = body?.listingId;
  const quantity = Number(body?.quantity) || 1;
  const deliveryRequested = Boolean(body?.deliveryRequested);
  const deliveryAddress = body?.deliveryAddress || "";
  const deliveryPhone = body?.deliveryPhone || "";

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "active") {
    return NextResponse.json({ ok: false, error: "Cette annonce n'est plus disponible." }, { status: 404 });
  }
  if (listing.sellerId === user.id) {
    return NextResponse.json({ ok: false, error: "Tu ne peux pas commander ta propre annonce." }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      listingId: listing.id,
      buyerId: user.id,
      sellerId: listing.sellerId,
      quantity,
      total: listing.price ? listing.price * quantity : null,
      deliveryRequested,
      deliveryAddress,
      deliveryPhone,
    },
  });

  await notify({
    userId: listing.sellerId,
    type: "order",
    title: "Nouvelle commande ! 🛒",
    body: `${user.name} a commandé « ${listing.title} ».`,
    link: "/commandes",
    sms: true,
    smsMessage: `N-marke : ${user.name} a commandé « ${listing.title} ». Connecte-toi pour confirmer.`,
  });

  return NextResponse.json({ ok: true, order, message: "Commande envoyée au vendeur !" });
}
