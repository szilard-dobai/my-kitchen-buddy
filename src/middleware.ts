import { getSessionCookie } from "better-auth/cookies"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const guestOnlyPaths = ["/login", "/register"]

export const middleware = (request: NextRequest) => {
  const sessionCookie = getSessionCookie(request)
  const pathname = request.nextUrl.pathname

  const isGuestOnlyPath = guestOnlyPaths.some((path) => pathname.startsWith(path))
  const isHomePage = pathname === "/"

  if (!sessionCookie && !isGuestOnlyPath && !isHomePage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (sessionCookie && isGuestOnlyPath) {
    return NextResponse.redirect(new URL("/recipes", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.png|apple-icon.png|manifest-icon-.*\\.png|favicon-.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.png|.*\\.gif|.*\\.svg|.*\\.webp).*)",
  ],
}
