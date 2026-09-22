import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ROOT = path.join(process.cwd(), "uploads", "dresses");

export async function saveDressPhoto(file: File, dressId: string) {
  const raw = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const ext = ["jpg", "jpeg", "png", "webp", "gif"].includes(raw) ? raw : "jpg";
  await mkdir(ROOT, { recursive: true });
  const filename = `${dressId}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(ROOT, filename), buf);
  return `dresses/${filename}`;
}

export function dressPhotoDiskPath(relative: string) {
  return path.join(process.cwd(), "uploads", relative);
}
