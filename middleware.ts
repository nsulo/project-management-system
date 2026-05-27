import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export function middleware(
  request: NextRequest
) {

  const accessToken =
    request.cookies.get(
      "sb-access-token"
    );

  const role =
    request.cookies.get(
      "user-role"
    )?.value;

  const pathname =
    request.nextUrl.pathname;

  // Public routes

  if (
    pathname === "/" ||
    pathname === "/login"
  ) {

    return NextResponse.next();
  }

  // Not logged in

  if (!accessToken) {

    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );
  }

  // Admin routes

  if (
    pathname.startsWith(
      "/admin"
    ) &&
    role !== "admin"
  ) {

    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );
  }

  // Technician routes

  if (
    pathname.startsWith(
      "/technician"
    ) &&
    role !== "technician"
  ) {

    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );
  }

  // Client routes

  if (
    pathname.startsWith(
      "/client"
    ) &&
    role !== "client"
  ) {

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