import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { exchangeGoogleCode } from "@/lib/google";
import { notify } from "@/lib/notifications";

function genReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return "NMK-" + code;
}

// Callback Google : échange le code, trouve/crée le compte, ouvre la session.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/connexion?erreur=google`);
  }

  const profile = await exchangeGoogleCode(code);
  if (!profile || !profile.email) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/connexion?erreur=google`);
  }

  const email = profile.email.toLowerCase();

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Créer un nouveau compte (un seul compte pour acheter ET vendre)
    let referralCode = genReferralCode();
    while (await prisma.user.findUnique({ where: { referralCode } })) {
      referralCode = genReferralCode();
    }
    user = await prisma.user.create({
      data: {
        name: profile.name,
        email,
        profilePhoto: profile.picture || null,
        passwordHash: await hashPassword("google-" + Date.now() + Math.random()), // jamais utilisé
        isVerified: true, // l'email est déjà vérifié par Google
        referralCode,
      },
    });
    await notify({
      userId: user.id,
      type: "welcome",
      title: "Bienvenue sur N-marke 🛍️",
      body: "Ton compte Google est connecté. Ajoute ton téléphone et ta région dans ton profil pour vendre.",
      link: "/mon-compte",
    });
  } else if (!user.isVerified) {
    await prisma.user.update({ where: { id: user.id }, data: { isVerified: true, profilePhoto: profile.picture || user.profilePhoto } });
  } else if (profile.picture && !user.profilePhoto) {
    await prisma.user.update({ where: { id: user.id }, data: { profilePhoto: profile.picture } });
  }

  await createSession(user.id, user.role);

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/`);
}
