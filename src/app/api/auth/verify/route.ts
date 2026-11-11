import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  if (!rateLimit(req, "verify", 20, 60_000)) {
    return NextResponse.json({ ok: false, error: "Trop de tentatives. Réessaie dans une minute." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const email = (body?.email || "").trim().toLowerCase();
  const code = (body?.code || "").trim();

  if (!email || !code) {
    return NextResponse.json({ ok: false, error: "Entre ton email et le code reçu." }, { status: 400 });
  }

  const record = await prisma.verificationCode.findFirst({
    where: { email, code, type: "register", used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: "Ce code est invalide ou a expiré. Redemande-en un." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ ok: false, error: "Compte introuvable." }, { status: 404 });
  }

  await prisma.verificationCode.update({ where: { id: record.id }, data: { used: true } });
  await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });

  // Récompenses de parrainage
  if (user.referredById && user.referredById !== user.id) {
    const existing = await prisma.referral.findFirst({ where: { refereeId: user.id } });
    if (!existing) {
      await prisma.referral.create({
        data: { referrerId: user.referredById, refereeId: user.id, reward: "feature-7j" },
      });
      const featured = await prisma.listing.findFirst({
        where: { sellerId: user.referredById, status: "active" },
        orderBy: { createdAt: "asc" },
      });
      if (featured) {
        await prisma.listing.update({
          where: { id: featured.id },
          data: { isFeatured: true, featuredUntil: new Date(Date.now() + 7 * 86400000) },
        });
      }
      await notify({
        userId: user.referredById,
        type: "referral",
        title: "🎉 Nouveau filleul !",
        body: "Quelqu'un s'est inscrit avec ton code. Tu as gagné 7 jours de mise en avant gratuite !",
      });
    }
    await notify({
      userId: user.id,
      type: "referral",
      title: "Bienvenue sur N-marke 🛍️",
      body: "Ton compte est confirmé. Profite de la période gratuite pour publier tes annonces !",
    });
  }

  await createSession(user.id, user.role);

  return NextResponse.json({ ok: true, message: "Super, ton compte est confirmé ! Bienvenue sur N-marke." });
}
