import { NextResponse } from "next/server";
import { googleAuthUrl, googleEnabled } from "@/lib/google";

// Démarre la connexion Google : redirige vers le consentement Google.
export async function GET() {
  if (!googleEnabled()) {
    return NextResponse.json(
      { ok: false, error: "Connexion Google non configurée (ajoute GOOGLE_CLIENT_ID/SECRET)." },
      { status: 501 }
    );
  }
  return NextResponse.redirect(googleAuthUrl());
}
