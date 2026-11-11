import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

// Bannières promotionnelles (admin) : lister / créer.
export async function GET() {
  const banners = await prisma.banner.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ok: true, banners });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.message) {
    return NextResponse.json({ ok: false, error: "Titre et message requis." }, { status: 400 });
  }

  const banner = await prisma.banner.create({
    data: {
      title: body.title,
      message: body.message,
      categoryId: body.categoryId || null,
      color: body.color || "#C8963E",
      emoji: body.emoji || "🎉",
      active: body.active !== false,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  });

  return NextResponse.json({ ok: true, banner, message: "Bannière créée !" });
}
