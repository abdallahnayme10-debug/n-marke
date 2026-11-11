import { createHash } from "crypto";

// Stockage d'images sur Cloudinary (obligatoire sur Vercel, où le système de
// fichiers est en lecture seule). En local sans clés, on garde le stockage fichier.

export function cloudinaryEnabled(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

/** Téléverse une image (déjà traitée) sur Cloudinary et renvoie son URL. */
export async function uploadToCloudinary(buffer: Buffer, folder = "nmarke"): Promise<string | null> {
  if (!cloudinaryEnabled()) return null;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Signature signée : paramètres triés + clé secrète
  const params: Record<string, string> = { api_key: apiKey, folder, timestamp };
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + apiSecret).digest("hex");

  const form = new FormData();
  form.append("file", `data:image/jpeg;base64,${buffer.toString("base64")}`);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("signature", signature);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.secure_url || data.url || null;
  } catch {
    return null;
  }
}
