import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Suggestions d'autocomplétion pendant la frappe.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ ok: true, suggestions: [] });

  const term = q;

  const [titles, categories, brands] = await Promise.all([
    prisma.listing.findMany({
      where: { title: { contains: term, mode: "insensitive" }, status: "active" },
      select: { title: true, slug: true },
      distinct: ["title"],
      take: 6,
    }),
    prisma.category.findMany({
      where: { name: { contains: term, mode: "insensitive" } },
      select: { name: true, slug: true, icon: true },
      take: 4,
    }),
    prisma.listing.findMany({
      where: { brand: { contains: term, mode: "insensitive" }, status: "active" },
      select: { brand: true },
      distinct: ["brand"],
      take: 4,
    }),
  ]);

  return NextResponse.json({
    ok: true,
    suggestions: [
      ...titles.map((t) => ({ type: "produit", label: t.title, href: `/annonce/${t.slug}` })),
      ...categories.map((c) => ({ type: "catégorie", label: c.name, href: `/recherche?category=${c.slug}`, icon: c.icon })),
      ...brands.filter((b) => b.brand).map((b) => ({ type: "marque", label: `Marque : ${b.brand}`, href: `/recherche?q=${encodeURIComponent(b.brand!)}` })),
    ],
  });
}
