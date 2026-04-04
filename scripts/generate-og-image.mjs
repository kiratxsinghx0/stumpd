/**
 * Rasterize public/stumpd_og_image.svg → public/og-image.png (1200×630)
 * for Open Graph / WhatsApp link previews. Run: npm run generate-og-image
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const root = path.join(__dirname, "..");
const svgPath = path.join(root, "public", "stumpd_og_image.svg");
const outPath = path.join(root, "public", "og-image.png");

await sharp(svgPath)
  .resize(1200, 630, { fit: "cover", position: "top" })
  .png({ compressionLevel: 9 })
  .toFile(outPath);

console.log("Wrote", outPath);
