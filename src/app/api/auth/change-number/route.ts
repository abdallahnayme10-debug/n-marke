import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { notify } from "@/lib/notifications";

// Demande de changement de numéro → vérification manuelle par l'admin.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Non connecté." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const newPhone = body?.newPhone ? normalizePhone(body.newPhone) : "";
  const reason = body?.reason || "";

  if (!newPhone || newPhone === user.phone) {
    return NextResponse.json({ ok: false, error: "Entre un nouveau numéro valide." }, { status: 400 });
  }

  const already = await prisma.user.findUnique({ where: { phone: newPhone } });
  if (already) {
    return NextResponse.json({ ok: false, error: "Ce numéro est déjà utilisé par un autre compte." }, { status: 409 });
  }

  // On stocke la demande dans les notifications de l'admin (simple + traçable)
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (admin) {
    await notify({
      userId: admin.id,
      type: "change-number",
      title: "🔁 Demande de changement de numéro",
      body: `${user.name} (${user.phone}) souhaite passer au numéro ${newPhone}. Motif : ${reason || "non précisé"}`,
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Ta demande a été envoyée. L'équipe N-marke va vérifier et te contacter. Merci de ta patience !",
  });
}
