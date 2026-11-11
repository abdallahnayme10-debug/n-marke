import sharp from "sharp";

// Filigrane N-marke appliqué aux photos des vendeurs (protection + branding).
// Position personnalisable pour les vendeurs premium.

export type WatermarkPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

const POSITION_MAP: Record<WatermarkPosition, "southeast" | "southwest" | "northeast" | "northwest"> = {
  "bottom-right": "southeast",
  "bottom-left": "southwest",
  "top-right": "northeast",
  "top-left": "northwest",
};

function watermarkSvg(text: string, width: number): Buffer {
  const fontSize = Math.max(18, Math.round(width / 24));
  const pad = Math.round(fontSize * 0.5);
  const svg = `<svg width="${Math.round(width * 0.55)}" height="${fontSize + pad * 2}">
    <g>
      <text x="${pad}" y="${fontSize + pad / 2}" font-family="Arial, sans-serif" font-size="${fontSize}"
        font-weight="bold" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.35)" stroke-width="1">${text}</text>
    </g>
  </svg>`;
  return Buffer.from(svg);
}

export async function processListingImage(
  buffer: Buffer,
  opts: { watermark?: boolean; position?: WatermarkPosition; width?: number; quality?: number } = {}
): Promise<Buffer> {
  const { watermark = true, position = "bottom-right", width = 1000, quality = 72 } = opts;

  let img = sharp(buffer).rotate().resize({ width, withoutEnlargement: true }).jpeg({ quality, progressive: true });

  if (watermark) {
    const meta = await sharp(buffer).metadata();
    const w = meta.width || width;
    const overlay = watermarkSvg("N-marke", w);
    const gravity = POSITION_MAP[position] || "southeast";
    img = img.composite([{ input: overlay, gravity }]);
  }

  return img.toBuffer();
}

export async function processAvatar(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).rotate().resize(256, 256, { fit: "cover" }).jpeg({ quality: 70 }).toBuffer();
}
