import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api";

// Modifier / supprimer / basculer une bannière.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  if (typeof body?.title === "string") data.title = body.title;
  if (typeof body?.message === "string") data.message = body.message;
  if (typeof body?.color === "string") data.color = body.color;
  if (typeof body?.emoji === "string") data.emoji = body.emoji;
  if (typeof body?.active === "boolean") data.active = body.active;
  if (typeof body?.categoryId === "string") data.categoryId = body.categoryId;

  const banner = await prisma.banner.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true, banner });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  await prisma.banner.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true, message: "Bannière supprimée." });
}
