import { prisma } from "./db";
import { notify } from "./notifications";

// Logique partagée d'application d'un paiement validé (premium / mise en avant).

export async function applyPaymentEffect(payment: {
  id: string;
  userId: string;
  service: string;
  description: string | null;
  adId?: string | null;
}) {
  if (payment.service === "premium") {
    await prisma.user.update({
      where: { id: payment.userId },
      data: { sellerTier: "premium", premiumUntil: new Date(Date.now() + 30 * 86400000) },
    });
  }

  if (payment.service === "feature") {
    const listing = await prisma.listing.findFirst({
      where: { sellerId: payment.userId, status: "active" },
      orderBy: { createdAt: "desc" },
    });
    if (listing) {
      const days = payment.description?.includes("30") ? 30 : payment.description?.includes("7") ? 7 : 3;
      await prisma.listing.update({
        where: { id: listing.id },
        data: { isFeatured: true, featuredUntil: new Date(Date.now() + days * 86400000) },
      });
    }
  }

  if (payment.service === "ad" && payment.adId) {
    const ad = await prisma.ad.findUnique({ where: { id: payment.adId } });
    if (ad) {
      await prisma.ad.update({
        where: { id: ad.id },
        data: { status: "active", startsAt: new Date(), endsAt: new Date(Date.now() + ad.days * 86400000) },
      });
    }
  }
}

/** Valide un paiement et applique son effet. */
export async function validatePayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "en_attente") return payment;

  await prisma.payment.update({ where: { id: payment.id }, data: { status: "valide", validatedAt: new Date() } });
  await applyPaymentEffect(payment);
  await notify({
    userId: payment.userId,
    type: "payment",
    title: "Paiement validé ✅",
    body: "Ton paiement a été confirmé. Merci de ta confiance !",
    sms: true,
    smsMessage: "N-marke : ton paiement a été validé. Merci !",
  });

  return prisma.payment.findUnique({ where: { id: paymentId } });
}
