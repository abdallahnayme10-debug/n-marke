import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function findListing(idOrSlug: string) {
  return prisma.listing.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const listing = await findListing(params.id);
  if (!listing) return NextResponse.json({ ok: false, error: "Annonce introuvable." }, { status: 404 });

  const [seller, reviews, favCount, alertCount, comments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: listing.sellerId },
      select: {
        id: true, name: true, region: true, island: true, sellerTier: true, premiumUntil: true,
        profilePhoto: true, createdAt: true, bio: true, isCourier: true,
        _count: {
          select: {
            ordersSeller: { where: { status: "livree" } },
            reportsOn: { where: { status: "ouvert" } },
          },
        },
      },
    }),
    prisma.review.findMany({ where: { sellerId: listing.sellerId }, select: { rating: true } }),
    prisma.favorite.count({ where: { listingId: listing.id } }),
    prisma.stockAlert.count({ where: { listingId: listing.id } }),
    prisma.comment.count({ where: { listingId: listing.id } }),
  ]);

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const me = await getCurrentUser();
  const isFavorite = me
    ? (await prisma.favorite.findUnique({
        where: { userId_listingId: { userId: me.id, listingId: listing.id } },
      })) != null
    : false;

  return NextResponse.json({
    ok: true,
    listing: {
      ...listing,
      photos: JSON.parse(listing.photos || "[]"),
      tags: JSON.parse(listing.tags || "[]"),
    },
    seller: seller ? { ...seller, avgRating, reviewCount: reviews.length } : null,
    favoriteCount: favCount,
    alertCount,
    commentCount: comments,
    isFavorite,
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Connecte-toi." }, { status: 401 });

  const listing = await findListing(params.id);
  if (!listing) return NextResponse.json({ ok: false, error: "Annonce introuvable." }, { status: 404 });
  if (listing.sellerId !== user.id && user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Tu ne peux modifier que tes annonces." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  const stringFields = ["title", "description", "brand", "model", "size", "color", "condition", "island", "region", "neighborhood", "deliveryZones", "deliveryFeePaidBy", "deliveryTime", "orderLeadTime"];
  for (const f of stringFields) if (typeof body?.[f] === "string") data[f] = body[f];
  if (typeof body?.price === "number" || body?.price === null) data.price = body.price;
  if (typeof body?.negotiable === "boolean") data.negotiable = body.negotiable;
  if (typeof body?.quantity === "number") data.quantity = body.quantity;
  if (typeof body?.deliveryAvailable === "boolean") data.deliveryAvailable = body.deliveryAvailable;
  if (Array.isArray(body?.photos)) data.photos = JSON.stringify(body.photos.slice(0, 6));
  if (Array.isArray(body?.tags)) data.tags = JSON.stringify(body.tags.slice(0, 10));

  // Si le stock repasse au-dessus de 0, notifier les alertes de disponibilité
  const wasOut = listing.quantity === 0;
  const nowInStock = typeof body?.quantity === "number" && body.quantity > 0;
  if (wasOut && nowInStock) {
    const alerts = await prisma.stockAlert.findMany({ where: { listingId: listing.id } });
    for (const a of alerts) {
      await prisma.notification.create({
        data: {
          userId: a.userId,
          type: "stock",
          title: "L'article est de retour ! 🎉",
          body: `L'article « ${listing.title} » est de nouveau disponible sur N-marke !`,
          link: `/annonce/${listing.slug}`,
        },
      });
    }
  }

  const updated = await prisma.listing.update({ where: { id: listing.id }, data });
  return NextResponse.json({ ok: true, listing: updated, message: "Annonce mise à jour !" });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Connecte-toi." }, { status: 401 });

  const listing = await findListing(params.id);
  if (!listing) return NextResponse.json({ ok: false, error: "Annonce introuvable." }, { status: 404 });
  if (listing.sellerId !== user.id && user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Tu ne peux supprimer que tes annonces." }, { status: 403 });
  }

  await prisma.listing.update({ where: { id: listing.id }, data: { status: "disabled" } });
  return NextResponse.json({ ok: true, message: "Annonce retirée." });
}
