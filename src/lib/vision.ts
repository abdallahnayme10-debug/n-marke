import { prisma } from "./db";

// Recherche par image — N-marke
// Phase 1 : si aucune clé Google Vision / Clarifai n'est configurée,
// on fait une "simulation" basée sur la catégorie dominante / la couleur moyenne.
// La photo est analysée PUIS supprimée : elle n'est jamais stockée.

export type VisionResult = {
  labels: string[];
  dominantColor: string;
  category: string | null;
};

export async function analyzeImage(buffer: Buffer): Promise<VisionResult> {
  // En mode réel, on appellerait Google Vision API (LABEL_DETECTION) ou Clarifai.
  // Ici : analyse légère côté serveur (couleur dominante) + mapping de catégories.
  const color = await dominantColor(buffer);
  const category = guessCategory(color);

  // Simulation de libellés — à remplacer par la vraie API en phase 2.
  const labels = category
    ? [category]
    : ["produit", "objet", "marché"];

  return { labels, dominantColor: color, category };
}

function guessCategory(hex: string): string | null {
  const { r, g, b } = hexToRgb(hex);
  if (g > r && g > b && g > 90) return "Agriculture et jardin";
  if (r > 140 && g < 110 && b < 110) return "Vêtements et chaussures";
  if (b > r && b > g) return "Électronique et informatique";
  return null;
}

async function dominantColor(buffer: Buffer): Promise<string> {
  try {
    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(buffer)
      .resize(8, 8, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let r = 0,
      g = 0,
      b = 0;
    const n = info.width * info.height;
    for (let i = 0; i < data.length; i += 3) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    return rgbToHex(Math.round(r / n), Math.round(g / n), Math.round(b / n));
  } catch {
    return "#cccccc";
  }
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** Log la recherche visuelle (pour stats admin) sans conserver la photo. */
export async function logVisionSearch(query: string, userId?: string) {
  await prisma.searchLog.create({
    data: { query, type: "vision", userId },
  });
}
