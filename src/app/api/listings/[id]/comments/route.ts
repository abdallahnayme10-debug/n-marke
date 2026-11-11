import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ ok: false, error: "Annonce introuvable." }, { status: 404 });

  const comments = await prisma.comment.findMany({
    where: { listingId: listing.id },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true, profilePhoto: true, isCourier: true } } },
  });

  return NextResponse.json({ ok: true, comments });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ ok: false, error: "Annonce introuvable." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const content = (body?.body || "").trim();
  if (content.length < 2 || content.length > 1000) {
    return NextResponse.json({ ok: false, error: "Écris un commentaire (entre 2 et 1000 caractères)." }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: { listingId: listing.id, authorId: user.id, body: content },
    include: { author: { select: { id: true, name: true, profilePhoto: true, isCourier: true } } },
  });

  return NextResponse.json({ ok: true, comment, message: "Commentaire publié !" });
}
