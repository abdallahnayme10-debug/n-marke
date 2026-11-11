import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

// Chiffrement symétrique AES-256-GCM des secrets gérés depuis l'espace propriétaire.
// La clé est dérivée de JWT_SECRET (ou OWNER_SECRET) : les secrets ne sont JAMAIS
// stockés en clair dans la base de données.

function getKey(): Buffer {
  const secret = process.env.OWNER_SECRET || process.env.JWT_SECRET || "n-marke-dev";
  return createHash("sha256").update(String(secret)).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(".");
}

export function decryptSecret(payload: string): string {
  try {
    const [iv, tag, enc] = payload.split(".");
    const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(enc, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

/** Masque partiellement une valeur pour l'affichage (ex: sk_live_****abcd). */
export function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
}
