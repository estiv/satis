import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/** Paths that never require login (public shop + assets). */
function isPublic(pathname: string) {
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/contact" ||
    pathname === "/occasional" ||
    pathname === "/bridesmaid" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/icon.svg" ||
    pathname === "/icon.png" ||
    pathname === "/logo.png" ||
    pathname.startsWith("/dresses/") ||
    pathname.startsWith("/api/dresses/") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/_next") ||
    /\.(png|jpg|jpeg|svg|ico|webmanifest|txt|webp|gif)$/.test(pathname)
  ) {
    return true;
  }
  return false;
}

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "dev-only");
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Staff area and staff APIs require a session
  const needsAuth =
    pathname.startsWith("/app") ||
    pathname.startsWith("/api/export") ||
    pathname.startsWith("/api/receipts");

  if (!needsAuth && isPublic(pathname)) {
    return NextResponse.next();
  }

  if (!needsAuth) {
    // Unknown non-staff routes stay open (future public pages)
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, secret());
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
