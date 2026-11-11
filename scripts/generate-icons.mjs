// Génère les icônes PNG de l'application à partir du logo SVG (via sharp).
// Usage : node scripts/generate-icons.mjs
import sharp from "sharp";

const sizes = [
  { file: "public/icon-192.png", size: 192 },
  { file: "public/icon-512.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
  { file: "public/icon-maskable-512.png", size: 512, pad: 40, bg: "#3579AC" },
];

for (const s of sizes) {
  let img = sharp("public/icon.svg").resize(s.size, s.size);
  if (s.pad) {
    img = img.extend({
      top: s.pad,
      bottom: s.pad,
      left: s.pad,
      right: s.pad,
      background: s.bg,
    }).resize(s.size, s.size);
  }
  await img.png().toFile(s.file);
  console.log("✓", s.file);
}
console.log("Icônes générées ✅");
