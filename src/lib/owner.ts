import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";

// Accès propriétaire : un mot de passe secret (OWNER_PASSWORD) ouvre un espace
// de gestion complet, indépendant des comptes utilisateurs.

const SECRET = new TextEncoder().encode(
  process.env.OWNER_SECRET || process.env.JWT_SECRET || "n-marke-dev"
);
const OWNER_COOKIE = "nmarke_owner";

export function ownerPassword(): string {
  return process.env.OWNER_PASSWORD || "nmarke-admin";
}

export function ownerEnabled(): boolean {
  return Boolean(process.env.OWNER_PASSWORD);
}

/** Vérifie le mot de passe (comparaison à temps constant). */
export function verifyOwnerPassword(input: string): boolean {
  const expected = ownerPassword();
  const a = Buffer.from(String(input));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function signOwnerToken(): Promise<string> {
  return new SignJWT({ owner: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(SECRET);
}

export async function setOwnerCookie() {
  const token = await signOwnerToken();
  cookies().set(OWNER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function clearOwnerCookie() {
  cookies().delete(OWNER_COOKIE);
}

/** Vérifie si la requête vient d'un propriétaire connecté. */
export async function isOwner(): Promise<boolean> {
  const token = cookies().get(OWNER_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.owner === true;
  } catch {
    return false;
  }
}
