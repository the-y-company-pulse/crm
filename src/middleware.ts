import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if user has auth token
  const token = request.cookies.get("authjs.session-token")?.value ||
                request.cookies.get("__Secure-authjs.session-token")?.value

  const isLoggedIn = !!token

  console.log("Middleware:", { pathname, isLoggedIn, hasToken: !!token })

  // Allow login page
  if (pathname === "/login") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  // Protect all other routes
  if (!isLoggedIn) {
    console.log("Redirecting to /login")
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
