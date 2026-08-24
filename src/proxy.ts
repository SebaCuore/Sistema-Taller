import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt, COOKIE_NAME } from "@/lib/session";

const RUTA_LOGIN = "/login";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const session = await decrypt(cookie);

  if (!session && pathname !== RUTA_LOGIN) {
    return NextResponse.redirect(new URL(RUTA_LOGIN, request.url));
  }

  if (session && pathname === RUTA_LOGIN) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|renato-logo.png).*)"],
};
