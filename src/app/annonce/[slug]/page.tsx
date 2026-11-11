import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { searchListings } from "@/lib/search";
import { toCardData } from "@/lib/serialize";
import { generateListingQr } from "@/lib/qr";
import ProductDetail from "@/components/ProductDetail";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: { params: { slug: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      subcategory: true,
      seller: { select: { id: true, name: true, region: true, island: true, sellerTier: true, premiumUntil: true, profilePhoto: true, createdAt: true, bio: true, isCourier: true } },
    },
  });

  if (!listing || (listing.status !== "active" && listing.status !== "sold")) {
    notFound();
  }

  const [reviews, comments, similar, sellerListings, alertCount, favoriteCount, openReports] = await Promise.all([
    prisma.review.findMany({
      where: { sellerId: listing.sellerId },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true, profilePhoto: true } } },
    }),
    prisma.comment.findMany({
      where: { listingId: listing.id },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true, profilePhoto: true, isCourier: true } } },
    }),
    searchListings({ similarTo: listing.id, excludeId: listing.id, limit: 8 }),
    prisma.listing.findMany({
      where: { sellerId: listing.sellerId, status: "active", id: { not: listing.id } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.stockAlert.count({ where: { listingId: listing.id } }),
    prisma.favorite.count({ where: { listingId: listing.id } }),
    prisma.report.count({ where: { againstId: listing.sellerId, status: "ouvert" } }),
  ]);

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const qrDataUrl = await generateListingQr(`${baseUrl}/annonce/${listing.slug}`);

  const data = {
    listing: {
      ...listing,
      photos: JSON.parse(listing.photos || "[]"),
      tags: JSON.parse(listing.tags || "[]"),
    },
    avgRating,
    reviewCount: reviews.length,
    reviews,
    comments,
    similar: similar.items.map(toCardData),
    sellerListings: sellerListings.map((l) => ({
      ...l,
      photos: JSON.parse(l.photos || "[]"),
    })),
    alertCount,
    favoriteCount,
    openReports,
    qrDataUrl,
  };

  return <ProductDetail data={data} />;
}
