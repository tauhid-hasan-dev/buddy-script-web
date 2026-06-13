import { NextResponse, type NextRequest } from "next/server";

// Optimistic auth check only: the JWT is issued and verified by the Express
// API. Here we just check that the cookie exists to route users — a stale or
// forged cookie reaches /feed but every API call it makes still returns 401.
const AUTH_COOKIE = "token";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  if (
    !isAuthenticated &&
    (pathname.startsWith("/feed") || pathname.startsWith("/profile"))
  ) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    isAuthenticated &&
    (pathname === "/" || pathname === "/login" || pathname === "/register")
  ) {
    return NextResponse.redirect(new URL("/feed", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/feed/:path*", "/profile/:path*", "/profile", "/login", "/register"],
};
