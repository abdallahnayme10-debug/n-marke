import { prisma } from "./db";
import { FREE_PERIOD_DAYS, SELLER_TIERS } from "./constants";

/** Mode de la période gratuite : "indefinite" (jusqu'à nouvel ordre) ou "dated". */
export async function getFreePeriodMode(): Promise<"indefinite" | "dated"> {
  const setting = await prisma.setting.findUnique({ where: { key: "freePeriodMode" } });
  return setting?.value === "dated" ? "dated" : "indefinite";
}

/** Jours restants de la période gratuite (mode "dated"). */
export async function getFreePeriodDaysRemaining(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: "freePeriodEnd" } });
  if (!setting) return FREE_PERIOD_DAYS;
  const end = new Date(setting.value).getTime();
  return Math.ceil((end - Date.now()) / 86400000);
}

/** La période gratuite est-elle encore active ? (indéfinie par défaut) */
export async function isFreePeriod(): Promise<boolean> {
  const mode = await getFreePeriodMode();
  if (mode === "indefinite") return true;
  return (await getFreePeriodDaysRemaining()) > 0;
}

type UserForQuota = {
  id: string;
  sellerTier: string;
  premiumUntil: Date | null;
};

/** Nombre max d'annonces actives pour un vendeur (illimité pendant la période gratuite). */
export async function maxActiveListings(user: UserForQuota): Promise<number> {
  if (await isFreePeriod()) return 9999;
  const isPremium =
    user.sellerTier === "premium" && user.premiumUntil && user.premiumUntil.getTime() > Date.now();
  const tier = isPremium ? "premium" : user.sellerTier === "regulier" ? "regulier" : "occasionnel";
  return SELLER_TIERS[tier].maxListings;
}

export async function countActiveListings(userId: string): Promise<number> {
  return prisma.listing.count({ where: { sellerId: userId, status: "active" } });
}

export async function canPostListing(user: UserForQuota): Promise<boolean> {
  const max = await maxActiveListings(user);
  const count = await countActiveListings(user.id);
  return count < max;
}
