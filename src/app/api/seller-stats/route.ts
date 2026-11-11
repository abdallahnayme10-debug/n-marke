import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";

// Statistiques détaillées du vendeur (par annonce + global).
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const listings = await prisma.listing.findMany({
    where: { sellerId: user.id },
    orderBy: { views: "desc" },
    include: {
      category: true,
      _count: { select: { favorites: true, orders: true, comments: true } },
    },
  });

  const perListing = await Promise.all(
    listings.map(async (l) => {
      const [viewLogs, deliveryRequests, contacts] = await Promise.all([
        prisma.viewLog.findMany({ where: { listingId: l.id }, orderBy: { date: "asc" } }),
        prisma.order.count({ where: { listingId: l.id, deliveryRequested: true } }),
        prisma.message.count({ where: { listingId: l.id } }),
      ]);
      return {
        id: l.id,
        title: l.title,
        articleNumber: l.articleNumber,
        views: l.views,
        favorites: l._count.favorites,
        contacts,
        deliveryRequests,
        orders: l._count.orders,
        viewLogs,
      };
    })
  );

  const totalSales = await prisma.order.count({
    where: { sellerId: user.id, status: "livree" },
  });

  // Catégorie qui marche le mieux
  const byCategory = await prisma.listing.groupBy({
    by: ["categoryId"],
    where: { sellerId: user.id },
    _sum: { views: true },
    orderBy: { _sum: { views: "desc" } },
    take: 1,
  });
  const bestCategory = byCategory[0]
    ? await prisma.category.findUnique({ where: { id: byCategory[0].categoryId } })
    : null;

  return NextResponse.json({
    ok: true,
    stats: {
      perListing,
      totalSales,
      totalListings: listings.length,
      mostPopular: listings[0] ? { title: listings[0].title, views: listings[0].views } : null,
      bestCategory: bestCategory?.name || null,
    },
  });
}
