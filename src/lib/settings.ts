import { prisma } from "./db";
import { encryptSecret, decryptSecret, maskSecret } from "./crypto";

// Réglages de l'espace propriétaire (stockés en base, secrets chiffrés).

export const OWNER_CONFIG = {
  // Période gratuite
  freePeriodMode: { secret: false }, // "indefinite" | "dated"
  freePeriodEnd: { secret: false }, // ISO (si dated)
  // Paiements
  pm_mvola_number: { secret: false },
  pm_pokera_number: { secret: false },
  pm_kartapay_enabled: { secret: false }, // "1" | "0"
  pm_kartapay_key: { secret: true },
  pm_mvola_key: { secret: true }, // consumer key
  pm_mvola_secret: { secret: true },
  pm_mvola_passkey: { secret: true },
  pm_mvola_api_base: { secret: false },
  // APIs externes
  api_sms_provider: { secret: false },
  api_sms_key: { secret: true },
  api_vision_key: { secret: true },
  api_google_id: { secret: true },
  api_google_secret: { secret: true },
  api_cloudinary_name: { secret: true },
  api_cloudinary_key: { secret: true },
  api_cloudinary_secret: { secret: true },
  // Règles (texte libre)
  rule_conditions: { secret: false },
  rule_confidentialite: { secret: false },
  rule_regles: { secret: false },
} as const;

export type OwnerConfigKey = keyof typeof OWNER_CONFIG;

export async function getSetting(key: string): Promise<string | null> {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s ? s.value : null;
}

export async function setSetting(key: string, value: string) {
  await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

/** Lit la valeur (déchiffrée si c'est un secret). */
export async function getConfigValue(key: OwnerConfigKey): Promise<string> {
  const v = await getSetting(key);
  if (!v) return "";
  return OWNER_CONFIG[key].secret ? decryptSecret(v) : v;
}

/** Écrit une valeur (chiffrée si c'est un secret). */
export async function setConfigValue(key: OwnerConfigKey, value: string) {
  await setSetting(key, OWNER_CONFIG[key].secret ? encryptSecret(value) : value);
}

/** Renvoie toute la config (secrets masqués, jamais en clair). */
export async function getOwnerConfig(): Promise<Record<string, string>> {
  const keys = Object.keys(OWNER_CONFIG) as OwnerConfigKey[];
  const entries = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const map = Object.fromEntries(entries.map((e) => [e.key, e.value]));

  const out: Record<string, string> = {};
  for (const k of keys) {
    const raw = map[k];
    if (raw == null) {
      out[k] = "";
      continue;
    }
    out[k] = OWNER_CONFIG[k].secret ? maskSecret(decryptSecret(raw)) : raw;
  }
  return out;
}

/** Met à jour la config. Pour les secrets, une valeur vide = ne pas modifier. */
export async function updateOwnerConfig(patch: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in OWNER_CONFIG)) continue;
    if (value == null) continue;
    const isSecret = OWNER_CONFIG[key as OwnerConfigKey].secret;
    // Un secret masqué (contient •) ou vide = on ne le change pas
    if (isSecret && (value === "" || value.includes("•"))) continue;
    await setConfigValue(key as OwnerConfigKey, value);
  }
}
