// Envoi d'email — N-marke
// Phase 1 : si aucun SMTP n'est configuré, l'email est "simulé" et le code
// s'affiche dans les logs (utile en développement).
// En production : configurer SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS.

const SMTP_CONFIGURED = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

function extractCode(text: string): string | undefined {
  return (text.match(/\b(\d{4,6})\b/) || [])[1];
}

export async function sendMail(
  to: string,
  subject: string,
  html: string
): Promise<{ ok: boolean; code?: string; simulated?: boolean }> {
  const code = extractCode(html);

  if (!SMTP_CONFIGURED) {
    console.log(`\n[Email simulé] → ${to}`);
    console.log(`[Email simulé] Sujet : ${subject}`);
    if (code) console.log(`[Email simulé] Code : ${code}\n`);
    return { ok: true, code, simulated: true };
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === "465",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return { ok: true, code };
  } catch (e) {
    console.error("[Email] Erreur d'envoi :", e);
    return { ok: false };
  }
}

function layout(inner: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#faf7f0;font-family:Arial,sans-serif;">
    <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px -12px rgba(32,58,82,.22);">
      <div style="background:linear-gradient(135deg,#3579ac,#5b8a46);padding:28px;text-align:center;">
        <div style="font-size:34px;">🛍️</div>
        <div style="color:#fff;font-size:22px;font-weight:800;margin-top:6px;">N-marke</div>
        <div style="color:rgba(255,255,255,.85);font-size:13px;">Le marché en ligne des Comores</div>
      </div>
      <div style="padding:28px;color:#203a52;font-size:15px;line-height:1.6;">${inner}</div>
      <div style="padding:18px;text-align:center;color:#9aa6b5;font-size:12px;">Merci de faire partie de la communauté N-marke 🌴</div>
    </div>
  </body></html>`;
}

export function verificationEmail(name: string, code: string) {
  return {
    subject: "Bienvenue sur N-marke — ton code de confirmation",
    html: layout(`
      <p>Bonjour <strong>${name}</strong>,</p>
      <p>Super, tu as créé ton compte ! Pour confirmer ton adresse email, entre ce code :</p>
      <div style="text-align:center;margin:24px 0;">
        <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#c8963e;">${code}</span>
      </div>
      <p style="font-size:13px;color:#6b7a8a;">Ce code expire dans 10 minutes. Si tu n'es pas à l'origine de cette demande, ignore simplement cet email.</p>
    `),
  };
}

export function resetEmail(code: string) {
  return {
    subject: "N-marke — réinitialisation de ton mot de passe",
    html: layout(`
      <p>Bonjour,</p>
      <p>Tu as demandé à réinitialiser ton mot de passe. Entre ce code :</p>
      <div style="text-align:center;margin:24px 0;">
        <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#c8963e;">${code}</span>
      </div>
      <p style="font-size:13px;color:#6b7a8a;">Ce code expire dans 10 minutes. Si tu n'as rien demandé, tu peux ignorer cet email.</p>
    `),
  };
}
