import { prisma } from "./db";
import { notify } from "./notifications";

// Tâches de maintenance légères, déclenchées au chargement de la page d'accueil
// (pas de cron nécessaire en phase 1).

/** Désactive les annonces dont la date d'expiration est dépassée. */
export async function expireOverdueListings() {
  await prisma.listing.updateMany({
    where: { status: "active", expiresAt: { lt: new Date() } },
    data: { status: "expired" },
  });
}

/** Rappel aux vendeurs 3 jours avant l'expiration de leur annonce (1x/jour max). */
export async function remindExpiringListings() {
  const key = "lastExpiryReminder";
  const last = await prisma.setting.findUnique({ where: { key } });
  const today = new Date().toISOString().slice(0, 10);
  if (last && last.value === today) return; // déjà fait aujourd'hui

  const soon = await prisma.listing.findMany({
    where: {
      status: "active",
      expiresAt: {
        gte: new Date(Date.now() + 2 * 86400000),
        lte: new Date(Date.now() + 3 * 86400000),
      },
    },
  });

  for (const l of soon) {
    await notify({
      userId: l.sellerId,
      type: "listing",
      title: "Ton annonce expire bientôt ⏳",
      body: `« ${l.title} » expire dans 3 jours. Pense à la renouveler !`,
      sms: true,
      smsMessage: `N-marke : ton annonce « ${l.title} » expire dans 3 jours.`,
    });
  }

  await prisma.setting.upsert({
    where: { key },
    update: { value: today },
    create: { key, value: today },
  });
}

export async function runMaintenance() {
  try {
    await expireOverdueListings();
    await remindExpiringListings();
  } catch {
    // silencieux : la maintenance ne doit jamais casser la page
  }
}
