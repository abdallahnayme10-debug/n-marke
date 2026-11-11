import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api";
import { notify } from "@/lib/notifications";
import { mvolaOnlineAvailable, mvolaRequestPayment } from "@/lib/mvola";

// Mes paiements / Créer un paiement.
// - M-Vola en ligne (si clés configurées) : STK Push sur le téléphone.
// - Sinon : validation manuelle par l'administrateur.
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ ok: true, payments });
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const { service, description, amount, method, reference } = body;

  if (!service || !amount || !method) {
    return NextResponse.json({ ok: false, error: "Renseigne le service, le montant et la méthode." }, { status: 400 });
  }
  if (!["mvola", "pokera"].includes(method)) {
    return NextResponse.json({ ok: false, error: "Méthode de paiement invalide." }, { status: 400 });
  }

  const amountNum = Number(amount);
  const ref = reference || `NMK-${Date.now().toString().slice(-8)}`;

  // ── Tentative de paiement en ligne M-Vola ──
  if (method === "mvola" && mvolaOnlineAvailable() && user.phone) {
    const result = await mvolaRequestPayment(user.phone, amountNum, ref);

    if (result.success) {
      const payment = await prisma.payment.create({
        data: {
          userId: user.id,
          service,
          description: description || service,
          amount: amountNum,
          method,
          reference: ref,
        },
      });
      return NextResponse.json({
        ok: true,
        payment,
        online: true,
        message: "📱 Une demande de paiement a été envoyée sur ton téléphone M-Vola. Valide-la pour finaliser !",
      });
    }

    // Échec en ligne → on bascule en validation manuelle
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        service,
        description: description || service,
        amount: amountNum,
        method,
        reference: ref,
      },
    });
    await notifyAdmin(user.name, amountNum, method, service);
    return NextResponse.json({
      ok: true,
      payment,
      online: false,
      message: `${result.message} Tu peux aussi faire un transfert manuel : envoie ${amountNum.toLocaleString("fr-FR")} KMF au numéro indiqué puis valide avec ta référence.`,
    });
  }

  // ── Validation manuelle (Pokéra, ou M-Vola sans clés API) ──
  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      service,
      description: description || service,
      amount: amountNum,
      method,
      reference: ref,
    },
  });

  await notifyAdmin(user.name, amountNum, method, service);

  return NextResponse.json({
    ok: true,
    payment,
    online: false,
    message: "Paiement enregistré ! Il sera validé par l'équipe N-marke sous peu. Merci de ta patience.",
  });
}

async function notifyAdmin(name: string, amount: number, method: string, service: string) {
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (admin) {
    await notify({
      userId: admin.id,
      type: "payment",
      title: "💳 Paiement en attente",
      body: `${name} a envoyé ${amount.toLocaleString("fr-FR")} KMF via ${method === "mvola" ? "M-Vola" : "Pokéra"} (${service}).`,
      link: "/admin",
    });
  }
}
