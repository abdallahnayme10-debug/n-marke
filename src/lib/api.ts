import { NextResponse } from "next/server";
import { getCurrentUser, isLocked } from "./auth";
import { prisma } from "./db";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function ok(data: unknown) {
  return NextResponse.json({ ok: true, ...(data as object) });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/** Exige un utilisateur connecté. Renvoie l'utilisateur ou une réponse 401. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: fail("Tu dois être connecté(e) pour faire ça.", 401) };
  return { user, error: null };
}

/** Exige un utilisateur confirmé par SMS. */
export async function requireVerifiedUser() {
  const { user, error } = await requireUser();
  if (error || !user) return { user: null, error: error || fail("Non connecté.", 401) };
  if (!user.isVerified) {
    return { user: null, error: fail("Confirme d'abord ton numéro de téléphone.", 403) };
  }
  return { user, error: null };
}

/** Exige un admin. */
export async function requireAdmin() {
  const { user, error } = await requireUser();
  if (error || !user) return { user: null, error: error || fail("Non connecté.", 401) };
  if (user.role !== "admin") {
    return { user: null, error: fail("Réservé à l'administrateur.", 403) };
  }
  return { user, error: null };
}

export async function requireUnlockedUser() {
  const { user, error } = await requireUser();
  if (error || !user) return { user: null, error: error || fail("Non connecté.", 401) };
  if (isLocked(user)) {
    return { user: null, error: fail("Trop de tentatives. Réessaie dans 15 minutes.", 423) };
  }
  return { user, error: null };
}

export function parseJson<T>(req: Request): Promise<T | null> {
  return req.json().catch(() => null);
}

export { prisma };
