import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED_LOCALES = ["en", "zh-cn"];

export default function proxy(request: NextRequest) {
  const lang =
    request.nextUrl.searchParams.get("lang") ||
    request.nextUrl.searchParams.get("locale");

  if (lang && SUPPORTED_LOCALES.includes(lang.toLowerCase())) {
    const normalized = lang.toLowerCase();
    const response = NextResponse.next();
    response.cookies.set("NEXT_LOCALE", normalized, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    response.cookies.set("locale", normalized, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
