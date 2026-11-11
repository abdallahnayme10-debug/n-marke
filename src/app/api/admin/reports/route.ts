import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api";
import { notify } from "@/lib/notifications";

// Litiges : lister (ouverts / résolus) et résoudre.
export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "ouvert";

  const reports = await prisma.report.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { id: true, name: true, phone: true } },
      against: { select: { id: true, name: true, phone: true } },
      listing: { select: { title: true, slug: true } },
    },
  });

  return NextResponse.json({ ok: true, reports });
}

export async function PATCH(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const { id, resolution } = body;

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ ok: false, error: "Litige introuvable." }, { status: 404 });

  await prisma.report.update({
    where: { id },
    data: { status: "resolu", resolution: resolution || "Traité par l'équipe N-marke.", resolvedAt: new Date() },
  });

  await notify({
    userId: report.reporterId,
    type: "dispute",
    title: "Litige résolu",
    body: resolution || "L'équipe N-marke a traité ton signalement.",
  });

  return NextResponse.json({ ok: true, message: "Litige résolu." });
}
