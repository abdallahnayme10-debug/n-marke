import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api";
import { getFreePeriodDaysRemaining, getFreePeriodMode } from "@/lib/billing";

// Statistiques complètes du tableau de bord admin.
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const today = new Date();
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const dayStart = new Date(today.toISOString().slice(0, 10));

  const [
    totalUsers, newToday, newWeek, lockedUsers, unverifiedUsers,
    totalListings, activeListings, expiringSoon, reportedListings,
    couriers, totalDeliveries,
    pendingPayments, totalPayments,
    openDisputes, resolvedDisputes,
    totalReferrals,
    freeDays,
    categories, topSearches, topVision, activeBanners,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: dayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { lockedUntil: { gt: new Date() } } }),
    prisma.user.count({ where: { isVerified: false } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "active" } }),
    prisma.listing.count({ where: { status: "active", expiresAt: { lte: new Date(Date.now() + 3 * 86400000), not: null } } }),
    prisma.report.count({ where: { status: "ouvert" } }),
    prisma.user.count({ where: { isCourier: true } }),
    prisma.delivery.count({ where: { status: "livre" } }),
    prisma.payment.count({ where: { status: "en_attente" } }),
    prisma.payment.count(),
    prisma.report.count({ where: { status: "ouvert" } }),
    prisma.report.count({ where: { status: "resolu" } }),
    prisma.referral.count(),
    getFreePeriodDaysRemaining(),
    prisma.listing.groupBy({ by: ["categoryId"], _count: true, where: { status: "active" } }),
    prisma.searchLog.groupBy({ by: ["query"], where: { type: "text" }, _count: { query: true }, orderBy: { _count: { query: "desc" } }, take: 10 }),
    prisma.searchLog.findMany({ where: { type: "vision" }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.banner.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } }),
  ]);

  // Libellés de catégories
  const categoryNames = await prisma.category.findMany({ select: { id: true, name: true, icon: true } });
  const categoriesWithNames = categories.map((c) => {
    const cat = categoryNames.find((x) => x.id === c.categoryId);
    return { name: cat?.name || "Autre", icon: cat?.icon, count: c._count };
  });

  const freeMode = await getFreePeriodMode();

  return NextResponse.json({
    ok: true,
    stats: {
      users: { total: totalUsers, newToday, newWeek, locked: lockedUsers, unverified: unverifiedUsers },
      listings: { total: totalListings, active: activeListings, expiringSoon, reported: reportedListings },
      delivery: { couriers, totalDeliveries },
      payments: { pending: pendingPayments, total: totalPayments },
      disputes: { open: openDisputes, resolved: resolvedDisputes },
      referrals: totalReferrals,
      freePeriod: { mode: freeMode, freeDays: Math.max(0, freeDays), active: freeMode === "indefinite" || freeDays > 0 },
      categories: categoriesWithNames,
      topSearches: topSearches.map((s) => ({ query: s.query, count: s._count.query })),
      topVision: topVision,
      banners: activeBanners,
    },
  });
}
