import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";
import { notify } from "@/lib/notifications";
import { DISPUTE_TYPES } from "@/lib/constants";

// Signalement / litige sur une annonce ou un vendeur.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ ok: false, error: "Annonce introuvable." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const type = body?.type;
  if (!type || !DISPUTE_TYPES[type]) {
    return NextResponse.json({ ok: false, error: "Choisis le type de problème." }, { status: 400 });
  }

  const report = await prisma.report.create({
    data: {
      type,
      description: (body?.description || "").trim().slice(0, 2000),
      photos: Array.isArray(body?.photos) ? JSON.stringify(body.photos) : null,
      listingId: listing.id,
      reporterId: user.id,
      againstId: listing.sellerId,
    },
  });

  // Notification admin + vendeur concerné
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (admin) {
    await notify({
      userId: admin.id,
      type: "dispute",
      title: "🚨 Nouveau litige signalé",
      body: `${DISPUTE_TYPES[type]} — annonce « ${listing.title} »`,
      link: `/admin`,
    });
  }
  await notify({
    userId: listing.sellerId,
    type: "dispute",
    title: "Un signalement te concerne",
    body: `Un problème a été signalé sur ton annonce « ${listing.title} ». L'équipe N-marke va l'examiner.`,
  });

  return NextResponse.json({
    ok: true,
    message: "Merci de nous avoir signalé le problème. On s'en occupe et on te tiendra au courant.",
  });
}
