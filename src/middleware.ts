import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "n-marque-dev-secret-cle-2026-a-changer-en-production"
);

const PROTECTED = [
  "/publier",
  "/mon-compte",
  "/mes-annonces",
  "/favoris",
  "/messages",
  "/commandes",
  "/paiement",
  "/parrainage",
  "/notifications",
  "/inscription-livreur",
  "/tableau-de-bord-livreur",
  "/admin",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("nmarke_session")?.value;
  let valid = false;

  if (token) {
    try {
      await jwtVerify(token, SECRET);
      valid = true;
    } catch {}
  }

  if (!valid) {
    const url = req.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|uploads|.*\\..*).*)"],
};
