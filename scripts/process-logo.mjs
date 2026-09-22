import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const pdfSrc = path.join(
  process.env.USERPROFILE || "",
  "Downloads",
  "Telegram Desktop",
  "satis logo.pdf",
);
const localPdf = path.join(process.cwd(), "assets", "satis-logo.pdf");
const rasterTmp = path.join(process.cwd(), "assets", "satis-logo-raster.png");
const outPng = path.join(process.cwd(), "public", "logo.png");
const outIcon = path.join(process.cwd(), "public", "icon.png");
const outApple = path.join(process.cwd(), "public", "apple-touch-icon.png");

/** Primary brand peach from Satis logo */
const PEACH = { r: 245, g: 191, b: 204 }; // #f5bfcc

fs.mkdirSync(path.dirname(localPdf), { recursive: true });
if (fs.existsSync(pdfSrc)) {
  fs.copyFileSync(pdfSrc, localPdf);
}

if (!fs.existsSync(localPdf)) {
  throw new Error(`Missing logo PDF at ${localPdf}`);
}

// Rasterize vector PDF (black silhouette on transparent) via PyMuPDF
const py = `
import pymupdf
doc = pymupdf.open(r${JSON.stringify(localPdf)})
page = doc[0]
pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=True)
pix.save(r${JSON.stringify(rasterTmp)})
print(pix.width, pix.height)
`;
execFileSync("py", ["-c", py], { stdio: "inherit" });

const { data, info } = await sharp(rasterTmp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const px = Buffer.from(data);

for (let i = 0; i < px.length; i += 4) {
  if (px[i + 3] === 0) continue;
  // Black silhouette → brand peach; keep original alpha for soft edges
  px[i] = PEACH.r;
  px[i + 1] = PEACH.g;
  px[i + 2] = PEACH.b;
}

await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
  .trim({ threshold: 0 })
  .resize({ height: 640, fit: "inside", withoutEnlargement: false })
  .png()
  .toFile(outPng);

await sharp(outPng)
  .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(outIcon);

fs.copyFileSync(outPng, outApple);

const meta = await sharp(outPng).metadata();
console.log({
  source: localPdf,
  out: `${meta.width}x${meta.height}`,
  hasAlpha: meta.hasAlpha,
  brand: "#f5bfcc",
});
