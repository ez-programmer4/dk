/**
 * Tenant Security Utilities
 *
 * Security helpers for ensuring data isolation and preventing cross-tenant access
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getTenantContext,
  validateTenantAccess,
  TenantContext,
} from "./tenant-context";
import { AuthUser } from "./auth";

/**
 * Middleware wrapper for API routes that require tenant validation
 *
 * Usage:
 * export async function GET(req: NextRequest) {
 *   const context = await requireTenantAccess(req, ["admin", "controller"]);
 *   // Use context.schoolId for queries
 * }
 */
export async function requireTenantAccess(
  req: NextRequest,
  allowedRoles?: AuthUser["role"][]
): Promise<TenantContext> {
  try {
    return await validateTenantAccess(req, allowedRoles);
  } catch (error: any) {
    throw error; // Re-throw to be caught by route handler
  }
}

/**
 * Safe wrapper for API routes - returns error response instead of throwing
 *
 * Usage:
 * export async function GET(req: NextRequest) {
 *   const contextResult = await safeTenantAccess(req, ["admin"]);
 *   if (contextResult.error) {
 *     return contextResult.error;
 *   }
 *   const context = contextResult.context;
 *   // Use context...
 * }
 */
export async function safeTenantAccess(
  req: NextRequest,
  allowedRoles?: AuthUser["role"][]
): Promise<
  | { context: TenantContext; error: null }
  | { context: null; error: NextResponse }
> {
  try {
    const context = await validateTenantAccess(req, allowedRoles);
    return { context, error: null };
  } catch (error: any) {
    const status =
      error.message.includes("Unauthorized") ||
      error.message.includes("No session")
        ? 401
        : error.message.includes("Forbidden")
        ? 403
        : 500;

    return {
      context: null,
      error: NextResponse.json(
        { error: error.message || "Access denied" },
        { status }
      ),
    };
  }
}

/**
 * Validate that a resource belongs to the tenant
 * Use this before updating/deleting resources
 */
export function validateResourceOwnership(
  resourceSchoolId: string | null,
  context: TenantContext
): boolean {
  // Super admin can access any resource
  if (context.isSuperAdmin) {
    return true;
  }

  // Darulkubra resources have null schoolId
  if (context.isDarulkubra) {
    return resourceSchoolId === null;
  }

  // Multi-tenant resources must match schoolId
  return resourceSchoolId === context.schoolId;
}

/**
 * Assert resource ownership - throws if validation fails
 */
export function assertResourceOwnership(
  resourceSchoolId: string | null,
  context: TenantContext,
  resourceType: string = "Resource"
): void {
  if (!validateResourceOwnership(resourceSchoolId, context)) {
    throw new Error(
      `${resourceType} does not belong to your school or you don't have access`
    );
  }
}

/**
 * Create audit log entry for tenant access
 * (Can be extended to log to database)
 */
export function auditTenantAccess(
  context: TenantContext,
  action: string,
  resourceId?: string,
  details?: Record<string, any>
): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[Tenant Audit]", {
      schoolId: context.schoolId,
      schoolSlug: context.schoolSlug,
      isDarulkubra: context.isDarulkubra,
      action,
      resourceId,
      details,
      timestamp: new Date().toISOString(),
    });
  }
  // TODO: Implement actual audit logging to database
}
