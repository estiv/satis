"use server";

import { revalidatePath } from "next/cache";
import type { DressCategory } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { bool, num, opt, str, type ActionState } from "@/lib/form";
import { DRESS_SIZES } from "@/core/labels";
import { dec } from "@/core/money";
import { saveDressPhoto } from "@/lib/uploads";

function revalidateDressPaths(id?: string) {
  revalidatePath("/app/dresses");
  revalidatePath("/occasional");
  revalidatePath("/bridesmaid");
  revalidatePath("/");
  if (id) {
    revalidatePath(`/app/dresses/${id}`);
    revalidatePath(`/dresses/${id}`);
  }
}

export async function saveDress(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireUser(["ADMIN", "STAFF"]);
  const id = opt(formData, "id");
  const name = str(formData, "name");
  const category = str(formData, "category") as DressCategory;
  if (!name) return { error: "Name is required." };
  if (category !== "OCCASIONAL" && category !== "BRIDESMAID") {
    return { error: "Category must be Occasional or Bridesmaid." };
  }

  const qtyTotal = Math.min(24, Math.max(1, Math.floor(num(formData, "qtyTotal") || 1)));
  const sizes = formData
    .getAll("sizes")
    .map((value) => String(value).trim())
    .filter(Boolean);
  if (sizes.length !== qtyTotal) return { error: "Choose a size for each dress in stock." };
  if (sizes.some((size) => !DRESS_SIZES.includes(size as (typeof DRESS_SIZES)[number]))) {
    return { error: "Choose a size from the list." };
  }

  const rentalLow = Math.max(0, num(formData, "rentalPrice"));
  const rentalHigh = Math.max(0, num(formData, "rentalPriceMax"));
  if (rentalHigh < rentalLow) return { error: "Highest rental price must be at least the lowest." };

  const data = {
    name,
    category,
    size: sizes.join(", "),
    color: opt(formData, "color") ?? null,
    notes: opt(formData, "notes") ?? null,
    qtyTotal,
    rentalPrice: dec(rentalLow),
    rentalPriceMax: dec(rentalHigh),
    depositAmount: dec(Math.max(0, num(formData, "depositAmount"))),
    listedPublic: bool(formData, "listedPublic"),
  };

  let dressId = id;
  if (id) {
    await prisma.dress.update({ where: { id }, data });
    await audit(actor, "update", "Dress", id, `Updated ${name}`);
  } else {
    const created = await prisma.dress.create({ data });
    dressId = created.id;
    await audit(actor, "create", "Dress", created.id, `Created ${name}`);
  }

  const file = formData.get("photo");
  if (file instanceof File && file.size > 0 && dressId) {
    const photoPath = await saveDressPhoto(file, dressId);
    await prisma.dress.update({ where: { id: dressId }, data: { photoPath } });
  }

  revalidateDressPaths(dressId);
  return { ok: true, id: dressId };
}

export async function deleteDress(formData: FormData) {
  const actor = await requireUser(["ADMIN", "STAFF"]);
  const id = str(formData, "id");
  const dress = await prisma.dress.findUnique({ where: { id } });
  if (!dress) return;
  await prisma.dress.update({ where: { id }, data: { deletedAt: new Date(), listedPublic: false } });
  await audit(actor, "delete", "Dress", id, `Soft-deleted ${dress.name}`);
  revalidateDressPaths(id);
}
