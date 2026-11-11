import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: {
          category: true,
          seller: { select: { name: true, region: true, island: true } },
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    favorites: favorites.map((f) => ({
      ...f,
      listing: {
        ...f.listing,
        photos: JSON.parse(f.listing.photos || "[]"),
        available: f.listing.status === "active",
      },
    })),
  });
}
