import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession, MAX_LOGIN_ATTEMPTS, LOCK_MINUTES } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  if (!rateLimit(req, "login", 20, 60_000)) {
    return NextResponse.json({ ok: false, error: "Trop de tentatives. Réessaie dans une minute." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const phone = body?.phone ? normalizePhone(body.phone) : "";
  const password = body?.password || "";

  if (!phone || !password) {
    return NextResponse.json({ ok: false, error: "Entre ton numéro et ton mot de passe." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return NextResponse.json({ ok: false, error: "Aucun compte avec ce numéro. Inscris-toi d'abord !" }, { status: 404 });
  }

  // Compte temporairement bloqué ?
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return NextResponse.json(
      { ok: false, error: `Trop de tentatives. Réessaie dans ${mins} minutes.` },
      { status: 423 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const attempts = user.loginAttempts + 1;
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60000) },
      });
      return NextResponse.json(
        { ok: false, error: "Trop de tentatives. Réessaie dans 15 minutes." },
        { status: 423 }
      );
    }
    await prisma.user.update({ where: { id: user.id }, data: { loginAttempts: attempts } });
    return NextResponse.json(
      { ok: false, error: `Mot de passe incorrect. Il te reste ${MAX_LOGIN_ATTEMPTS - attempts} essai(s).` },
      { status: 401 }
    );
  }

  if (!user.isVerified) {
    return NextResponse.json(
      { ok: false, error: "Confirme d'abord ton adresse email avant de te connecter.", needsVerification: true, phone: user.phone },
      { status: 403 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  await createSession(user.id, user.role);

  return NextResponse.json({ ok: true, message: "Content de te revoir ! 👋" });
}
