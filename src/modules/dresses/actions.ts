"use server";

import { revalidatePath } from "next/cache";
import type { DressCategory } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { bool, num, opt, str, type ActionState } from "@/lib/form";
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

  const data = {
    name,
    category,
    size: opt(formData, "size") ?? null,
    color: opt(formData, "color") ?? null,
    notes: opt(formData, "notes") ?? null,
    qtyTotal: Math.max(0, Math.floor(num(formData, "qtyTotal") || 1)),
    rentalPrice: dec(num(formData, "rentalPrice")),
    depositAmount: dec(num(formData, "depositAmount")),
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
