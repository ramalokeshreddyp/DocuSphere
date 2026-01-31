import { NextResponse } from "next/server";

const PUBLIC_FILE = /\.[^/]+$/;
const SUPPORTED_LOCALES = ["en", "es", "fr", "de"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const hasLocale = segments.length > 0 && SUPPORTED_LOCALES.includes(segments[0]);

  if (!hasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"]
};
