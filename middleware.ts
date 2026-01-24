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

      // Redirect users without school access to school selector
      if ((userRole === 'admin' || userRole === 'teacher' || userRole === 'controller' || userRole === 'registral') && !schoolSlug) {
        // Only redirect if not already on school selector or login
        if (!pathname.startsWith('/school-selector') && !pathname.startsWith('/login')) {
          const schoolSelectorUrl = new URL('/school-selector', req.url);
          return NextResponse.redirect(schoolSelectorUrl);
        }
      }

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

      // Redirect admins to their school dashboard
      if (userRole === 'admin' && schoolSlug && pathname === '/admin') {
        const adminUrl = new URL(`/admin/${schoolSlug}`, req.url);
        return NextResponse.redirect(adminUrl);
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
          pathname.startsWith('/controller/login') ||
          pathname.startsWith('/school-selector') ||
          pathname.startsWith('/super-admin/login')
        ) {
          return true;
        }

        // Super admin routes
        if (pathname.startsWith('/super-admin')) {
          return token?.role === 'superAdmin';
        }

        // School-specific admin routes
        if (pathname.startsWith('/admin/') && !pathname.startsWith('/admin/login')) {
          // Super admins have global access to all admin routes
          if (token?.role === 'superAdmin') {
            return true;
          }

          const hasAccess = token?.role === 'admin' && !!token?.schoolId;
          // If admin but no school access, allow access to school selector
          if (token?.role === 'admin' && !token?.schoolId && !pathname.startsWith('/school-selector')) {
            return false; // Will redirect to school selector
          }
          return hasAccess;
        }

        // Teacher routes
        if (pathname.startsWith('/teachers/')) {
          const hasAccess = token?.role === 'teacher' && !!token?.schoolId;
          // If teacher but no school access, allow access to school selector
          if (token?.role === 'teacher' && !token?.schoolId && !pathname.startsWith('/school-selector')) {
            return false; // Will redirect to school selector
          }
          return hasAccess;
        }

        // Controller routes
        if (pathname.startsWith('/controller/')) {
          const hasAccess = token?.role === 'controller' && !!token?.schoolId;
          // If controller but no school access, allow access to school selector
          if (token?.role === 'controller' && !token?.schoolId && !pathname.startsWith('/school-selector')) {
            return false; // Will redirect to school selector
          }
          return hasAccess;
        }

        // Registral routes
        if (pathname.startsWith('/registral/')) {
          const hasAccess = token?.role === 'registral' && !!token?.schoolId;
          // If registral but no school access, allow access to school selector
          if (token?.role === 'registral' && !token?.schoolId && !pathname.startsWith('/school-selector')) {
            return false; // Will redirect to school selector
          }
          return hasAccess;
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














