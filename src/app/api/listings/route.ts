import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireVerifiedUser } from "@/lib/api";
import { searchListings, logTextSearch } from "@/lib/search";
import { toSlug } from "@/lib/format";
import { canPostListing } from "@/lib/billing";
import { REGIONS, SUGGESTED_TAGS } from "@/lib/constants";

// ── RECHERCHE ──────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const result = await searchListings({
    q: sp.get("q") || undefined,
    island: sp.get("island") || undefined,
    region: sp.get("region") || undefined,
    category: sp.get("category") || undefined,
    type: sp.get("type") || undefined,
    minPrice: sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined,
    maxPrice: sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
    delivery: sp.get("delivery") === "1" || sp.get("delivery") === "true",
    brand: sp.get("brand") || undefined,
    model: sp.get("model") || undefined,
    sort: (sp.get("sort") as never) || "recent",
    featured: sp.get("featured") === "1",
    sellerTier: sp.get("sellerTier") || undefined,
    page: sp.get("page") ? Number(sp.get("page")) : 1,
    limit: sp.get("limit") ? Math.min(Number(sp.get("limit")), 48) : 20,
  });
  if (sp.get("q")) logTextSearch(sp.get("q") || "");
  return NextResponse.json({ ok: true, ...result });
}

// ── PUBLICATION ────────────────────────────────────────────────────────
const createSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(4000),
  price: z.number().int().min(0).nullable().optional(),
  negotiable: z.boolean().optional(),
  type: z.string().default("disponible"),
  categoryId: z.string(),
  subcategoryId: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  articleNumber: z.string().optional().nullable(),
  quantity: z.number().int().min(1).default(1),
  size: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
  island: z.string(),
  region: z.string(),
  neighborhood: z.string().optional().nullable(),
  deliveryAvailable: z.boolean().default(false),
  deliveryZones: z.string().optional().nullable(),
  deliveryFeePaidBy: z.string().optional().nullable(),
  deliveryTime: z.string().optional().nullable(),
  orderLeadTime: z.string().optional().nullable(),
  orderDeposit: z.boolean().optional(),
  orderDepositPct: z.number().int().optional().nullable(),
  orderDeadline: z.string().optional().nullable(),
  orderMinQty: z.number().int().optional().nullable(),
  photos: z.array(z.string()).max(6),
  tags: z.array(z.string()).max(10).optional(),
});

function genArticleNumber(existing: Set<string>): string {
  let n = Math.floor(10000 + Math.random() * 90000);
  while (existing.has(`NMK-${n}`)) n = Math.floor(10000 + Math.random() * 90000);
  return `NMK-${n}`;
}

export async function POST(req: Request) {
  const { user, error } = await requireVerifiedUser();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Oups, vérifie les informations de ton annonce." }, { status: 400 });
  }
  const d = parsed.data;

  if (!REGIONS[d.island] || !REGIONS[d.island].includes(d.region)) {
    return NextResponse.json({ ok: false, error: "Choisis une île et une région valides." }, { status: 400 });
  }

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser) return NextResponse.json({ ok: false, error: "Compte introuvable." }, { status: 404 });
  if (!(await canPostListing(fullUser))) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Tu as atteint la limite d'annonces pour ton profil. Passe au niveau supérieur pour en publier plus !",
      },
      { status: 403 }
    );
  }

  // Slug unique
  let slug = toSlug(d.title) || "annonce";
  const baseSlug = slug;
  let i = 1;
  while (await prisma.listing.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++i}`;
  }

  // Numéro d'article (NMK-XXXXX) : personnalisé ou généré
  let articleNumber: string;
  if (d.articleNumber && /^[A-Za-z0-9-]{3,20}$/.test(d.articleNumber)) {
    articleNumber = d.articleNumber.toUpperCase();
    const clash = await prisma.listing.findUnique({ where: { articleNumber } });
    if (clash) return NextResponse.json({ ok: false, error: "Ce numéro d'article existe déjà." }, { status: 409 });
  } else {
    const existing = new Set(
      (await prisma.listing.findMany({ select: { articleNumber: true } })).map((l) => l.articleNumber)
    );
    articleNumber = genArticleNumber(existing);
  }

  // Expiration 30 j pour les ventes entre particuliers
  const expiresAt =
    d.type === "particulier" ? new Date(Date.now() + 30 * 86400000) : undefined;

  // Tags suggérés si aucun fourni
  const category = await prisma.category.findUnique({ where: { id: d.categoryId } });
  const tags = d.tags?.length ? d.tags : (SUGGESTED_TAGS[category?.name || ""] || SUGGESTED_TAGS.default).slice(0, 6);

  const listing = await prisma.listing.create({
    data: {
      title: d.title,
      slug,
      description: d.description,
      price: d.price ?? null,
      negotiable: d.negotiable ?? false,
      type: d.type,
      categoryId: d.categoryId,
      subcategoryId: d.subcategoryId || null,
      brand: d.brand || null,
      model: d.model || null,
      articleNumber,
      quantity: d.quantity,
      size: d.size || null,
      color: d.color || null,
      condition: d.condition || null,
      island: d.island,
      region: d.region,
      neighborhood: d.neighborhood || null,
      deliveryAvailable: d.deliveryAvailable,
      deliveryZones: d.deliveryZones || null,
      deliveryFeePaidBy: d.deliveryFeePaidBy || null,
      deliveryTime: d.deliveryTime || null,
      orderLeadTime: d.orderLeadTime || null,
      orderDeposit: d.orderDeposit ?? false,
      orderDepositPct: d.orderDepositPct ?? null,
      orderDeadline: d.orderDeadline ? new Date(d.orderDeadline) : null,
      orderMinQty: d.orderMinQty ?? null,
      photos: JSON.stringify(d.photos),
      tags: JSON.stringify(tags),
      expiresAt,
      sellerId: user.id,
    },
  });

  return NextResponse.json({
    ok: true,
    listing,
    message: "Super, ton annonce est en ligne ! 🎉",
  });
}
