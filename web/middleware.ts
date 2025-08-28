import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Get the user from the response headers
  const user = response.headers.get("x-user");

  // Check if the user is trying to access protected routes
  const { pathname } = request.nextUrl;
  const isProtectedRoute = pathname === "/" || pathname.startsWith("/sites");
  const isAuthRoute = pathname.startsWith("/auth");

  // If accessing protected route without user, redirect to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/auth/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing auth route with user, redirect to home
  if (isAuthRoute && user) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
