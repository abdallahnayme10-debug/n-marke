import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";

// Fil de discussion avec un utilisateur donné.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const other = await prisma.user.findUnique({ where: { id: params.id } });
  if (!other) return NextResponse.json({ ok: false, error: "Utilisateur introuvable." }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: other.id },
        { senderId: other.id, receiverId: user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  // Marquer comme lu les messages reçus
  await prisma.message.updateMany({
    where: { senderId: other.id, receiverId: user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true, other, messages });
}
