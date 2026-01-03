# Multi-Tenant SaaS Implementation Plan

## Comprehensive Discussion Document

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Multi-Tenancy Strategy Selection](#multi-tenancy-strategy-selection)
3. [Database Architecture](#database-architecture)
4. [Authentication & Authorization](#authentication--authorization)
5. [API & Middleware Changes](#api--middleware-changes)
6. [Configuration Management](#configuration-management)
7. [Payment & Subscription System](#payment--subscription-system)
8. [Data Migration Strategy](#data-migration-strategy)
9. [Security Considerations](#security-considerations)
10. [Performance & Scalability](#performance--scalability)
11. [Implementation Phases](#implementation-phases)
12. [Testing Strategy](#testing-strategy)
13. [Rollout Plan](#rollout-plan)

---

## Executive Summary

### Current State

- **Single-tenant application** for "darulkubra" school
- MySQL database with Prisma ORM
- Next.js 14 with NextAuth authentication
- Multiple user roles: admin, teacher, controller, registral, student, parent
- Stripe integration for payments/subscriptions
- Zoom integration for virtual classes
- Complex salary calculation system
- No school/organization identifier in any model

### Target State

- **Hybrid Architecture:**
  - **Darulkubra:** Continues operating as-is (single-tenant, no changes)
  - **New Schools:** Multi-tenant SaaS platform with isolated data
- Each new school operates independently with isolated data
- Per-school configuration and customization for new schools
- Usage-based billing (per student number + feature fees) for new schools
- Centralized super-admin for platform management
- School-specific branding and settings

### Key Architectural Decision

**⚠️ IMPORTANT:** Darulkubra will **NOT** be migrated to multi-tenant system. It will continue operating exactly as it currently does. Multi-tenancy is **ONLY** for new schools.

### Key Challenges

1. Building multi-tenancy alongside existing single-tenant system
2. Ensuring data security and privacy between new schools
3. Managing per-school configurations for new schools
4. Implementing usage-based billing for new schools
5. **NOT migrating darulkubra** - keeping it completely separate
6. Code sharing between darulkubra (single-tenant) and new schools (multi-tenant)
7. Routing logic to determine which system to use

---

## Dual System Architecture

### Overview

Since **darulkubra will continue as-is**, we need a **dual-system architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                      │
├──────────────────────────┬────────────────────────────────┤
│   Darulkubra System      │   Multi-Tenant System          │
│   (Legacy - Unchanged)   │   (New Schools)                │
├──────────────────────────┼────────────────────────────────┤
│ • Existing routes        │ • New routes (/api/v2/*)       │
│ • No schoolId            │ • schoolId required            │
│ • Existing UI            │ • New UI with school context    │
│ • Existing auth          │ • Enhanced auth with schoolId  │
└──────────────────────────┴────────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────────┐
│                    Database Layer                          │
├──────────────────────────┬────────────────────────────────┤
│   Darulkubra Tables      │   Multi-Tenant Tables          │
│   (No schoolId)          │   (With schoolId)               │
└──────────────────────────┴────────────────────────────────┘
```

### Key Principles

1. **Darulkubra Isolation:**

   - ✅ No changes to darulkubra's database schema
   - ✅ No changes to darulkubra's API routes
   - ✅ No changes to darulkubra's UI
   - ✅ Darulkubra continues using existing authentication

2. **New Schools:**

   - ✅ New database schema with `schoolId`
   - ✅ New API routes with tenant filtering
   - ✅ New UI with school context
   - ✅ Enhanced authentication with `schoolId`

3. **Code Sharing:**
   - ✅ Shared utilities and helpers
   - ✅ Shared UI components (where possible)
   - ✅ Shared business logic (extracted to services)
   - ⚠️ Separate query logic (darulkubra vs multi-tenant)

### Routing Strategy

**Option 1: Path-Based (Recommended)**

```
/darulkubra/* → Legacy system
  /darulkubra/admin
  /darulkubra/teachers
  /darulkubra/students

/schools/{slug}/* → Multi-tenant system
  /schools/school1/admin
  /schools/school1/teachers
  /schools/school1/students

/api/* → Legacy API (darulkubra)
/api/v2/* → Multi-tenant API (new schools)
```

**Option 2: Subdomain-Based**

```
darulkubra.yourplatform.com → Legacy system
school1.yourplatform.com → Multi-tenant system
```

**Option 3: Feature Flag in Session**

```typescript
// Check user's school type
if (session.schoolId === null) {
  // Darulkubra user - use legacy routes
} else {
  // New school user - use multi-tenant routes
}
```

### Database Strategy Options

**Option A: Same Tables, Nullable schoolId (Simpler)**

```prisma
model wpos_wpdatatable_23 {
  // ... existing fields
  schoolId  String? // null for darulkubra, set for new schools
  school    School? @relation(...)
}

// Queries:
// Darulkubra: WHERE schoolId IS NULL
// New schools: WHERE schoolId = 'xxx'
```

**Pros:**

- ✅ Single set of tables
- ✅ Easier code sharing
- ✅ Simpler migrations

**Cons:**

- ⚠️ Risk of mixing data
- ⚠️ More complex query logic
- ⚠️ Harder to separate later

**Option B: Separate Tables (Safer)**

```prisma
// Legacy tables (unchanged)
model wpos_wpdatatable_23 {
  // ... existing fields (no schoolId)
}

// New multi-tenant tables
model Student_v2 {
  id        Int    @id
  schoolId  String // Required
  // ... same fields as wpos_wpdatatable_23
  school    School @relation(...)
}
```

**Pros:**

- ✅ Complete separation
- ✅ No risk to darulkubra
- ✅ Easier to understand

**Cons:**

- ❌ Code duplication
- ❌ More tables to manage
- ❌ Harder to share code

**Recommendation:** Start with **Option A** (same tables, nullable schoolId) for simplicity. Can migrate to Option B later if needed.

---

## Multi-Tenancy Strategy Selection

### Architecture Approach: Dual System

Since **darulkubra stays as-is**, we need a **dual-system architecture**:

1. **Legacy System (Darulkubra):**

   - Existing codebase unchanged
   - Existing database unchanged
   - No `schoolId` columns
   - All existing functionality preserved

2. **New Multi-Tenant System (Other Schools):**
   - New database schema with `schoolId`
   - New API routes with tenant filtering
   - Shared codebase where possible

### Strategy Options for New Schools

#### Option 1: Shared Database with Tenant ID (Recommended)

**Approach:** Single database for new schools, all tables include `schoolId` foreign key

**Pros:**

- ✅ Lower infrastructure costs
- ✅ Easier to maintain and backup
- ✅ Simpler cross-tenant analytics (if needed)
- ✅ Easier to implement shared resources
- ✅ Better for your current MySQL setup
- ✅ Darulkubra completely unaffected

**Cons:**

- ⚠️ Requires careful query filtering (data leakage risk)
- ⚠️ More complex indexes
- ⚠️ Potential performance issues at very large scale
- ⚠️ Code duplication between legacy and new system

**Best For:** Your use case (educational SaaS, moderate scale)

#### Option 2: Separate Database for New Schools

**Approach:** New schools get separate database from darulkubra

**Pros:**

- ✅ Complete separation from darulkubra
- ✅ Complete data isolation between new schools
- ✅ Easier to backup/restore individual schools
- ✅ Better performance isolation
- ✅ No risk of affecting darulkubra

**Cons:**

- ❌ Higher infrastructure costs
- ❌ More complex connection pooling
- ❌ Harder to manage migrations
- ❌ Code sharing becomes more difficult

**Best For:** Maximum safety and isolation

#### Option 3: Same Database, Different Schema Pattern

**Approach:** Same database, but new schools use tables with `schoolId`, darulkubra uses existing tables

**Pros:**

- ✅ Single database to manage
- ✅ Can share some infrastructure
- ✅ Easier code sharing

**Cons:**

- ❌ Most complex to implement
- ❌ Risk of confusion between systems
- ❌ Harder to separate if needed later

**Recommendation:** **Option 1 (Shared Database with Tenant ID for New Schools)** - Best balance, with darulkubra completely untouched.

---

## Database Architecture

### New Core Models

#### 1. School/Organization Model

```prisma
model School {
  id                    String   @id @default(cuid())
  name                  String   @db.VarChar(255)
  slug                  String   @unique @db.VarChar(100) // URL-friendly identifier
  subdomain             String?  @unique @db.VarChar(100) // Optional: school1.yourplatform.com
  domain                String?  @unique @db.VarChar(255) // Optional: custom domain

  // Contact Information
  email                 String?  @db.VarChar(255)
  phone                 String?  @db.VarChar(32)
  address               String?  @db.Text

  // Branding
  logoUrl               String?  @db.VarChar(500)
  primaryColor          String?  @db.VarChar(7) // Hex color
  secondaryColor        String?  @db.VarChar(7)

  // Subscription & Billing
  subscriptionTier      String   @default("trial") // trial, basic, premium, enterprise
  maxStudents          Int      @default(50)
  currentStudentCount   Int      @default(0)
  billingCycle         String   @default("monthly") // monthly, annual
  stripeCustomerId     String?  @unique @db.VarChar(255)
  stripeSubscriptionId String?  @db.VarChar(255)

  // Status
  status               String   @default("active") // active, suspended, cancelled
  trialEndsAt          DateTime?
  subscriptionEndsAt   DateTime?

  // Configuration
  timezone             String   @default("Africa/Addis_Ababa") @db.VarChar(50)
  defaultCurrency      String   @default("ETB") @db.VarChar(10)
  defaultLanguage      String   @default("en") @db.VarChar(10)

  // Feature Flags
  features             Json?    // { zoom: true, analytics: true, etc. }

  // Metadata
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  createdBy            String?  @db.VarChar(255) // Super admin who created

  // Relations
  students             wpos_wpdatatable_23[]
  teachers             wpos_wpdatatable_24[]
  controllers          wpos_wpdatatable_28[]
  admins               admin[]
  settings             SchoolSetting[]
  payments             SchoolPayment[]
  // ... all other tenant-scoped models
}
```

#### 2. School Settings Model

```prisma
model SchoolSetting {
  id        String   @id @default(cuid())
  schoolId  String
  key       String   @db.VarChar(100)
  value     String?  @db.Text
  type      String   @default("string") // string, number, boolean, json
  category  String?  @db.VarChar(50) // general, payment, salary, etc.

  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  @@unique([schoolId, key])
  @@index([schoolId])
}
```

#### 3. School Payment/Billing Model

```prisma
model SchoolPayment {
  id                  String   @id @default(cuid())
  schoolId            String
  amount              Decimal  @db.Decimal(10, 2)
  currency            String   @db.VarChar(10)
  period              String   @db.VarChar(7) // YYYY-MM
  studentCount        Int
  baseFee             Decimal  @db.Decimal(10, 2)
  perStudentFee       Decimal  @db.Decimal(10, 2)
  featureFees         Json?    // Additional feature charges
  totalAmount         Decimal  @db.Decimal(10, 2)
  status              String   @default("pending") // pending, paid, failed
  stripeInvoiceId     String?  @db.VarChar(255)
  paidAt              DateTime?

  school              School   @relation(fields: [schoolId], references: [id])

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([schoolId])
  @@index([period])
  @@index([status])
}
```

### Schema Modifications Required

#### All Existing Models Need `schoolId`

Every model that represents tenant-specific data needs a `schoolId` field:

```prisma
// Example modifications
model wpos_wpdatatable_23 { // Students
  // ... existing fields
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  @@index([schoolId])
  // ... existing indexes
}

model wpos_wpdatatable_24 { // Teachers
  // ... existing fields
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  @@index([schoolId])
}

model admin {
  // ... existing fields
  schoolId  String?
  school    School?  @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  @@index([schoolId])
}

// Similar for ALL models:
// - wpos_wpdatatable_28 (controllers)
// - payment
// - months_table
// - attendance records
// - zoom links
// - salary payments
// - tests
// - courses
// - etc.
```

### Migration Strategy for Existing Data

**⚠️ IMPORTANT: NO MIGRATION FOR DARULKUBRA**

Since darulkubra stays as-is, we do **NOT**:

- ❌ Add `schoolId` to existing tables
- ❌ Modify darulkubra's database schema
- ❌ Change darulkubra's code
- ❌ Migrate darulkubra data

**For New Schools Only:**

1. **Create new School records** for new schools
2. **New tables OR new schema** with `schoolId` from the start
3. **All new school data** automatically includes `schoolId`
4. **No backfill needed** - clean start

---

## Authentication & Authorization

### Current Authentication Flow

- NextAuth with credentials provider
- Role-based access (admin, teacher, controller, registral)
- No tenant context in session

### New Authentication Requirements

#### 1. Super Admin Role

```typescript
// New role for platform administrators
type Role =
  | "superAdmin"
  | "admin"
  | "teacher"
  | "controller"
  | "registral"
  | "student"
  | "parent";

// Super admin can:
// - Create/manage schools
// - Access all schools (for support)
// - Manage platform-wide settings
// - View cross-tenant analytics
```

#### 2. School Admin Role

```typescript
// School-specific admin
// - Can only access their school's data
// - Manages school settings
// - Invites/manages users within their school
```

#### 3. Enhanced Session Structure

```typescript
interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  schoolId: string | null; // null for superAdmin
  schoolSlug?: string; // For URL routing
  permissions?: string[]; // Feature-level permissions
}
```

#### 4. Tenant Resolution Middleware

```typescript
// src/middleware.ts (enhanced)
export default withAuth(function middleware(req: NextRequest) {
  const token = req.nextauth.token as AuthUser | null;
  const { pathname } = req.nextUrl;

  // Extract school context from:
  // 1. Subdomain (school1.yourplatform.com)
  // 2. Path parameter (/schools/{slug}/...)
  // 3. Session (for authenticated users)

  const schoolSlug = extractSchoolSlug(req);

  if (schoolSlug && token?.schoolId) {
    // Verify user belongs to this school
    if (token.schoolId !== schoolSlug) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // ... existing role-based routing
});
```

#### 5. School Selection Flow

```typescript
// For users who belong to multiple schools (future)
// Or for superAdmin switching context
interface SchoolContext {
  currentSchoolId: string;
  availableSchools: School[];
  switchSchool: (schoolId: string) => void;
}
```

### Authentication Changes Required

1. **Update `src/lib/auth.ts`**

   - Add school lookup during login
   - Include schoolId in session token
   - Handle superAdmin (no schoolId)

2. **Update `src/middleware.ts`**

   - Add tenant resolution
   - Add tenant-scoped route protection
   - Handle subdomain routing

3. **Create School Context Provider**
   - React context for current school
   - Automatic school injection in API calls

---

## API & Middleware Changes

### Dual System Architecture

Since darulkubra stays unchanged, we need **conditional logic** in API routes:

### Current API Pattern (Darulkubra - Unchanged)

```typescript
// Existing routes for darulkubra - NO CHANGES
export async function GET(req: NextRequest) {
  const students = await prisma.wpos_wpdatatable_23.findMany({
    // No schoolId filter - works for darulkubra only
  });
}
```

### New API Pattern (Multi-Tenant Schools)

```typescript
// New routes OR conditional logic for new schools
export async function GET(req: NextRequest) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isMultiTenant = isNewSchoolRequest(session); // Check if new school

  if (isMultiTenant) {
    // Multi-tenant logic
    const schoolId = getSchoolIdFromSession(session);
    if (!schoolId && session.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const students = await prisma.wpos_wpdatatable_23.findMany({
      where: {
        schoolId: schoolId, // Filter by school
        // ... other filters
      },
    });
  } else {
    // Legacy darulkubra logic - unchanged
    const students = await prisma.wpos_wpdatatable_23.findMany({
      // No schoolId filter
    });
  }
}
```

### Routing Strategy

**Option 1: Path-Based Routing (Recommended)**

```
/darulkubra/* → Legacy system (existing routes)
/schools/{slug}/* → Multi-tenant system (new routes)
```

**Option 2: Subdomain Routing**

```
darulkubra.yourplatform.com → Legacy system
school1.yourplatform.com → Multi-tenant system
```

**Option 3: Feature Flag in Session**

```typescript
// Check if user belongs to new school system
function isNewSchoolRequest(session: any): boolean {
  return session?.schoolId !== null && session?.schoolId !== undefined;
}
```

### Required Changes

#### 1. Create Tenant Context Helper

```typescript
// src/lib/tenant-context.ts
export function getSchoolIdFromRequest(req: NextRequest): string | null {
  // Try multiple methods:
  // 1. From session token
  // 2. From subdomain
  // 3. From path parameter
  // 4. From header (for API clients)
}

export function getSchoolIdFromSession(session: any): string | null {
  if (session?.role === "superAdmin") {
    // Super admin can specify schoolId in query/header
    return session.schoolId || null;
  }
  return session?.schoolId || null;
}
```

#### 2. API Route Strategy

**Two Approaches:**

**Approach A: New Routes for Multi-Tenant (Recommended)**

- Keep existing routes unchanged (for darulkubra)
- Create new routes under `/api/v2/*` or `/api/schools/*`
- Example: `/api/v2/students`, `/api/v2/teachers`, etc.

**Approach B: Conditional Logic in Existing Routes**

- Add conditional checks in existing routes
- If `schoolId` exists → multi-tenant logic
- If `schoolId` is null → darulkubra logic (existing code)

**Recommendation:** Approach A - cleaner separation, less risk to darulkubra

**New Routes Needed:**

- `/api/v2/admin/*` - Multi-tenant admin routes
- `/api/v2/teachers/*` - Multi-tenant teacher routes
- `/api/v2/students/*` - Multi-tenant student routes
- `/api/v2/payments/*` - Multi-tenant payment routes
- `/api/v2/attendance/*` - Multi-tenant attendance routes
- `/api/v2/analytics/*` - Multi-tenant analytics routes
- ... and corresponding routes for all features

**Existing Routes (Unchanged):**

- `/api/admin/*` - Darulkubra only
- `/api/teachers/*` - Darulkubra only
- `/api/students/*` - Darulkubra only
- ... all existing routes remain for darulkubra

#### 3. Prisma Middleware for Automatic Filtering

```typescript
// src/lib/prisma.ts (enhanced)
const prisma = new PrismaClient();

// Add middleware to automatically filter by schoolId
prisma.$use(async (params, next) => {
  // For queries, automatically add schoolId filter if available
  if (params.action === "findMany" || params.action === "findFirst") {
    const schoolId = getCurrentSchoolId(); // From context/request
    if (schoolId && params.model !== "School") {
      params.args.where = {
        ...params.args.where,
        schoolId: schoolId,
      };
    }
  }
  return next(params);
});
```

**⚠️ Warning:** Automatic filtering can be dangerous - prefer explicit filtering for clarity and security.

#### 4. Database Query Wrapper

```typescript
// src/lib/db-helpers.ts
export class TenantScopedQuery {
  constructor(private schoolId: string) {}

  students() {
    return prisma.wpos_wpdatatable_23.findMany({
      where: { schoolId: this.schoolId },
    });
  }

  teachers() {
    return prisma.wpos_wpdatatable_24.findMany({
      where: { schoolId: this.schoolId },
    });
  }

  // ... wrapper methods for common queries
}

// Usage in API routes
const db = new TenantScopedQuery(schoolId);
const students = await db.students();
```

---

## Configuration Management

### Current Configuration

- Global `setting` table
- Hardcoded values in some places
- No per-school customization

### New Configuration System

#### 1. School-Specific Settings

```typescript
// src/lib/school-config.ts
export async function getSchoolConfig(schoolId: string) {
  const settings = await prisma.schoolSetting.findMany({
    where: { schoolId },
  });

  return {
    // Payment settings
    defaultCurrency: getSetting(settings, "default_currency", "ETB"),
    paymentMethods: getSetting(settings, "payment_methods", [
      "stripe",
      "chapa",
    ]),

    // Salary settings
    includeSundaysInSalary: getSetting(settings, "include_sundays", false),
    teacherSalaryVisible: getSetting(settings, "teacher_salary_visible", false),

    // Feature flags
    enableZoom: getSetting(settings, "enable_zoom", true),
    enableAnalytics: getSetting(settings, "enable_analytics", true),
    enableParentPortal: getSetting(settings, "enable_parent_portal", true),

    // Branding
    logoUrl: getSetting(settings, "logo_url", null),
    primaryColor: getSetting(settings, "primary_color", "#3B82F6"),

    // ... more settings
  };
}
```

#### 2. Configuration Hierarchy

```
1. Platform Defaults (hardcoded)
2. School Settings (database)
3. Feature Tiers (subscription-based)
4. User Preferences (if applicable)
```

#### 3. Settings UI

- School admin can configure their settings
- Super admin can set defaults for new schools
- Settings validated against subscription tier

---

## Payment & Subscription System

### Current Payment System

- Stripe integration for student subscriptions
- Manual payment recording
- No school-level billing

### New Billing Architecture

#### 1. School Subscription Model

```typescript
interface SchoolSubscription {
  // Base subscription fee (monthly/annual)
  baseFee: number;

  // Per-student pricing
  perStudentFee: number;
  studentCount: number;

  // Feature add-ons
  features: {
    advancedAnalytics: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
  };

  // Usage-based charges
  usage: {
    smsNotifications: number; // per SMS
    storageGB: number; // per GB
    apiCalls: number; // per 1000 calls
  };
}
```

#### 2. Billing Calculation

```typescript
// src/lib/billing-calculator.ts
export function calculateSchoolBill(
  school: School,
  period: string // YYYY-MM
): BillingBreakdown {
  const studentCount = school.currentStudentCount;
  const tier = school.subscriptionTier;

  // Base fee based on tier
  const baseFee = getTierBaseFee(tier);

  // Per-student fee
  const perStudentFee = getPerStudentFee(tier);
  const studentFee = studentCount * perStudentFee;

  // Feature fees
  const featureFees = calculateFeatureFees(school.features);

  // Usage fees
  const usageFees = calculateUsageFees(school.id, period);

  return {
    baseFee,
    studentFee,
    featureFees,
    usageFees,
    total: baseFee + studentFee + featureFees + usageFees,
  };
}
```

#### 3. Stripe Integration Updates

```typescript
// Create Stripe customer per school
const customer = await stripe.customers.create({
  email: school.email,
  name: school.name,
  metadata: {
    schoolId: school.id,
    schoolSlug: school.slug,
  },
});

// Create subscription with usage-based pricing
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [
    {
      price: "price_base_monthly", // Base fee
    },
    {
      price: "price_per_student", // Per-student (metered)
      quantity: school.currentStudentCount,
    },
  ],
  // ... other options
});
```

#### 4. Usage Tracking

```typescript
// Track usage for billing
model SchoolUsage {
  id          String   @id @default(cuid())
  schoolId    String
  period      String   @db.VarChar(7) // YYYY-MM
  metric      String   @db.VarChar(50) // student_count, sms_sent, api_calls
  value       Int
  recordedAt  DateTime @default(now())

  school      School   @relation(fields: [schoolId], references: [id])

  @@unique([schoolId, period, metric])
  @@index([schoolId, period])
}
```

#### 5. Billing Automation

```typescript
// Scheduled job (cron) to:
// 1. Calculate monthly bills
// 2. Create Stripe invoices
// 3. Send billing notifications
// 4. Handle failed payments
// 5. Suspend schools with overdue payments
```

---

## Data Migration Strategy

### ⚠️ NO MIGRATION NEEDED FOR DARULKUBRA

Since darulkubra stays as-is, there is **NO data migration** required.

### Implementation Strategy for New Schools

#### Phase 1: Database Setup for New Schools

1. **Create new School model** in Prisma schema
2. **Create new tables with `schoolId`** from the start
3. **OR: Use same tables but add `schoolId`** (nullable for darulkubra compatibility)
4. **Create first new school record** for testing

**Option A: Separate Tables (Recommended)**

```prisma
// New tables for multi-tenant schools
model School {
  // ... school definition
}

model Student_v2 { // New table name
  id        Int    @id
  schoolId  String // Required from start
  // ... other fields
}
```

**Option B: Same Tables, Optional schoolId**

```prisma
// Same tables, but schoolId is nullable
model wpos_wpdatatable_23 {
  // ... existing fields
  schoolId  String? // Nullable - null for darulkubra, set for new schools
  school    School? @relation(...)
}
```

**Recommendation:** Option B is simpler but requires careful query logic. Option A is cleaner but more code duplication.

#### Phase 2: Code Architecture

1. **Routing Logic:** Determine if request is for darulkubra or new school
2. **Conditional Queries:** Use different query patterns based on system
3. **Shared Code:** Extract common logic into shared utilities
4. **API Routes:** Create new routes for multi-tenant or add conditional logic

#### Phase 3: Testing

1. Verify darulkubra continues working unchanged
2. Test new school creation and functionality
3. Verify data isolation between new schools
4. Performance testing for both systems

### Rollback Strategy

- Darulkubra never changes, so no rollback needed for it
- New schools can be disabled via feature flag
- Can delete new school data without affecting darulkubra

---

## Security Considerations

### Data Isolation

1. **Query Filtering**

   - Never trust client-provided schoolId
   - Always get schoolId from authenticated session
   - Use database-level constraints (foreign keys)

2. **Row-Level Security**

   ```sql
   -- Consider using MySQL views or stored procedures
   -- to enforce tenant isolation at database level
   ```

3. **API Security**
   - Validate schoolId in every API endpoint
   - Use middleware to inject schoolId automatically
   - Audit logs for cross-tenant access attempts

### Authentication Security

1. **Session Management**

   - Include schoolId in JWT token
   - Validate schoolId on every request
   - Prevent schoolId tampering

2. **Super Admin Access**
   - Separate authentication for superAdmin
   - Audit all superAdmin actions
   - Require explicit schoolId selection

### Data Privacy

1. **GDPR/Compliance**

   - Per-school data export
   - Per-school data deletion
   - Data residency options (if needed)

2. **Backup & Recovery**
   - Per-school backup capability
   - Isolated restore process

---

## Performance & Scalability

### Database Performance

#### Indexing Strategy

```sql
-- Every tenant-scoped table needs:
CREATE INDEX idx_table_schoolId ON table_name(schoolId);
CREATE INDEX idx_table_schoolId_otherField ON table_name(schoolId, otherField);

-- Composite indexes for common queries
CREATE INDEX idx_students_school_status ON wpos_wpdatatable_23(schoolId, status);
```

#### Query Optimization

1. **Always include schoolId in WHERE clause first**
2. **Use composite indexes** for common query patterns
3. **Partition large tables** by schoolId (if needed at scale)
4. **Connection pooling** per school (if using separate connections)

### Caching Strategy

```typescript
// Cache school config
const schoolConfigCache = new Map<string, SchoolConfig>();

// Cache with TTL
async function getSchoolConfig(schoolId: string) {
  const cached = schoolConfigCache.get(schoolId);
  if (cached && !isExpired(cached)) {
    return cached.data;
  }

  const config = await fetchSchoolConfig(schoolId);
  schoolConfigCache.set(schoolId, {
    data: config,
    expiresAt: Date.now() + 3600000, // 1 hour
  });

  return config;
}
```

### Scalability Considerations

1. **Database Sharding** (future)

   - If single database becomes bottleneck
   - Shard by schoolId ranges
   - Requires application-level routing

2. **Read Replicas**

   - Use read replicas for analytics/reporting
   - Keep writes on primary

3. **CDN & Static Assets**
   - School logos/branding assets
   - Per-school custom CSS/JS

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

- [ ] Create School model and migration (for new schools only)
- [ ] Decide: Separate tables OR same tables with nullable schoolId
- [ ] **NO changes to darulkubra data or schema**
- [ ] Create superAdmin role and authentication
- [ ] Basic school management UI (superAdmin)
- [ ] Routing logic to distinguish darulkubra vs new schools

### Phase 2: Authentication & Authorization (Weeks 3-4)

- [ ] Update NextAuth to include schoolId
- [ ] Update middleware for tenant resolution
- [ ] Create tenant context provider
- [ ] Update all authentication flows
- [ ] Add school selection UI (if needed)

### Phase 3: API Updates (Weeks 5-8)

- [ ] Create tenant context helpers
- [ ] Create NEW API routes for multi-tenant system (`/api/v2/*`)
- [ ] **Keep existing API routes unchanged** (for darulkubra)
- [ ] Add schoolId filtering to new routes only
- [ ] Update Prisma queries in new routes only
- [ ] Add validation and error handling
- [ ] Test that darulkubra routes still work unchanged

### Phase 4: Configuration System (Weeks 9-10)

- [ ] Create SchoolSetting model
- [ ] Build configuration management UI
- [ ] Implement configuration hierarchy
- [ ] Add feature flags system
- [ ] School branding customization

### Phase 5: Billing System (Weeks 11-14)

- [ ] Design subscription tiers
- [ ] Implement billing calculation
- [ ] Stripe integration for school subscriptions
- [ ] Usage tracking system
- [ ] Billing dashboard for schools
- [ ] Automated invoicing

### Phase 6: Testing & Refinement (Weeks 15-16)

- [ ] Comprehensive testing
- [ ] Security audit
- [ ] Performance testing
- [ ] Bug fixes
- [ ] Documentation

### Phase 7: Rollout (Week 17+)

- [ ] Beta testing with select schools
- [ ] Gradual rollout
- [ ] Monitor and support
- [ ] Iterate based on feedback

---

## Testing Strategy

### Unit Tests

- Tenant context helpers
- Billing calculations
- Configuration management
- Query filtering logic

### Integration Tests

- API endpoints with tenant isolation
- Authentication flows
- Payment processing
- Data migration scripts

### Security Tests

- Attempt cross-tenant data access
- Validate schoolId enforcement
- Test superAdmin boundaries
- SQL injection attempts

### Performance Tests

- Query performance with indexes
- Concurrent multi-tenant load
- Database connection pooling
- Cache effectiveness

---

## Rollout Plan

### Pre-Launch

1. **Internal Testing**

   - **Verify darulkubra works exactly as before** (critical!)
   - Create test schools in new system
   - Verify all features work for new schools
   - Test that both systems can run simultaneously

2. **Beta Program**
   - Invite 2-3 friendly schools to new system
   - Gather feedback
   - Fix critical issues
   - **Continue monitoring darulkubra for any regressions**

### Launch

1. **Soft Launch**

   - Open registration for new schools
   - **Darulkubra continues on existing system (unchanged)**
   - New schools use new multi-tenant system
   - Monitor both systems closely

2. **No Migration Needed**

   - **Darulkubra stays on legacy system permanently**
   - No migration required
   - Both systems run in parallel

3. **Full Launch**
   - Public availability for new schools
   - Marketing and onboarding
   - Support system ready
   - **Darulkubra continues operating as-is**

### Post-Launch

1. **Monitoring**

   - Track usage metrics
   - Monitor performance
   - Watch for security issues

2. **Iteration**
   - Feature requests
   - Performance improvements
   - Bug fixes

---

## Key Decisions Needed

### 1. Subdomain vs Path-Based Routing

- **Subdomain:** `school1.yourplatform.com` (better isolation, requires DNS)
- **Path:** `yourplatform.com/schools/school1` (simpler, less isolation)

**Recommendation:** Start with path-based, add subdomain support later if needed.

### 2. Pricing Model

- **Tiered:** Fixed tiers (Basic, Pro, Enterprise)
- **Usage-based:** Pay per student + features
- **Hybrid:** Base tier + usage add-ons

**Recommendation:** Hybrid - base subscription + per-student pricing.

### 3. Data Migration Approach

- **No Migration:** Darulkubra stays as-is (no migration needed)
- **Clean Start:** New schools start fresh with multi-tenant schema
- **Dual System:** Both systems run in parallel permanently

**Recommendation:** No migration - darulkubra untouched, new schools start fresh.

### 4. Super Admin Access

- **Separate App:** Completely separate superAdmin interface
- **Same App:** Special routes/UI in same app
- **Separate Domain:** `admin.yourplatform.com`

**Recommendation:** Same app with special routes, can separate later.

---

## Estimated Effort

### Development Time

- **Phase 1-2:** 4 weeks (1 developer)
- **Phase 3:** 4 weeks (critical, most work)
- **Phase 4-5:** 6 weeks
- **Phase 6:** 2 weeks
- **Total:** ~16 weeks (4 months) for 1 developer
- **With 2 developers:** ~10-12 weeks

### Complexity

- **High Complexity Areas:**

  - API route updates (187 files)
  - Data migration
  - Billing system
  - Testing

- **Medium Complexity:**

  - Authentication updates
  - Configuration system
  - UI updates

- **Low Complexity:**
  - Database schema changes
  - Documentation

---

## Risks & Mitigation

### Risk 1: Data Leakage

**Mitigation:**

- Comprehensive testing
- Code reviews
- Automated security scans
- Database-level constraints

### Risk 2: Performance Degradation

**Mitigation:**

- Proper indexing
- Query optimization
- Caching strategy
- Load testing

### Risk 3: Breaking Darulkubra

**Mitigation:**

- **No changes to darulkubra code or database**
- Comprehensive testing of darulkubra after any shared code changes
- Feature flags to disable new system if needed
- Separate code paths for darulkubra vs new schools

### Risk 4: Breaking Existing Functionality

**Mitigation:**

- Extensive testing
- Feature flags
- Gradual rollout
- Monitoring

---

## Next Steps

1. **Review this document** with team/stakeholders
2. **Make key decisions** (routing, pricing, etc.)
3. **Create detailed technical specs** for each phase
4. **Set up development environment** for multi-tenant work
5. **Begin Phase 1** implementation

---

## Questions to Answer

1. What is the target number of **new** schools in first year?
2. What are the pricing tiers and fees for new schools?
3. Do new schools need custom domains?
4. What features should be tier-restricted for new schools?
5. How will you handle new school data export/deletion?
6. What is the support model for new schools?
7. How will you handle school-specific customizations?
8. What compliance requirements (GDPR, etc.)?
9. **Will darulkubra ever need to migrate?** (If yes, plan for future migration)
10. **How to handle shared code between systems?** (Utilities, components, etc.)
11. **Database strategy:** Same tables with nullable schoolId OR separate tables?

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Status:** Discussion Draft - Not for Implementation
