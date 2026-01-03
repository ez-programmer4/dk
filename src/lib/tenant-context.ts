/**
 * Tenant Context Utilities
 *
 * Provides utilities for managing tenant (school) context in multi-tenant operations.
 * Ensures data isolation and security across all API routes.
 */

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { AuthUser } from "./auth";
import { prisma } from "./prisma";

export interface TenantContext {
  schoolId: string | null;
  schoolSlug: string | null;
  isDarulkubra: boolean;
  isSuperAdmin: boolean;
  school?: {
    id: string;
    name: string;
    slug: string;
    status: string;
  } | null;
}

/**
 * Extract school slug from request path
 * Path format: /schools/{slug}/...
 */
export function extractSchoolSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/schools\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * Get tenant context from request
 * This is the main function to use in API routes
 */
export async function getTenantContext(
  req: NextRequest
): Promise<TenantContext> {
  const session = await getServerSession(authOptions);
  const pathname = req.nextUrl.pathname;

  // Super admin has no tenant context (platform-wide access)
  if (session?.user.role === "superAdmin") {
    return {
      schoolId: null,
      schoolSlug: null,
      isDarulkubra: false,
      isSuperAdmin: true,
      school: null,
    };
  }

  // Extract school slug from path
  const pathSchoolSlug = extractSchoolSlugFromPath(pathname);

  // Get schoolId from session or path
  let schoolId: string | null = null;
  let schoolSlug: string | null = null;

  if (session?.user.schoolId) {
    schoolId = session.user.schoolId;
    schoolSlug = session.user.schoolSlug || null;
  } else if (pathSchoolSlug) {
    // If we have path slug but no session schoolId, fetch school by slug
    const school = await prisma.school.findUnique({
      where: { slug: pathSchoolSlug },
      select: { id: true, name: true, slug: true, status: true },
    });
    if (school) {
      schoolId = school.id;
      schoolSlug = school.slug;
    }
  }

  // Determine if this is darulkubra (legacy system)
  // Darulkubra has no schoolId in session
  const isDarulkubra = !schoolId && !pathSchoolSlug;

  // Fetch school details if we have schoolId
  let school = null;
  if (schoolId) {
    school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, slug: true, status: true },
    });
  }

  return {
    schoolId,
    schoolSlug,
    isDarulkubra,
    isSuperAdmin: false,
    school,
  };
}

/**
 * Validate tenant access - ensures user can only access their school's data
 * Throws error if validation fails
 */
export async function validateTenantAccess(
  req: NextRequest,
  requiredRole?: AuthUser["role"][]
): Promise<TenantContext> {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Unauthorized - No session found");
  }

  // Super admin bypasses tenant validation
  if (session.user.role === "superAdmin") {
    return getTenantContext(req);
  }

  // Check role if specified
  if (requiredRole && !requiredRole.includes(session.user.role)) {
    throw new Error(`Forbidden - Required role: ${requiredRole.join(", ")}`);
  }

  const context = await getTenantContext(req);

  // For multi-tenant routes, schoolId is required
  if (req.nextUrl.pathname.startsWith("/api/schools/")) {
    if (!context.schoolId && !context.isSuperAdmin) {
      throw new Error(
        "Forbidden - School context required for multi-tenant operations"
      );
    }

    // Verify user's schoolId matches path school slug
    const pathSchoolSlug = extractSchoolSlugFromPath(req.nextUrl.pathname);
    if (
      pathSchoolSlug &&
      session.user.schoolSlug &&
      session.user.schoolSlug !== pathSchoolSlug
    ) {
      throw new Error("Forbidden - School mismatch");
    }
  }

  return context;
}

/**
 * Get schoolId for query filtering
 * Returns null for darulkubra, schoolId for multi-tenant schools
 */
export function getSchoolIdForQuery(context: TenantContext): string | null {
  if (context.isDarulkubra || context.isSuperAdmin) {
    return null;
  }
  return context.schoolId;
}

/**
 * Build where clause with tenant filtering
 * Use this helper to ensure all queries are tenant-scoped
 */
export function withTenantFilter<T extends { schoolId?: string | null }>(
  where: T,
  context: TenantContext
): T & { schoolId: string | null } {
  const schoolId = getSchoolIdForQuery(context);

  return {
    ...where,
    schoolId: schoolId,
  };
}

/**
 * Check if a route is a legacy darulkubra route
 */
export function isLegacyRoute(pathname: string): boolean {
  const legacyRoutes = [
    "/api/admin",
    "/api/teachers",
    "/api/students",
    "/api/registral",
    "/api/control-options",
    "/api/payments",
    "/api/attendance-list",
    "/api/reports",
    "/api/analytics",
  ];

  return legacyRoutes.some((route) => pathname.startsWith(route));
}

/**
 * Check if a route is a multi-tenant route
 */
export function isMultiTenantRoute(pathname: string): boolean {
  return pathname.startsWith("/api/schools/");
}
