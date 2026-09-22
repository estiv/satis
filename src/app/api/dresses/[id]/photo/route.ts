import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dressPhotoDiskPath } from "@/lib/uploads";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const dress = await prisma.dress.findFirst({
    where: { id, deletedAt: null },
    select: { photoPath: true },
  });
  if (!dress?.photoPath) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const buf = await readFile(dressPhotoDiskPath(dress.photoPath));
    const ext = dress.photoPath.split(".").pop()?.toLowerCase();
    const type =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : "image/jpeg";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
