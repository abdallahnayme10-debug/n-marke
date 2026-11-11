import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api";
import { notify } from "@/lib/notifications";

// Lister les utilisateurs (admin).
export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const take = Math.min(Number(url.searchParams.get("limit")) || 200, 500);

  const users = await prisma.user.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }] } : {},
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true, name: true, phone: true, isVerified: true, island: true, region: true,
      sellerTier: true, isCourier: true, role: true, lockedUntil: true, loginAttempts: true,
      createdAt: true,
      _count: { select: { listings: true, ordersBuyer: true, reportsOn: { where: { status: "ouvert" } } } },
    },
  });

  return NextResponse.json({ ok: true, users });
}

// Débloquer manuellement un compte (après 5 échecs).
export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (body?.action === "unblock" && body?.userId) {
    await prisma.user.update({ where: { id: body.userId }, data: { lockedUntil: null, loginAttempts: 0 } });
    await notify({ userId: body.userId, type: "account", title: "Compte débloqué ✅", body: "Ton compte est de nouveau accessible." });
    return NextResponse.json({ ok: true, message: "Compte débloqué." });
  }

  if (body?.action === "change-number" && body?.userId && body?.newPhone) {
    await prisma.user.update({ where: { id: body.userId }, data: { phone: body.newPhone } });
    return NextResponse.json({ ok: true, message: "Numéro changé." });
  }

  return NextResponse.json({ ok: false, error: "Action invalide." }, { status: 400 });
}
