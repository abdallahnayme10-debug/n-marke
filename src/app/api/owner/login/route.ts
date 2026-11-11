import { NextResponse } from "next/server";
import { verifyOwnerPassword, setOwnerCookie, isOwner } from "@/lib/owner";
import { rateLimit } from "@/lib/rateLimit";

// Connexion propriétaire (mot de passe secret).
export async function POST(req: Request) {
  if (!rateLimit(req, "owner-login", 8, 60_000)) {
    return NextResponse.json({ ok: false, error: "Trop de tentatives. Réessaie dans une minute." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.password || !verifyOwnerPassword(body.password)) {
    return NextResponse.json({ ok: false, error: "Mot de passe incorrect." }, { status: 401 });
  }
  await setOwnerCookie();
  return NextResponse.json({ ok: true, message: "Bienvenue, propriétaire 👋" });
}

export async function GET() {
  return NextResponse.json({ ok: true, authenticated: await isOwner() });
}
