import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { generateCode } from "@/lib/sms";
import { sendMail, verificationEmail } from "@/lib/mail";
import { normalizePhone, isValidComorianPhone } from "@/lib/phone";
import { REGIONS } from "@/lib/constants";
import { rateLimit } from "@/lib/rateLimit";

const bodySchema = z.object({
  name: z.string().min(2).max(50),
  phone: z.string().min(7),
  email: z.string().email("Entre une adresse email valide."),
  password: z.string().min(6),
  island: z.string().optional(),
  region: z.string().optional(),
  referralCode: z.string().optional(),
});

function genReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return "NMK-" + code;
}

export async function POST(req: Request) {
  if (!rateLimit(req, "register", 10, 60_000)) {
    return NextResponse.json({ ok: false, error: "Trop de tentatives. Réessaie dans une minute." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.success ? "" : parsed.error.issues[0]?.message;
    return NextResponse.json(
      { ok: false, error: first || "Oups, vérifie les informations saisies." },
      { status: 400 }
    );
  }
  const { name, phone, email, password, island, region, referralCode } = parsed.data;

  const normalized = normalizePhone(phone);
  if (!isValidComorianPhone(normalized)) {
    return NextResponse.json({ ok: false, error: "Oups, vérifie ton numéro de téléphone." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { phone: normalized } });
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "Ce numéro est déjà inscrit. Connecte-toi plutôt !" },
      { status: 409 }
    );
  }

  const emailTaken = await prisma.user.findUnique({ where: { email } });
  if (emailTaken) {
    return NextResponse.json(
      { ok: false, error: "Cette adresse email est déjà utilisée." },
      { status: 409 }
    );
  }

  // Parrainage : vérifier le code s'il est fourni
  let referredById: string | undefined;
  if (referralCode) {
    const referrer = await prisma.user.findUnique({ where: { referralCode } });
    if (referrer) referredById = referrer.id;
  }

  // Code de parrainage unique
  let code = genReferralCode();
  while (await prisma.user.findUnique({ where: { referralCode: code } })) {
    code = genReferralCode();
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      phone: normalized,
      email,
      passwordHash,
      island: island && REGIONS[island] ? island : undefined,
      region,
      referralCode: code,
      referredById,
    },
  });

  // Envoi du code de confirmation par EMAIL
  const smsCode = generateCode(4);
  await prisma.verificationCode.deleteMany({ where: { email, type: "register" } });
  await prisma.verificationCode.create({
    data: {
      phone: normalized,
      email,
      code: smsCode,
      type: "register",
      expiresAt: new Date(Date.now() + 10 * 60000),
    },
  });

  const mail = verificationEmail(name, smsCode);
  const result = await sendMail(email, mail.subject, mail.html);

  return NextResponse.json({
    ok: true,
    simulatedCode: result.simulated ? smsCode : undefined,
    message: "Super ! On t'a envoyé un code de confirmation par email. Regarde ta boîte de réception.",
  });
}
