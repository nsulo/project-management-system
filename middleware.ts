import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export function middleware(
  request: NextRequest
) {

  const accessToken =
    request.cookies.get(
      "sb-access-token"
    );

  const pathname =
    request.nextUrl.pathname;

  // Allow public pages

  if (
    pathname === "/" ||
    pathname === "/login"
  ) {

    return NextResponse.next();
  }

  // Redirect if not logged in

  if (!accessToken) {

    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/technician/:path*",
    "/client/:path*",
    "/settings/:path*",
    "/notifications/:path*",
  ],
};