import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "n-marque-dev-secret-cle-2026-a-changer-en-production"
);

export const SESSION_COOKIE = "nmarke_session";
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signSession(userId: string, role: string): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { userId: payload.sub as string, role: (payload.role as string) || "user" };
  } catch {
    return null;
  }
}

export async function createSession(userId: string, role: string) {
  const token = await signSession(userId, role);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}

export function destroySession() {
  cookies().delete(SESSION_COOKIE);
}

/** Lit l'utilisateur connecté à partir du cookie de session (côté serveur). */
export async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  return user;
}

/** Vérifie si un compte est temporairement bloqué après trop de tentatives. */
export function isLocked(user: { lockedUntil: Date | null }): boolean {
  if (!user.lockedUntil) return false;
  return user.lockedUntil.getTime() > Date.now();
}

export function lockRemainingMinutes(user: { lockedUntil: Date | null }): number {
  if (!user.lockedUntil) return 0;
  return Math.max(0, Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000));
}
