import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { SESSION_COOKIE } from "./session-cookie";
import { hashPassword, verifyPassword } from "./password";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export { hashPassword, verifyPassword };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  const db = await prisma.user.findUnique({ where: { id: session.id } });
  if (!db || !db.active) {
    await clearSession();
    redirect("/login");
  }
  if (roles && roles.length > 0 && db.role !== "ADMIN" && !roles.includes(db.role)) {
    redirect("/app/dashboard");
  }
  return { id: db.id, email: db.email, name: db.name, role: db.role };
}

export { SESSION_COOKIE };
