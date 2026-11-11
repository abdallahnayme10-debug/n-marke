// M-Vola (Comores Telecom) — paiement en ligne
// ---------------------------------------------------------------
// M-Vola aux Comores suit un modèle d'API inspiré de M-Pesa Daraja :
//   1. Jeton OAuth (consumer key + secret) → access_token
//   2. STK Push → l'utilisateur reçoit une demande de paiement sur son téléphone
//   3. Callback → confirmation du paiement sur notre serveur
//
// ⚠️ Les endpoints exacts doivent être confirmés auprès de Comores Telecom /
// du fournisseur M-Vola. Les valeurs par défaut ci-dessous sont un gabarit
// (pattern Daraja). Quand MVOLA_CONSUMER_KEY / SECRET sont absents, la
// plateforme bascule automatiquement en validation manuelle.

type MvolaConfig = {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey?: string;
};

function getConfig(): MvolaConfig | null {
  const consumerKey = process.env.MVOLA_CONSUMER_KEY;
  const consumerSecret = process.env.MVOLA_CONSUMER_SECRET;
  const shortcode = (process.env.MVOLA_MERCHANT_NUMBER || "").replace(/\D/g, "");
  if (!consumerKey || !consumerSecret || !shortcode) return null;
  return {
    baseUrl: (process.env.MVOLA_API_BASE || "https://api.mvola.km").replace(/\/$/, ""),
    consumerKey,
    consumerSecret,
    shortcode,
    passkey: process.env.MVOLA_PASSKEY || undefined,
  };
}

/** Le paiement en ligne M-Vola est-il disponible (clés configurées) ? */
export function mvolaOnlineAvailable(): boolean {
  return getConfig() !== null;
}

async function getToken(cfg: MvolaConfig): Promise<string> {
  const res = await fetch(`${cfg.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    method: "GET",
    headers: {
      Authorization: "Basic " + Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString("base64"),
    },
  });
  if (!res.ok) throw new Error(`M-Vola : échec d'authentification (${res.status})`);
  const data = await res.json();
  if (!data.access_token) throw new Error("M-Vola : pas de jeton d'accès reçu");
  return data.access_token as string;
}

function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export type MvolaPaymentResult = {
  success: boolean;
  requestId?: string;
  message?: string;
  raw?: unknown;
};

/** Demande de paiement (STK Push) envoyée sur le téléphone de l'utilisateur. */
export async function mvolaRequestPayment(
  phone: string,
  amount: number,
  reference: string
): Promise<MvolaPaymentResult> {
  const cfg = getConfig();
  if (!cfg) return { success: false, message: "M-Vola non configuré." };

  try {
    const token = await getToken(cfg);
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    const password = cfg.passkey
      ? Buffer.from(`${cfg.shortcode}${cfg.passkey}${timestamp}`).toString("base64")
      : "";

    const body: Record<string, unknown> = {
      BusinessShortCode: cfg.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneDigits(phone),
      PartyB: cfg.shortcode,
      PhoneNumber: phoneDigits(phone),
      CallBackURL: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/payments/mvola-callback`,
      AccountReference: reference,
      TransactionDesc: "Paiement N-marke",
    };

    const res = await fetch(`${cfg.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { success: false, message: `M-Vola : ${(data as any).errorMessage || res.statusText || "erreur inconnue"}`, raw: data };
    }
    const requestId = (data as any).CheckoutRequestID || (data as any).MerchantRequestID;
    return { success: true, requestId, message: "Demande envoyée sur ton téléphone. Valide le paiement M-Vola.", raw: data };
  } catch (e) {
    return { success: false, message: `M-Vola : ${(e as Error).message}` };
  }
}

/** Vérifie le statut d'une demande de paiement. */
export async function mvolaCheckStatus(requestId: string): Promise<MvolaPaymentResult> {
  const cfg = getConfig();
  if (!cfg) return { success: false, message: "M-Vola non configuré." };
  try {
    const token = await getToken(cfg);
    const res = await fetch(`${cfg.baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ BusinessShortCode: cfg.shortcode, CheckoutRequestID: requestId }),
    });
    const data = await res.json().catch(() => ({}));
    const code = (data as any).ResultCode;
    return { success: code === "0", message: (data as any).ResultDesc || "Statut inconnu", raw: data };
  } catch (e) {
    return { success: false, message: `M-Vola : ${(e as Error).message}` };
  }
}
