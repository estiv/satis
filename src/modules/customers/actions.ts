"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { opt, str, type ActionState } from "@/lib/form";

export async function saveCustomer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireUser(["ADMIN", "STAFF"]);
  const id = opt(formData, "id");
  const name = str(formData, "name");
  if (!name) return { error: "Name is required." };
  const data = {
    name,
    phone: opt(formData, "phone") ?? null,
    notes: opt(formData, "notes") ?? null,
  };
  if (id) {
    await prisma.customer.update({ where: { id }, data });
    await audit(actor, "update", "Customer", id, `Updated ${name}`);
    revalidatePath("/app/customers");
    return { ok: true, id };
  }
  const created = await prisma.customer.create({ data });
  await audit(actor, "create", "Customer", created.id, `Created ${name}`);
  revalidatePath("/app/customers");
  return { ok: true, id: created.id };
}

export async function deleteCustomer(formData: FormData) {
  const actor = await requireUser(["ADMIN", "STAFF"]);
  const id = str(formData, "id");
  await prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit(actor, "delete", "Customer", id, "Soft-deleted customer");
  revalidatePath("/app/customers");
}
