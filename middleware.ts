import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Handle admin routes
    if (pathname.startsWith('/admin')) {
      // If user is admin and accessing old admin routes, redirect to school-specific routes
      if (token?.role === 'admin' && token?.schoolSlug) {
        // Check if accessing old admin routes (not already school-specific)
        const adminPathRegex = /^\/admin\/(?!(\[schoolSlug\]|login|dashboard|schools|plans|billing|analytics|usage|settings|users)).*$/;
        if (adminPathRegex.test(pathname)) {
          // Extract the path after /admin/
          const pathAfterAdmin = pathname.replace('/admin/', '');
          // Redirect to school-specific route
          const newUrl = new URL(`/admin/${token.schoolSlug}/${pathAfterAdmin}`, req.url);
          return NextResponse.redirect(newUrl);
        }
      }

      // If admin user doesn't have school access, redirect to login
      if (token?.role === 'admin' && !token?.schoolId) {
        const loginUrl = new URL('/login', req.url);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Handle other role redirections
    if (token) {
      const userRole = token.role;
      const schoolSlug = token.schoolSlug;

      // Redirect teachers to their school dashboard
      if (userRole === 'teacher' && schoolSlug && pathname === '/teachers') {
        const teacherUrl = new URL(`/teachers/${schoolSlug}/dashboard`, req.url);
        return NextResponse.redirect(teacherUrl);
      }

      // Redirect controllers to their school dashboard
      if (userRole === 'controller' && schoolSlug && pathname === '/controller') {
        const controllerUrl = new URL(`/controller/${schoolSlug}/dashboard`, req.url);
        return NextResponse.redirect(controllerUrl);
      }

      // Redirect registrars to their school dashboard
      if (userRole === 'registral' && schoolSlug && pathname === '/registral') {
        const registralUrl = new URL(`/registral/${schoolSlug}/earnings`, req.url);
        return NextResponse.redirect(registralUrl);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes that don't require authentication
        if (
          pathname.startsWith('/login') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/admin/login') ||
          pathname === '/' ||
          pathname.startsWith('/privacy-policy') ||
          pathname.startsWith('/terms-of-service') ||
          pathname.startsWith('/registration') ||
          pathname.startsWith('/dashboard') ||
          pathname.startsWith('/teachers/login') ||
          pathname.startsWith('/parent/login') ||
          pathname.startsWith('/controller/login')
        ) {
          return true;
        }

        // Super admin routes
        if (pathname.startsWith('/super-admin')) {
          return token?.role === 'superAdmin';
        }

        // School-specific admin routes
        if (pathname.startsWith('/admin/') && !pathname.startsWith('/admin/login')) {
          return token?.role === 'admin' && !!token?.schoolId;
        }

        // Teacher routes
        if (pathname.startsWith('/teachers/')) {
          return token?.role === 'teacher' && !!token?.schoolId;
        }

        // Controller routes
        if (pathname.startsWith('/controller/')) {
          return token?.role === 'controller' && !!token?.schoolId;
        }

        // Registral routes
        if (pathname.startsWith('/registral/')) {
          return token?.role === 'registral' && !!token?.schoolId;
        }

        // Parent routes
        if (pathname.startsWith('/parent/')) {
          return token?.role === 'parent';
        }

        // Student routes
        if (pathname.startsWith('/student/')) {
          return token?.role === 'student';
        }

        // API routes - let them handle their own authentication
        if (pathname.startsWith('/api/')) {
          return true;
        }

        // Default deny
        return false;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};





