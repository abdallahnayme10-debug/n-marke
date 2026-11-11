import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Historique récent (utilisateur connecté) + recherches populaires (global).
export async function GET() {
  const me = await getCurrentUser();

  const [recent, popular] = await Promise.all([
    prisma.searchLog.findMany({
      where: me ? { userId: me.id, type: "text" } : { type: "text", userId: null },
      orderBy: { createdAt: "desc" },
      distinct: ["query"],
      take: 8,
      select: { query: true },
    }),
    prisma.searchLog.groupBy({
      by: ["query"],
      where: { type: "text" },
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 8,
    }),
  ]);

  return NextResponse.json({
    ok: true,
    recent: recent.map((r) => r.query),
    popular: popular.map((p) => ({ query: p.query, count: p._count.query })),
  });
}
