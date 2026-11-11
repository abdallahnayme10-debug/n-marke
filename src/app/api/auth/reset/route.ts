import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const phone = body?.phone ? normalizePhone(body.phone) : "";
  const code = (body?.code || "").trim();
  const password = body?.password || "";

  if (!phone || !code || password.length < 6) {
    return NextResponse.json({ ok: false, error: "Renseigne le code et un nouveau mot de passe (6 caractères min)." }, { status: 400 });
  }

  const record = await prisma.verificationCode.findFirst({
    where: { phone, code, type: "reset", used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: "Ce code est invalide ou a expiré. Redemande-en un." }, { status: 400 });
  }

  await prisma.verificationCode.update({ where: { id: record.id }, data: { used: true } });
  await prisma.user.update({
    where: { phone },
    data: { passwordHash: await hashPassword(password), loginAttempts: 0, lockedUntil: null },
  });

  return NextResponse.json({ ok: true, message: "Nouveau mot de passe enregistré ! Connecte-toi." });
}
