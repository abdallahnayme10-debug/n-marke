import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";
import { AD_PLANS } from "@/lib/constants";
import { mvolaOnlineAvailable, mvolaRequestPayment } from "@/lib/mvola";
import { notify } from "@/lib/notifications";

// Publicités : lister les actives + mes campagnes / créer une campagne.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mine = url.searchParams.get("mine") === "1";

  if (mine) {
    const { user, error } = await requireUser();
    if (error) return error;
    const ads = await prisma.ad.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ ok: true, ads });
  }

  // Campagnes actives (visibles sur la page d'accueil)
  const now = new Date();
  const ads = await prisma.ad.findMany({
    where: { status: "active", endsAt: { gt: now } },
    orderBy: { startsAt: "desc" },
    take: 12,
    include: { user: { select: { name: true } } },
  });
  return NextResponse.json({ ok: true, ads });
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const { planId, title, link, image, method } = body;

  const plan = AD_PLANS.find((p) => p.id === planId);
  if (!plan || !title || !link) {
    return NextResponse.json({ ok: false, error: "Choisis un plan, un titre et un lien." }, { status: 400 });
  }
  if (!/^https?:\/\//.test(link) && !link.startsWith("/")) {
    return NextResponse.json({ ok: false, error: "Le lien doit commencer par http(s):// ou /annonce/..." }, { status: 400 });
  }
  if (!["mvola", "pokera", "kartapay"].includes(method)) {
    return NextResponse.json({ ok: false, error: "Méthode de paiement invalide." }, { status: 400 });
  }

  const ad = await prisma.ad.create({
    data: {
      userId: user.id,
      title: title.slice(0, 80),
      link,
      image: image || null,
      days: plan.days,
      amount: plan.price,
    },
  });

  const ref = `AD-${Date.now().toString().slice(-8)}`;
  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      service: "ad",
      description: `Publicité « ${plan.label} » ${plan.days} jours`,
      amount: plan.price,
      method,
      reference: ref,
      adId: ad.id,
    },
  });

  // Tentative de paiement en ligne M-Vola
  if (method === "mvola" && mvolaOnlineAvailable() && user.phone) {
    const result = await mvolaRequestPayment(user.phone, plan.price, ref);
    if (result.success) {
      return NextResponse.json({
        ok: true, ad, online: true,
        message: "📱 Une demande de paiement a été envoyée sur ton téléphone M-Vola. Valide-la pour lancer ta publicité !",
      });
    }
  }

  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (admin) {
    await notify({
      userId: admin.id,
      type: "ad",
      title: "📣 Nouvelle publicité en attente",
      body: `${user.name} veut lancer « ${title} » (${plan.days} jours, ${plan.price} KMF).`,
      link: "/admin",
    });
  }

  return NextResponse.json({
    ok: true, ad, online: false,
    message: "Ta demande de publicité est enregistrée ! Elle sera active dès la validation du paiement. Merci !",
  });
}
