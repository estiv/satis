"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { hashPassword, requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { num, opt, str, type ActionState } from "@/lib/form";
import { COMPANY_SETTINGS_ID, COMPANY_DEFAULT } from "@/core/app-version";
import { dec } from "@/core/money";

export async function saveUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireUser(["ADMIN"]);
  const id = opt(formData, "id");
  const email = str(formData, "email").toLowerCase();
  const name = str(formData, "name");
  const role = str(formData, "role") as Role;
  const password = str(formData, "password");
  if (!email || !name || !role) return { error: "Name, email and role are required." };
  if (role !== "ADMIN" && role !== "STAFF") return { error: "Invalid role." };

  if (id) {
    const data: {
      email: string;
      name: string;
      role: Role;
      active: boolean;
      passwordHash?: string;
    } = {
      email,
      name,
      role,
      active: str(formData, "active") !== "0",
    };
    if (password) data.passwordHash = await hashPassword(password);
    await prisma.user.update({ where: { id }, data });
    await audit(actor, "update", "User", id, `Updated ${email}`);
    revalidatePath("/app/admin/users");
    return { ok: true, id };
  }

  if (!password || password.length < 6) return { error: "Password must be at least 6 characters." };
  const user = await prisma.user.create({
    data: {
      email,
      name,
      role,
      passwordHash: await hashPassword(password),
      active: true,
    },
  });
  await audit(actor, "create", "User", user.id, `Created ${email} as ${role}`);
  revalidatePath("/app/admin/users");
  return { ok: true, id: user.id };
}

export async function deleteUser(formData: FormData) {
  const actor = await requireUser(["ADMIN"]);
  const id = str(formData, "id");
  if (id === actor.id) return;
  await prisma.user.update({ where: { id }, data: { active: false } });
  await audit(actor, "delete", "User", id, "Deactivated user");
  revalidatePath("/app/admin/users");
}

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireUser(["ADMIN"]);
  await prisma.companySettings.upsert({
    where: { id: COMPANY_SETTINGS_ID },
    create: {
      id: COMPANY_SETTINGS_ID,
      name: str(formData, "name") || COMPANY_DEFAULT,
      phone: opt(formData, "phone") ?? null,
      address: opt(formData, "address") ?? null,
      aboutText: opt(formData, "aboutText") ?? null,
      currency: str(formData, "currency") || "ETB",
      defaultDeposit: dec(num(formData, "defaultDeposit")),
      enabledModules: str(formData, "enabledModules") || "[]",
    },
    update: {
      name: str(formData, "name") || COMPANY_DEFAULT,
      phone: opt(formData, "phone") ?? null,
      address: opt(formData, "address") ?? null,
      aboutText: opt(formData, "aboutText") ?? null,
      currency: str(formData, "currency") || "ETB",
      defaultDeposit: dec(num(formData, "defaultDeposit")),
      enabledModules: str(formData, "enabledModules") || "[]",
    },
  });
  await audit(actor, "update", "CompanySettings", COMPANY_SETTINGS_ID, "Updated shop settings");
  revalidatePath("/app/admin/settings");
  revalidatePath("/");
  revalidatePath("/contact");
  return { ok: true };
}
