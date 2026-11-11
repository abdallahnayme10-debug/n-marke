import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Catégories avec compteurs d'annonces actives + sous-catégories.
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sort: "asc" },
    include: {
      subcategories: { orderBy: { name: "asc" } },
      _count: { select: { listings: { where: { status: "active" } } } },
    },
  });

  return NextResponse.json({
    ok: true,
    categories: categories.map((c) => ({ ...c, count: c._count.listings })),
  });
}
