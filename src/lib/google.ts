// Connexion / inscription avec Google (OAuth2).
// Nécessite GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env.

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/google/callback`;

export function googleEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type GoogleProfile = {
  email: string;
  name: string;
  picture: string;
  emailVerified: boolean;
};

export async function exchangeGoogleCode(code: string): Promise<GoogleProfile | null> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) return null;
  const tokens = await tokenRes.json();

  // Décoder le jeton d'identité (id_token) pour récupérer email, nom, photo.
  // Pas besoin de vérifier la signature : le jeton provient déjà du canal OAuth sécurisé.
  const idToken = tokens.id_token as string;
  if (!idToken) return null;
  return decodeGoogleIdToken(idToken);
}

// Décodage manuel du JWT Google (sans vérification de signature — on a déjà
// obtenu le jeton via le canal sécurisé OAuth).
function decodeGoogleIdToken(token: string): GoogleProfile | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return {
      email: payload.email,
      name: payload.name || payload.email?.split("@")[0] || "Membre",
      picture: payload.picture || "",
      emailVerified: payload.email_verified === true,
    };
  } catch {
    return null;
  }
}
