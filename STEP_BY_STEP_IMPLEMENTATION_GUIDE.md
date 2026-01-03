# Step-by-Step Multi-Tenant SaaS Implementation Guide

## Complete Project Restructure - New Codebase with Clean Schema

**⚠️ IMPORTANT:** This guide is for creating a **NEW project** by cloning darulkubra and completely restructuring it as a clean SaaS platform with improved database schema naming.

---

## Table of Contents

1. [Prerequisites & Setup](#prerequisites--setup)
2. [Phase 1: Clone & Initialize New Project](#phase-1-clone--initialize-new-project)
3. [Phase 2: Database Schema Design (Clean Names)](#phase-2-database-schema-design-clean-names)
4. [Phase 3: Core Infrastructure](#phase-3-core-infrastructure)
5. [Phase 4: Authentication System](#phase-4-authentication-system)
6. [Phase 5: API Routes](#phase-5-api-routes)
7. [Phase 6: Frontend Updates](#phase-6-frontend-updates)
8. [Phase 7: Billing System](#phase-7-billing-system)
9. [Phase 8: Data Migration Script (Optional)](#phase-8-data-migration-script-optional)
10. [Phase 9: Testing](#phase-9-testing)
11. [Phase 10: Deployment](#phase-10-deployment)

---

## Prerequisites & Setup

### Step 0.1: Prepare New Project Location

```bash
# Navigate to your projects directory
cd ~/Desktop/dk  # or wherever you keep projects

# Create new folder for SaaS version
mkdir darulkubra-saas
cd darulkubra-saas
```

### Step 0.2: Clone/Copy Darulkubra Project

```bash
# Option 1: If you have git repo
git clone [your-darulkubra-repo-url] .

# Option 2: Copy the entire folder (recommended for clean start)
cp -r ../darulkubra/* .
cp -r ../darulkubra/.* . 2>/dev/null || true  # Copy hidden files

# Option 3: If using git, clone and create new branch
git clone [your-repo-url] .
git checkout -b saas-refactor
```

### Step 0.3: Initialize New Project

```bash
# Install dependencies
npm install

# Create NEW database (separate from darulkubra)
# Update .env with new database connection
```

**File:** `.env`

```env
# New database for SaaS platform
DATABASE_URL="mysql://user:password@localhost:3306/darulkubra_saas"

# Multi-tenant configuration
MULTI_TENANT_ENABLED=true

# Stripe keys for school subscriptions
STRIPE_SCHOOL_SECRET_KEY=sk_test_...
STRIPE_SCHOOL_WEBHOOK_SECRET=whsec_...

# Super admin credentials
SUPER_ADMIN_EMAIL=admin@yourplatform.com
SUPER_ADMIN_PASSWORD=[secure_password]

# Other existing env vars...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

### Step 0.4: Update Project Name

**File:** `package.json`

```json
{
  "name": "darulkubra-saas",
  "version": "2.0.0",
  "description": "Multi-tenant SaaS platform for educational management",
  "private": true
}
```

---

## Phase 1: Clone & Initialize New Project

### Step 1.1: Clean Up Project Structure

```bash
# Remove old database migrations (we'll create new ones)
rm -rf prisma/migrations/*

# Keep only the migration lock file structure
# We'll regenerate everything
```

### Step 1.2: Initialize Git (if starting fresh)

```bash
# If starting fresh, initialize git
git init
git add .
git commit -m "Initial commit: SaaS refactor with clean schema"
```

---

## Phase 2: Database Schema Design (Clean Names)

### Step 2.1: Create New Clean Schema

**File:** `prisma/schema.prisma`

**Replace the entire schema with clean, well-named models:**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// CORE MULTI-TENANT MODELS
// ============================================================================

model School {
  id                    String   @id @default(cuid())
  name                  String   @db.VarChar(255)
  slug                  String   @unique @db.VarChar(100)
  subdomain             String?  @unique @db.VarChar(100)
  domain                String?  @unique @db.VarChar(255)

  // Contact Information
  email                 String?  @db.VarChar(255)
  phone                 String?  @db.VarChar(32)
  address               String?  @db.Text

  // Branding
  logoUrl               String?  @db.VarChar(500)
  primaryColor          String?  @db.VarChar(7)
  secondaryColor        String?  @db.VarChar(7)

  // Subscription & Billing
  subscriptionTier      String   @default("trial") @db.VarChar(50)
  maxStudents          Int      @default(50)
  currentStudentCount   Int      @default(0)
  billingCycle         String   @default("monthly") @db.VarChar(20)
  stripeCustomerId     String?  @unique @db.VarChar(255)
  stripeSubscriptionId String?  @db.VarChar(255)

  // Status
  status               String   @default("active") @db.VarChar(20)
  trialEndsAt          DateTime? @db.DateTime(0)
  subscriptionEndsAt   DateTime? @db.DateTime(0)

  // Configuration
  timezone             String   @default("Africa/Addis_Ababa") @db.VarChar(50)
  defaultCurrency      String   @default("ETB") @db.VarChar(10)
  defaultLanguage      String   @default("en") @db.VarChar(10)

  // Feature Flags
  features             Json?

  // Metadata
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  createdBy            String?  @db.VarChar(255)

  // Relations
  students             Student[]
  teachers             Teacher[]
  controllers          Controller[]
  admins               Admin[]
  settings             SchoolSetting[]
  payments             SchoolPayment[]
  usage                SchoolUsage[]

  @@index([slug])
  @@index([status])
  @@index([subscriptionTier])
  @@map("schools")
}

model SchoolSetting {
  id        String   @id @default(cuid())
  schoolId String
  key       String   @db.VarChar(100)
  value     String?  @db.Text
  type      String   @default("string") @db.VarChar(20)
  category  String?  @db.VarChar(50)

  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([schoolId, key])
  @@index([schoolId])
  @@index([category])
  @@map("school_settings")
}

// ============================================================================
// USER MODELS (Clean Names)
// ============================================================================

model Student {
  id                  Int      @id @default(autoincrement())
  schoolId            String   // Required - multi-tenant

  // Basic Information
  name                String?  @db.VarChar(255)
  phone               String?  @db.VarChar(32)
  parentPhone         String?  @db.VarChar(20)
  country             String?  @db.VarChar(255)

  // Academic Information
  status              String?  @db.VarChar(255) // active, leave, etc.
  package             String?  @db.VarChar(255)
  subject             String?  @db.VarChar(255)
  dayPackages         String?  @db.VarChar(255)

  // Financial
  classFee            Float?   @db.Float
  classFeeCurrency    String   @default("ETB") @db.VarChar(10)

  // Dates
  startDate           DateTime? @db.DateTime(0)
  registrationDate    DateTime? @default(now()) @db.DateTime(0)
  exitDate            DateTime? @db.DateTime(0)

  // Relations
  teacherId           String?
  teacher             Teacher? @relation(fields: [teacherId], references: [id])
  controllerId        String?
  controller          Controller? @relation(fields: [controllerId], references: [id])

  // Other fields
  isTrained           Boolean? @default(false)
  isKid               Boolean? @default(false)
  chatId              String?  @db.VarChar(64)
  progress            String?  @db.VarChar(64)
  reason              String?  @db.VarChar(255)
  refer               String?  @db.VarChar(255)

  // Stripe
  stripeCustomerId    String?  @db.VarChar(255)

  // Relations
  school              School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  payments            Payment[]
  attendanceRecords   AttendanceRecord[]
  monthlyPayments     MonthlyPayment[]
  zoomLinks           ZoomLink[]
  testResults         TestResult[]
  subscriptions       StudentSubscription[]

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([schoolId])
  @@index([teacherId])
  @@index([controllerId])
  @@index([status])
  @@index([parentPhone])
  @@map("students")
}

model Teacher {
  id                  String   @id @default(uuid())
  schoolId            String   // Required - multi-tenant

  // Basic Information
  name                String?  @db.VarChar(120)
  phone               String?  @db.VarChar(32)
  password            String   @db.VarChar(255)

  // Schedule
  schedule            String?  @db.Text

  // Relations
  controllerId        String?
  controller          Controller? @relation(fields: [controllerId], references: [id])

  // Zoom Integration
  zoomUserId          String?  @db.VarChar(255)
  zoomAccessToken     String?  @db.Text
  zoomRefreshToken    String?  @db.Text
  zoomTokenExpiresAt  DateTime? @db.DateTime(0)
  zoomConnectedAt     DateTime? @db.DateTime(0)

  // Relations
  school              School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  students            Student[]
  zoomLinks           ZoomLink[]
  salaryPayments      TeacherSalaryPayment[]
  absenceRecords      AbsenceRecord[]
  latenessRecords     LatenessRecord[]
  bonusRecords        BonusRecord[]
  qualityAssessments  QualityAssessment[]

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([schoolId])
  @@index([controllerId])
  @@index([zoomUserId])
  @@map("teachers")
}

model Controller {
  id                  Int      @id @default(autoincrement())
  schoolId            String   // Required - multi-tenant

  name                String?  @unique @db.VarChar(255)
  username            String?  @unique @db.VarChar(255)
  password            String   @db.VarChar(255)
  code                String?  @unique @db.VarChar(255)

  // Relations
  school              School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  teachers            Teacher[]
  students            Student[]

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([schoolId])
  @@index([code])
  @@map("controllers")
}

model Admin {
  id                  String   @id @default(cuid())
  schoolId            String?  // Nullable - can be super admin (no school)

  name                String   @unique @db.VarChar(120)
  username            String?  @unique @db.VarChar(120)
  passcode            String   @db.VarChar(120)
  phone               String?  @db.VarChar(32)
  role                String   @default("admin") @db.VarChar(20) // admin, superAdmin
  chatId              String   @unique

  // Relations
  school              School?  @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([schoolId])
  @@index([role])
  @@map("admins")
}

// ============================================================================
// PAYMENT MODELS
// ============================================================================

model Payment {
  id                  Int      @id @default(autoincrement())
  studentId             Int
  schoolId            String   // Denormalized for easier queries

  studentName         String   @db.VarChar(255)
  paymentDate         DateTime @db.DateTime(0)
  transactionId       String   @db.VarChar(255)
  paidAmount          Decimal  @db.Decimal(10, 0)
  reason              String   @db.VarChar(2000)
  status              String   @default("pending") @db.VarChar(20)
  currency            String   @default("ETB") @db.VarChar(10)

  source              PaymentSource @default(manual)
  intent              PaymentIntent @default(tuition)

  providerReference   String?  @db.VarChar(255)
  providerStatus      String?  @db.VarChar(50)
  providerFee         Decimal? @db.Decimal(10, 2)
  providerPayload     Json?

  subscriptionId      Int?
  subscription        StudentSubscription? @relation(fields: [subscriptionId], references: [id])

  taxAmount           Decimal? @db.Decimal(10, 2)
  taxBreakdown        Json?

  student             Student  @relation(fields: [studentId], references: [id])

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([studentId])
  @@index([schoolId])
  @@index([status])
  @@index([paymentDate])
  @@map("payments")
}

model MonthlyPayment {
  id                  Int      @id @default(autoincrement())
  studentId           Int
  schoolId            String   // Denormalized

  month               String?  @db.Char(7) // YYYY-MM
  paidAmount          Int
  paymentStatus       String   @db.VarChar(50)
  paymentType         String?  @default("full") @db.VarChar(20)

  startDate           DateTime? @db.DateTime(0)
  endDate             DateTime? @db.DateTime(0)

  isFreeMonth         Boolean? @default(false)
  freeMonthReason     String?  @db.VarChar(100)

  paymentId           Int?
  payment             Payment? @relation(fields: [paymentId], references: [id], onDelete: SetNull)

  source              PaymentSource @default(manual)
  providerReference   String?  @db.VarChar(255)
  providerStatus      String?  @db.VarChar(50)
  providerPayload     Json?

  student             Student  @relation(fields: [studentId], references: [id])

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([studentId])
  @@index([schoolId])
  @@index([month])
  @@index([paymentId])
  @@map("monthly_payments")
}

enum PaymentSource {
  manual
  chapa
  stripe
}

enum PaymentIntent {
  tuition
  deposit
  subscription
}

// ============================================================================
// ATTENDANCE MODELS
// ============================================================================

model AttendanceRecord {
  id                  Int      @id @default(autoincrement())
  studentId            Int
  schoolId             String   // Denormalized

  date                DateTime @default(now()) @db.DateTime(0)
  status              String   @db.VarChar(255) // present, absent, permission

  // Progress details
  surah               String?  @db.VarChar(255)
  pagesRead           Int?
  level               String?  @db.VarChar(255)
  lesson              String?  @db.VarChar(255)
  notes               String?  @db.Text

  student             Student  @relation(fields: [studentId], references: [id])

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([studentId])
  @@index([schoolId])
  @@index([date])
  @@map("attendance_records")
}

// ============================================================================
// ZOOM MODELS
// ============================================================================

model ZoomLink {
  id                      Int      @id @default(autoincrement())
  studentId               Int
  teacherId               String?
  schoolId                String   // Denormalized

  link                    String   @db.VarChar(255)
  trackingToken           String   @db.VarChar(32)

  sentTime                DateTime? @db.DateTime(0)
  clickedAt               DateTime? @db.DateTime(0)
  expirationDate          DateTime? @db.DateTime(0)

  sessionStatus           SessionStatus @default(active)
  sessionEndedAt          DateTime? @db.DateTime(0)
  sessionDurationMinutes    Int?
  lastActivityAt          DateTime? @db.DateTime(0)

  // Zoom API fields
  zoomMeetingId           String?  @db.VarChar(255)
  zoomStartTime           DateTime? @db.DateTime(0)
  zoomActualDuration      Int?
  createdViaApi           Boolean? @default(false)
  startUrl                String?  @db.VarChar(500)
  scheduledStartTime      DateTime? @db.DateTime(0)

  hostJoinedAt            DateTime? @db.DateTime(0)
  hostLeftAt              DateTime? @db.DateTime(0)
  studentJoinedAt         DateTime? @db.DateTime(0)
  studentLeftAt            DateTime? @db.DateTime(0)
  teacherDurationMinutes  Int?
  studentDurationMinutes  Int?
  participantCount        Int?     @default(0)

  recordingStarted        Boolean? @default(false)
  screenShareStarted      Boolean? @default(false)
  meetingTopic            String?  @db.VarChar(255)

  packageId               String?  @db.VarChar(191)
  packageRate              Decimal? @db.Decimal(10, 2)

  student                 Student  @relation(fields: [studentId], references: [id])
  teacher                 Teacher? @relation(fields: [teacherId], references: [id])

  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  @@index([studentId])
  @@index([teacherId])
  @@index([schoolId])
  @@index([sentTime])
  @@index([sessionStatus])
  @@map("zoom_links")
}

enum SessionStatus {
  active
  ended
  timeout
}

// ============================================================================
// SALARY & PAYMENT MODELS
// ============================================================================

model TeacherSalaryPayment {
  id                  Int      @id @default(autoincrement())
  teacherId           String
  schoolId            String   // Denormalized
  period              String   @db.VarChar(7) // YYYY-MM

  status              String   @db.VarChar(50)
  paidAt              DateTime? @db.DateTime(0)
  adminId             String?

  totalSalary         Float
  latenessDeduction   Float
  absenceDeduction    Float
  bonuses             Float

  teacher             Teacher  @relation(fields: [teacherId], references: [id])
  admin               Admin?  @relation(fields: [adminId], references: [id])

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([teacherId, period])
  @@index([teacherId])
  @@index([schoolId])
  @@index([period])
  @@map("teacher_salary_payments")
}

model AbsenceRecord {
  id                  Int      @id @default(autoincrement())
  teacherId           String
  schoolId            String

  classDate           DateTime
  timeSlots           String?  // JSON string
  permitted           Boolean
  permissionRequestId Int?

  deductionApplied    Float
  reviewedByManager   Boolean
  reviewNotes         String?

  adminId             String?
  controllerId        Int?

  teacher             Teacher  @relation(fields: [teacherId], references: [id])
  admin               Admin?   @relation(fields: [adminId], references: [id])

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([teacherId])
  @@index([schoolId])
  @@index([classDate])
  @@map("absence_records")
}

model LatenessRecord {
  id                  Int      @id @default(autoincrement())
  teacherId           String
  schoolId            String

  classDate           DateTime
  scheduledTime       DateTime
  actualStartTime     DateTime
  latenessMinutes     Int
  deductionApplied    Float
  deductionTier       String

  adminId             String?
  controllerId        Int?

  teacher             Teacher  @relation(fields: [teacherId], references: [id])
  admin               Admin?   @relation(fields: [adminId], references: [id])

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([teacherId])
  @@index([schoolId])
  @@index([classDate])
  @@map("lateness_records")
}

model BonusRecord {
  id                  Int      @id @default(autoincrement())
  teacherId           String
  schoolId            String
  period              String   @db.VarChar(7)

  amount              Float
  reason              String

  adminId             String?
  controllerId        Int?

  teacher             Teacher  @relation(fields: [teacherId], references: [id])
  admin               Admin?   @relation(fields: [adminId], references: [id])

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([teacherId])
  @@index([schoolId])
  @@index([period])
  @@map("bonus_records")
}

// ============================================================================
// BILLING MODELS
// ============================================================================

model SchoolPayment {
  id                  String   @id @default(cuid())
  schoolId            String
  amount              Decimal  @db.Decimal(10, 2)
  currency            String   @db.VarChar(10)
  period              String   @db.VarChar(7) // YYYY-MM
  studentCount        Int
  baseFee             Decimal  @db.Decimal(10, 2)
  perStudentFee       Decimal  @db.Decimal(10, 2)
  featureFees        Json?
  totalAmount         Decimal  @db.Decimal(10, 2)
  status              String   @default("pending") @db.VarChar(20)
  stripeInvoiceId     String?  @db.VarChar(255)
  paidAt              DateTime? @db.DateTime(0)

  school              School   @relation(fields: [schoolId], references: [id])

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([schoolId])
  @@index([period])
  @@index([status])
  @@map("school_payments")
}

model SchoolUsage {
  id          String   @id @default(cuid())
  schoolId    String
  period      String   @db.VarChar(7) // YYYY-MM
  metric      String   @db.VarChar(50) // student_count, sms_sent, api_calls
  value       Int
  recordedAt  DateTime @default(now())

  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  @@unique([schoolId, period, metric])
  @@index([schoolId, period])
  @@map("school_usage")
}

// ============================================================================
// SUBSCRIPTION MODELS (Student Subscriptions)
// ============================================================================

model StudentSubscription {
  id                   Int      @id @default(autoincrement())
  studentId             Int
  packageId             Int
  stripeSubscriptionId  String   @unique @db.VarChar(255)
  stripeCustomerId     String   @db.VarChar(255)

  status               String   @db.VarChar(50)
  startDate            DateTime
  endDate              DateTime
  nextBillingDate      DateTime?
  autoRenew            Boolean   @default(true)

  billingAddress       Json?
  taxEnabled           Boolean   @default(false)
  totalTaxPaid         Decimal   @default(0.00) @db.Decimal(10, 2)

  student              Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  package               SubscriptionPackage @relation(fields: [packageId], references: [id])
  payments              Payment[]

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([studentId])
  @@index([stripeSubscriptionId])
  @@index([status])
  @@map("student_subscriptions")
}

model SubscriptionPackage {
  id              Int      @id @default(autoincrement())
  name            String   @db.VarChar(100)
  duration        Int
  price           Decimal  @db.Decimal(10, 2)
  currency        String   @db.VarChar(10)
  description     String?  @db.Text
  paymentLink     String?  @db.VarChar(500)
  isActive        Boolean  @default(true)

  taxCode         String?  @db.VarChar(50)
  taxInclusive    Boolean  @default(false)

  subscriptions   StudentSubscription[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([isActive])
  @@map("subscription_packages")
}

// ============================================================================
// ADD OTHER MODELS AS NEEDED
// Test models, course models, etc. with clean names
// ============================================================================

model TestResult {
  id          String   @id @default(uuid())
  studentId   Int
  testId      String
  questionId  String
  result      Int

  student     Student  @relation(fields: [studentId], references: [id])

  createdAt   DateTime @default(now())

  @@index([studentId])
  @@index([testId])
  @@map("test_results")
}

model QualityAssessment {
  id                  Int      @id @default(autoincrement())
  teacherId           String
  schoolId            String

  weekStart           DateTime
  supervisorFeedback  String   @db.Text
  examinerRating      Float?
  studentPassRate     Float?
  overallQuality      String

  managerApproved      Boolean
  managerOverride      Boolean
  overrideNotes        String?
  bonusAwarded         Float?

  adminId             String?
  controllerId        Int?

  teacher             Teacher  @relation(fields: [teacherId], references: [id])
  admin               Admin?   @relation(fields: [adminId], references: [id])

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([teacherId])
  @@index([schoolId])
  @@index([weekStart])
  @@map("quality_assessments")
}
```

### Step 2.2: Generate Prisma Client

```bash
# Generate Prisma client with new schema
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init_clean_schema

# This will create the database with all new tables
```

### Step 2.3: Verify Schema

```bash
# Open Prisma Studio to verify
npx prisma studio

# Check that all tables are created with clean names:
# - schools
# - students (not wpos_wpdatatable_23)
# - teachers (not wpos_wpdatatable_24)
# - controllers (not wpos_wpdatatable_28)
# - admins
# - payments
# - etc.
```

---

## Phase 3: Core Infrastructure

### Step 3.1: Update Prisma Client Import

**File:** `src/lib/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : [],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Step 3.2: Create Tenant Context Helper

**File:** `src/lib/tenant-context.ts`

```typescript
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export interface TenantContext {
  schoolId: string | null;
  isMultiTenant: boolean;
}

/**
 * Get school ID from request
 */
export async function getSchoolIdFromRequest(
  req: NextRequest
): Promise<string | null> {
  // Method 1: From session token
  const session = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (session?.schoolId) {
    return session.schoolId as string;
  }

  // Method 2: From subdomain
  const host = req.headers.get("host") || "";
  const subdomain = host.split(".")[0];
  if (subdomain && subdomain !== "www") {
    const { prisma } = await import("./prisma");
    const school = await prisma.school.findUnique({
      where: { subdomain },
      select: { id: true },
    });
    if (school) return school.id;
  }

  // Method 3: From path parameter
  const pathname = req.nextUrl.pathname;
  const schoolMatch = pathname.match(/\/schools\/([^\/]+)/);
  if (schoolMatch) {
    const slug = schoolMatch[1];
    const { prisma } = await import("./prisma");
    const school = await prisma.school.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (school) return school.id;
  }

  return null;
}

/**
 * Get tenant context from request
 */
export async function getTenantContext(
  req: NextRequest
): Promise<TenantContext> {
  const schoolId = await getSchoolIdFromRequest(req);

  return {
    schoolId,
    isMultiTenant: schoolId !== null,
  };
}

/**
 * Validate user has access to school
 */
export async function validateSchoolAccess(
  userId: string,
  userRole: string,
  schoolId: string | null
): Promise<boolean> {
  if (!schoolId) {
    return false; // All requests must have schoolId in SaaS version
  }

  if (userRole === "superAdmin") {
    return true;
  }

  const { prisma } = await import("./prisma");

  if (userRole === "admin") {
    const admin = await prisma.admin.findFirst({
      where: {
        id: userId,
        schoolId: schoolId,
      },
    });
    return admin !== null;
  }

  if (userRole === "teacher") {
    const teacher = await prisma.teacher.findFirst({
      where: {
        id: userId,
        schoolId: schoolId,
      },
    });
    return teacher !== null;
  }

  return false;
}
```

### Step 3.3: Create Database Query Helper

**File:** `src/lib/db-helpers.ts`

```typescript
import { prisma } from "./prisma";

/**
 * Tenant-scoped database query helper
 * Uses clean model names
 */
export class TenantScopedQuery {
  constructor(private schoolId: string) {}

  students(where?: any) {
    return prisma.student.findMany({
      where: {
        schoolId: this.schoolId,
        ...where,
      },
    });
  }

  teachers(where?: any) {
    return prisma.teacher.findMany({
      where: {
        schoolId: this.schoolId,
        ...where,
      },
    });
  }

  controllers(where?: any) {
    return prisma.controller.findMany({
      where: {
        schoolId: this.schoolId,
        ...where,
      },
    });
  }

  admins(where?: any) {
    return prisma.admin.findMany({
      where: {
        schoolId: this.schoolId,
        ...where,
      },
    });
  }

  payments(where?: any) {
    return prisma.payment.findMany({
      where: {
        schoolId: this.schoolId,
        ...where,
      },
    });
  }
}
```

---

## Phase 4: Authentication System

### Step 4.1: Update Auth Types

**File:** `src/lib/auth.ts`

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  role:
    | "superAdmin"
    | "admin"
    | "teacher"
    | "controller"
    | "registral"
    | "student"
    | "parent";
  schoolId: string | null; // Always required in SaaS (null only for superAdmin)
  schoolSlug?: string;
  code?: string;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (
          !credentials?.username ||
          !credentials?.password ||
          !credentials?.role
        ) {
          return null;
        }

        // Super Admin
        if (credentials.role === "superAdmin") {
          const admin = await prisma.admin.findFirst({
            where: {
              username: credentials.username,
              role: "superAdmin",
            },
          });

          if (!admin) return null;

          const isValid = await compare(credentials.password, admin.passcode);
          if (!isValid) return null;

          return {
            id: admin.id,
            name: admin.name,
            username: admin.username || "",
            role: "superAdmin",
            schoolId: null,
          };
        }

        // School Admin
        if (credentials.role === "admin") {
          const admin = await prisma.admin.findFirst({
            where: {
              username: credentials.username,
              role: "admin",
            },
            include: {
              school: {
                select: {
                  id: true,
                  slug: true,
                },
              },
            },
          });

          if (!admin || !admin.schoolId) return null;

          const isValid = await compare(credentials.password, admin.passcode);
          if (!isValid) return null;

          return {
            id: admin.id,
            name: admin.name,
            username: admin.username || "",
            role: "admin",
            schoolId: admin.schoolId,
            schoolSlug: admin.school?.slug,
          };
        }

        // Teacher
        if (credentials.role === "teacher") {
          const teacher = await prisma.teacher.findFirst({
            where: {
              id: credentials.username, // Using id as username
            },
            include: {
              school: {
                select: {
                  id: true,
                  slug: true,
                },
              },
            },
          });

          if (!teacher) return null;

          const isValid = await compare(credentials.password, teacher.password);
          if (!isValid) return null;

          return {
            id: teacher.id,
            name: teacher.name || "",
            username: teacher.id,
            role: "teacher",
            schoolId: teacher.schoolId,
            schoolSlug: teacher.school?.slug,
          };
        }

        // Add other roles as needed...

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.username = user.username;
        token.role = user.role;
        token.schoolId = (user as AuthUser).schoolId;
        token.schoolSlug = (user as AuthUser).schoolSlug;
        token.code = (user as AuthUser).code;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.schoolId = token.schoolId as string | null;
        session.user.schoolSlug = token.schoolSlug as string | undefined;
        session.user.code = token.code as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
```

---

## Phase 5: API Routes

### Step 5.1: Create Base API Helper

**File:** `src/lib/api-helpers.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getTenantContext, validateSchoolAccess } from "./tenant-context";

export async function withTenantContext(
  req: NextRequest,
  handler: (context: {
    schoolId: string;
    session: any;
  }) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const context = await getTenantContext(req);

    if (!context.schoolId) {
      return NextResponse.json(
        { error: "School context required" },
        { status: 400 }
      );
    }

    // Validate access
    const hasAccess = await validateSchoolAccess(
      session.id as string,
      session.role as string,
      context.schoolId
    );

    if (!hasAccess && session.role !== "superAdmin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return handler({
      schoolId: context.schoolId,
      session,
    });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Step 5.2: Create Students API Route

**File:** `src/app/api/students/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { withTenantContext } from "@/lib/api-helpers";
import { TenantScopedQuery } from "@/lib/db-helpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  return withTenantContext(req, async ({ schoolId, session }) => {
    if (session.role !== "admin" && session.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const offset = (page - 1) * limit;

    const db = new TenantScopedQuery(schoolId);

    const whereClause: any = {};
    if (search) {
      whereClause.name = {
        contains: search,
        mode: "insensitive",
      };
    }
    if (status) {
      whereClause.status = status;
    }

    const [students, total] = await Promise.all([
      db.students({
        ...whereClause,
        skip: offset,
        take: limit,
        orderBy: {
          registrationDate: "desc",
        },
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          teacherId: true,
          phone: true,
          registrationDate: true,
        },
      }),
      db.students(whereClause).then((s) => s.length),
    ]);

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });
}
```

---

## Phase 6: Frontend Updates

### Step 6.1: Update All Code References

**Search and replace throughout codebase:**

```bash
# Find all references to old model names
grep -r "wpos_wpdatatable_23" src/
grep -r "wpos_wpdatatable_24" src/
grep -r "wpos_wpdatatable_28" src/

# Replace with new names:
# wpos_wpdatatable_23 → Student
# wpos_wpdatatable_24 → Teacher
# wpos_wpdatatable_28 → Controller
# wdt_ID → id
# ustazid → id (for teachers)
# etc.
```

**Use your IDE's find and replace:**

- `prisma.wpos_wpdatatable_23` → `prisma.student`
- `prisma.wpos_wpdatatable_24` → `prisma.teacher`
- `prisma.wpos_wpdatatable_28` → `prisma.controller`
- `wdt_ID` → `id`
- `ustazid` → `id` (in teacher context)
- `ustazname` → `name` (in teacher context)

---

## Phase 7: Billing System

### Step 7.1: Create Billing Calculator

**File:** `src/lib/billing-calculator.ts`

```typescript
import { prisma } from "./prisma";

interface BillingBreakdown {
  baseFee: number;
  studentFee: number;
  featureFees: number;
  usageFees: number;
  total: number;
}

const TIER_PRICING = {
  trial: { baseFee: 0, perStudent: 0 },
  basic: { baseFee: 50, perStudent: 2 },
  premium: { baseFee: 150, perStudent: 1.5 },
  enterprise: { baseFee: 500, perStudent: 1 },
};

export async function calculateSchoolBill(
  schoolId: string,
  period: string
): Promise<BillingBreakdown> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      subscriptionTier: true,
      currentStudentCount: true,
      features: true,
    },
  });

  if (!school) {
    throw new Error("School not found");
  }

  const tier = school.subscriptionTier as keyof typeof TIER_PRICING;
  const pricing = TIER_PRICING[tier] || TIER_PRICING.basic;

  const baseFee = pricing.baseFee;
  const studentFee = school.currentStudentCount * pricing.perStudent;
  const featureFees = 0; // Calculate based on features
  const usageFees = 0; // Calculate based on usage

  return {
    baseFee,
    studentFee,
    featureFees,
    usageFees,
    total: baseFee + studentFee + featureFees + usageFees,
  };
}
```

---

## Phase 8: Data Migration Script (Optional)

### Step 8.1: Create Migration Script

**File:** `scripts/migrate-from-darulkubra.ts`

```typescript
/**
 * Optional: Migrate data from darulkubra database to new SaaS database
 * Run this only if you want to import existing darulkubra data
 */

import { PrismaClient as OldPrisma } from "@prisma/client";
import { PrismaClient as NewPrisma } from "../prisma/generated/client";

// Connect to old database
const oldDb = new OldPrisma({
  datasources: {
    db: {
      url: process.env.OLD_DATABASE_URL, // darulkubra database
    },
  },
});

// Connect to new database
const newDb = new NewPrisma();

async function migrate() {
  // 1. Create a school for migrated data
  const school = await newDb.school.create({
    data: {
      name: "Darulkubra (Migrated)",
      slug: "darulkubra-migrated",
      subscriptionTier: "premium",
      status: "active",
    },
  });

  // 2. Migrate students
  const oldStudents = await oldDb.wpos_wpdatatable_23.findMany();
  for (const oldStudent of oldStudents) {
    await newDb.student.create({
      data: {
        schoolId: school.id,
        name: oldStudent.name,
        phone: oldStudent.phoneno,
        // Map other fields...
      },
    });
  }

  // 3. Migrate teachers, etc.
  // ...

  console.log("Migration complete!");
}

migrate()
  .catch(console.error)
  .finally(() => {
    oldDb.$disconnect();
    newDb.$disconnect();
  });
```

---

## Phase 9: Testing

### Step 9.1: Create Test School

```typescript
// scripts/create-test-school.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.create({
    data: {
      name: "Test School",
      slug: "test-school",
      email: "test@example.com",
      subscriptionTier: "trial",
      maxStudents: 100,
    },
  });

  // Create test admin
  const admin = await prisma.admin.create({
    data: {
      name: "Test Admin",
      username: "admin",
      passcode: "$2a$10$...", // Hashed password
      role: "admin",
      chatId: "test-chat-id",
      schoolId: school.id,
    },
  });

  console.log("Test school created:", school);
  console.log("Test admin created:", admin);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## Phase 10: Deployment

### Step 10.1: Build and Deploy

```bash
# Build the project
npm run build

# Run migrations in production
npx prisma migrate deploy

# Deploy to your hosting platform
# (Vercel, AWS, etc.)
```

---

## Summary

This guide provides:

1. ✅ **Clean database schema** with proper naming (Student, Teacher, Controller instead of wpos_wpdatatable_23, etc.)
2. ✅ **Multi-tenant architecture** from the start
3. ✅ **Separate project** - doesn't affect darulkubra
4. ✅ **Step-by-step instructions** with code examples
5. ✅ **Optional migration script** if you want to import darulkubra data

**Key Benefits:**

- Clean, maintainable codebase
- Better database schema
- Multi-tenant ready
- No impact on existing darulkubra system

Follow each phase sequentially and test after each phase!
