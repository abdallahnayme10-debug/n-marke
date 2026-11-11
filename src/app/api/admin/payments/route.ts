import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

// Paiements en attente de validation (admin).
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const payments = await prisma.payment.findMany({
    where: { status: "en_attente" },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, phone: true } } },
  });

  return NextResponse.json({ ok: true, payments });
}
