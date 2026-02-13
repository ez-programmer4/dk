import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AuthUser } from "./lib/auth";
import { prisma } from "./lib/prisma";

export default withAuth(
  async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const token = (req as any).nextauth.token as AuthUser | null;

    // If the user is authenticated, prevent them from accessing login pages
    if (token) {
      if (
        pathname.startsWith("/login") ||
        pathname.startsWith("/teachers/login") ||
        pathname.startsWith("/super-admin/login")
      ) {
        const role = token.role;
        const url =
          role === "teacher"
            ? "/teachers/dashboard"
            : role === "admin"
            ? "/admin"
            : role === "superAdmin"
            ? "/super-admin/dashboard"
            : role === "controller"
            ? "/controller"
            : "/dashboard"; // Default for registral
        return NextResponse.redirect(new URL(url, req.url));
      }

      // Role-based route protection
      if (pathname.startsWith("/teachers") && token.role !== "teacher") {
        return NextResponse.redirect(
          new URL("/login?error=AccessDenied", req.url)
        );
      }
      if (
        pathname.startsWith("/admin") &&
        token.role !== "admin" &&
        token.role !== "superAdmin"
      ) {
        return NextResponse.redirect(
          new URL("/login?error=AccessDenied", req.url)
        );
      }
      if (pathname.startsWith("/super-admin") && token.role !== "superAdmin") {
        return NextResponse.redirect(
          new URL("/super-admin/login?error=AccessDenied", req.url)
        );
      }
      if (pathname.startsWith("/controller") && token.role !== "controller") {
        return NextResponse.redirect(
          new URL("/login?error=AccessDenied", req.url)
        );
      }
      if (pathname.startsWith("/dashboard") && token.role !== "registral") {
        return NextResponse.redirect(
          new URL("/login?error=AccessDenied", req.url)
        );
      }

      // Check school status for school-specific routes
      // Extract school slug from paths like /[schoolSlug]/admin/... or /[schoolSlug]/teachers/...
      const schoolRouteMatch = pathname.match(/^\/([^\/]+)\/(admin|teachers|students|dashboard)/);
      if (schoolRouteMatch && token.schoolSlug) {
        const [, urlSchoolSlug] = schoolRouteMatch;

        // If the URL school slug doesn't match the user's school slug, deny access
        if (urlSchoolSlug !== token.schoolSlug) {
          return NextResponse.redirect(
            new URL("/login?error=AccessDenied", req.url)
          );
        }

        // Check if the school is active
        try {
          const school = await prisma.school.findUnique({
            where: { slug: token.schoolSlug },
            select: { status: true, name: true },
          });

          if (!school || school.status !== "active") {
            // School is inactive or doesn't exist
            // For teachers, redirect to their specific school login page
            const teacherLoginPath = `/${token.schoolSlug}/teachers/login?error=SchoolInactive`;
            return NextResponse.redirect(
              new URL(token.role === "teacher" ? teacherLoginPath : "/login?error=SchoolInactive", req.url)
            );
          }
        } catch (error) {
          console.error("Error checking school status:", error);
          // If database error, allow access but log the error
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        // Login pages are always accessible, the logic inside middleware handles redirects
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/teachers/login") ||
          pathname.startsWith("/super-admin/login")
        ) {
          return true;
        }

        // For any other page, a token is required.
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/super-admin/:path*",
    "/controller/:path*",
    "/dashboard/:path*",
    "/teachers/:path*",
    "/login",
    "/teachers/login",
    "/super-admin/login",
  ],
};
