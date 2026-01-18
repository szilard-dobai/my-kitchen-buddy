import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/login", "/register", '/']

export const middleware = (request: NextRequest) => {
  const sessionCookie = request.cookies.get("better-auth.session_token")
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (!sessionCookie && !isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (sessionCookie && isPublicPath) {
    return NextResponse.redirect(new URL("/recipes", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.png|apple-icon.png|manifest-icon-.*\\.png|favicon-.*\\.png).*)",
  ],
}
