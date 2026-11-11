import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";
import { notify } from "@/lib/notifications";

// Liste des conversations (utilisateurs avec qui on a échangé).
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const sent = await prisma.message.findMany({
    where: { senderId: user.id },
    select: { receiverId: true, receiver: { select: { id: true, name: true, profilePhoto: true, isCourier: true } } },
    distinct: ["receiverId"],
  });
  const received = await prisma.message.findMany({
    where: { receiverId: user.id },
    select: { senderId: true, sender: { select: { id: true, name: true, profilePhoto: true, isCourier: true } } },
    distinct: ["senderId"],
  });

  const map = new Map<string, { id: string; name: string; profilePhoto: string | null; isCourier: boolean; unread: number }>();
  for (const m of sent) map.set(m.receiverId, { ...m.receiver, unread: 0 });
  for (const m of received) {
    const unread = await prisma.message.count({ where: { senderId: m.senderId, receiverId: user.id, read: false } });
    map.set(m.senderId, { ...m.sender, unread });
  }

  return NextResponse.json({ ok: true, conversations: Array.from(map.values()) });
}

// Envoyer un message (texte + photo possible).
export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const receiverId = body?.receiverId;
  const text = (body?.body || "").trim();
  const image = body?.image || null;
  const listingId = body?.listingId || null;

  if (!receiverId || (!text && !image)) {
    return NextResponse.json({ ok: false, error: "Écris un message ou joins une photo." }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { senderId: user.id, receiverId, body: text || null, image, listingId },
  });

  await notify({
    userId: receiverId,
    type: "message",
    title: "Nouveau message 💬",
    body: text ? text.slice(0, 80) : "📷 Photo reçue",
    link: "/messages",
  });

  return NextResponse.json({ ok: true, message });
}
