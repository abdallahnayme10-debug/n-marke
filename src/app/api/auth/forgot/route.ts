import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCode } from "@/lib/sms";
import { sendMail, resetEmail } from "@/lib/mail";
import { normalizePhone } from "@/lib/phone";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const phone = body?.phone ? normalizePhone(body.phone) : "";

  if (!phone) {
    return NextResponse.json({ ok: false, error: "Entre ton numéro de téléphone." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    // Ne pas révéler si le numéro existe (sécurité)
    return NextResponse.json({ ok: true, message: "Si ce numéro existe, un code t'a été envoyé par email." });
  }

  if (!user.email) {
    return NextResponse.json(
      { ok: false, error: "Aucune adresse email n'est liée à ce compte. Contacte le support." },
      { status: 400 }
    );
  }

  const code = generateCode(6);
  await prisma.verificationCode.deleteMany({ where: { phone, type: "reset" } });
  await prisma.verificationCode.create({
    data: { phone, email: user.email, code, type: "reset", expiresAt: new Date(Date.now() + 10 * 60000) },
  });

  const mail = resetEmail(code);
  const result = await sendMail(user.email, mail.subject, mail.html);

  return NextResponse.json({
    ok: true,
    simulatedCode: result.simulated ? code : undefined,
    message: "On t'a envoyé un code par email. Entre-le pour choisir un nouveau mot de passe.",
  });
}
