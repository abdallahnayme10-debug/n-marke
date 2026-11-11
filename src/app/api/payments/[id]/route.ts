import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api";
import { notify } from "@/lib/notifications";
import { validatePayment } from "@/lib/payments";

// Admin : valider ou rejeter un paiement.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const action = body?.action; // "valider" | "rejeter"

  const payment = await prisma.payment.findUnique({ where: { id: params.id } });
  if (!payment) return NextResponse.json({ ok: false, error: "Paiement introuvable." }, { status: 404 });

  if (action === "valider") {
    await validatePayment(payment.id);
    return NextResponse.json({ ok: true, message: "Paiement validé." });
  }

  if (action === "rejeter") {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "rejete" } });
    await notify({
      userId: payment.userId,
      type: "payment",
      title: "Paiement refusé",
      body: "Ton paiement n'a pas pu être vérifié. Contacte l'équipe N-marke si besoin.",
    });
    return NextResponse.json({ ok: true, message: "Paiement rejeté." });
  }

  return NextResponse.json({ ok: false, error: "Action invalide." }, { status: 400 });
}
