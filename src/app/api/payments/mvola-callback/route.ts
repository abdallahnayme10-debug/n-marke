import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validatePayment } from "@/lib/payments";

// Callback M-Vola : appelé par le fournisseur après un paiement STK Push.
// Le format exact du callback varie selon le fournisseur → on reste tolérant.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const resultCode = body.ResultCode ?? body.result_code ?? body.status ?? body.ResultStatus;
  const reference = body.AccountReference ?? body.account_reference ?? body.reference ?? body.ref;

  const success = resultCode != null && (String(resultCode) === "0" || String(resultCode).toLowerCase() === "success");

  if (reference && success) {
    const payment = await prisma.payment.findFirst({
      where: { reference: String(reference), status: "en_attente" },
      orderBy: { createdAt: "desc" },
    });
    if (payment) {
      await validatePayment(payment.id);
    }
  }

  return NextResponse.json({ ok: true });
}
