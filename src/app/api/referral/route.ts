import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";

// Mon parrainage : code, filleuls, récompenses.
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const [referrals, count] = await Promise.all([
    prisma.referral.findMany({
      where: { referrerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.user.count({ where: { referredById: user.id } }),
  ]);

  return NextResponse.json({
    ok: true,
    referralCode: user.referralCode,
    count,
    referrals,
  });
}
