import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api";
import { getFreePeriodDaysRemaining, getFreePeriodMode } from "@/lib/billing";
import { setConfigValue } from "@/lib/settings";

// Période gratuite : consulter / prolonger / arrêter / passer en illimité.
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const [days, mode] = await Promise.all([getFreePeriodDaysRemaining(), getFreePeriodMode()]);
  return NextResponse.json({
    ok: true,
    mode,
    freeDays: Math.max(0, days),
    active: mode === "indefinite" || days > 0,
  });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const days = Number(body?.days) || 0;

  if (action === "prolonger" && days > 0) {
    const current = (await getFreePeriodMode()) === "indefinite" ? 0 : Math.max(0, await getFreePeriodDaysRemaining());
    const end = new Date(Date.now() + (current + days) * 86400000);
    await setConfigValue("freePeriodMode", "dated");
    await setConfigValue("freePeriodEnd", end.toISOString());
    return NextResponse.json({ ok: true, message: `Période gratuite prolongée de ${days} jours.` });
  }

  if (action === "indefini") {
    await setConfigValue("freePeriodMode", "indefinite");
    return NextResponse.json({ ok: true, message: "Gratuit jusqu'à nouvel ordre." });
  }

  if (action === "arreter") {
    await setConfigValue("freePeriodMode", "dated");
    await setConfigValue("freePeriodEnd", new Date().toISOString());
    return NextResponse.json({ ok: true, message: "Période gratuite terminée." });
  }

  return NextResponse.json({ ok: false, error: "Action invalide." }, { status: 400 });
}
