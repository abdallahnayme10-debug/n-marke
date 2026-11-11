// Service SMS — N-marke
// Phase 1 : si aucun provider configuré, le code est "simulé" et affiché dans les logs
// (utile en développement). En production, brancher Twilio ou Africa's Talking.

function generateCode(len: 4 | 6 = 4): string {
  const max = Math.pow(10, len) - 1;
  return String(Math.floor(Math.random() * max) + 1).padStart(len, "0");
}

export { generateCode };

export async function sendSms(phone: string, message: string): Promise<{ ok: boolean; code?: string; simulated?: boolean }> {
  const provider = process.env.SMS_PROVIDER || "";
  const normalized = phone.replace(/\s+/g, "");

  if (!provider) {
    // Mode simulation : on n'envoie rien, on log le code pour le développement.
    const code = (message.match(/\b(\d{4,6})\b/) || [])[1];
    console.log(`[SMS simulé] → ${normalized} : ${message}`);
    return { ok: true, code, simulated: true };
  }

  if (provider === "twilio") {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    if (!sid || !token || !from) return { ok: false };
    try {
      const body = new URLSearchParams({ To: normalized, From: from, Body: message });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      return { ok: res.ok };
    } catch {
      return { ok: false };
    }
  }

  if (provider === "africastalking") {
    const username = process.env.AFRICASTALKING_USERNAME;
    const apiKey = process.env.AFRICASTALKING_API_KEY;
    if (!username || !apiKey) return { ok: false };
    try {
      const res = await fetch("https://api.africastalking.com/version1/messaging", {
        method: "POST",
        headers: {
          apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ username, to: normalized, message }),
      });
      return { ok: res.ok };
    } catch {
      return { ok: false };
    }
  }

  return { ok: false };
}
