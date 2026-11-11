import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";

// Mes notifications (in-app).
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);

  return NextResponse.json({ ok: true, notifications, unread });
}

// Marquer comme lues.
export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (body?.all) {
    await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  } else if (body?.id) {
    await prisma.notification.updateMany({ where: { id: body.id, userId: user.id }, data: { read: true } });
  }

  return NextResponse.json({ ok: true });
}
