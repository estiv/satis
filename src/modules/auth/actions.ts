"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearSession, createSession, verifyPassword } from "@/lib/auth";
import { str } from "@/lib/form";

export async function loginAction(formData: FormData) {
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");
  const next = str(formData, "next") || "/app/dashboard";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    redirect("/login?error=Invalid+email+or+password");
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) redirect("/login?error=Invalid+email+or+password");
  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  const dest = next.startsWith("/app") || next === "/" ? next : "/app/dashboard";
  redirect(dest.startsWith("/") ? dest : "/app/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
