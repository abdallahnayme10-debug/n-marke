import { prisma } from "./db";
import { Prisma } from "@prisma/client";

export type SearchFilters = {
  q?: string;
  island?: string;
  region?: string;
  category?: string; // slug
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  delivery?: boolean;
  brand?: string;
  model?: string;
  sort?: "recent" | "price-asc" | "price-desc" | "popular" | "rating";
  featured?: boolean;
  sellerTier?: string;
  excludeId?: string;
  page?: number;
  limit?: number;
  // pour "articles similaires" : similarTo listingId
  similarTo?: string;
};

export async function searchListings(filters: SearchFilters) {
  const {
    q,
    island,
    region,
    category,
    type,
    minPrice,
    maxPrice,
    delivery,
    brand,
    model,
    sort = "recent",
    featured,
    sellerTier,
    excludeId,
    page = 1,
    limit = 20,
    similarTo,
  } = filters;

  const where: Prisma.ListingWhereInput = {
    status: "active",
  };

  if (excludeId) where.id = { not: excludeId };

  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { brand: { contains: term, mode: "insensitive" } },
      { model: { contains: term, mode: "insensitive" } },
      { articleNumber: { contains: term, mode: "insensitive" } },
      { tags: { contains: term, mode: "insensitive" } },
      { category: { name: { contains: term, mode: "insensitive" } } },
      { subcategory: { name: { contains: term, mode: "insensitive" } } },
    ];
  }

  if (island) where.island = island;
  if (region) where.region = region;
  if (type) where.type = type;
  if (category) where.category = { slug: category };
  if (delivery) where.deliveryAvailable = true;
  if (brand) where.brand = { contains: brand, mode: "insensitive" };
  if (model) where.model = { contains: model, mode: "insensitive" };
  if (featured) {
    where.isFeatured = true;
    where.featuredUntil = { gt: new Date() };
  }
  if (sellerTier) where.seller = { sellerTier: sellerTier };
  if (minPrice != null || maxPrice != null) {
    where.price = {
      ...(minPrice != null ? { gte: minPrice } : {}),
      ...(maxPrice != null ? { lte: maxPrice } : {}),
    };
  }

  // Articles similaires : même catégorie / île, prix proche, marque si dispo
  if (similarTo) {
    const source = await prisma.listing.findUnique({ where: { id: similarTo } });
    if (source) {
      const or: Prisma.ListingWhereInput[] = [{ categoryId: source.categoryId }];
      if (source.brand && source.brand.length > 0) or.push({ brand: source.brand });
      if (source.region) or.push({ region: source.region });
      where.OR = or;
    }
  }

  const orderBy: Prisma.ListingOrderByWithRelationInput[] = [];
  if (featured) {
    orderBy.push({ isFeatured: "desc" });
  }
  switch (sort) {
    case "price-asc":
      orderBy.push({ price: "asc" });
      break;
    case "price-desc":
      orderBy.push({ price: "desc" });
      break;
    case "popular":
      orderBy.push({ views: "desc" });
      break;
    default:
      orderBy.push({ createdAt: "desc" });
  }

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: true,
        seller: { select: { id: true, name: true, region: true, island: true, sellerTier: true, profilePhoto: true } },
        _count: { select: { favorites: true } },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  return { items, total, page, pages: Math.ceil(total / limit) };
}

export async function logTextSearch(query: string, userId?: string, island?: string) {
  if (!query.trim()) return;
  await prisma.searchLog.create({ data: { query: query.trim(), type: "text", island, userId } });
}
