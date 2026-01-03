import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/admin/manual-subscription
 * Manually add subscription data for testing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      studentId,
      stripeSubscriptionId,
      stripeCustomerId,
      packageName,
      packageDuration,
      amount,
      currency,
      status,
      startDate,
      endDate,
      customerEmail,
    } = body;

    // Validate required fields
    if (!studentId || !stripeSubscriptionId || !stripeCustomerId || !packageName) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, stripeSubscriptionId, stripeCustomerId, packageName" },
        { status: 400 }
      );
    }

    // Check if student exists
    const student = await prisma.wpos_wpdatatable_23.findUnique({
      where: { wdt_ID: parseInt(studentId) },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Create or find subscription package
    let subscriptionPackage = await prisma.subscription_packages.findFirst({
      where: { name: packageName },
    });

    if (!subscriptionPackage) {
      // Create new package
      subscriptionPackage = await prisma.subscription_packages.create({
        data: {
          name: packageName,
          duration: packageDuration === "1month" ? 1 : parseInt(packageDuration) || 1,
          price: parseFloat(amount) || 90,
          currency: currency || "usd",
          description: `${packageName} - ${packageDuration}`,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    }

    // Check if subscription already exists
    const existingSubscription = await prisma.student_subscriptions.findFirst({
      where: {
        stripeSubscriptionId: stripeSubscriptionId,
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: "Subscription with this Stripe ID already exists" },
        { status: 400 }
      );
    }

    // Create subscription
    const subscription = await prisma.student_subscriptions.create({
      data: {
        studentId: parseInt(studentId),
        packageId: subscriptionPackage.id,
        stripeSubscriptionId: stripeSubscriptionId,
        stripeCustomerId: stripeCustomerId,
        status: status || "active",
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        nextBillingDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        updatedAt: new Date(),
      },
      include: {
        package: true,
        student: {
          select: {
            wdt_ID: true,
            name: true,
            phoneno: true,
          },
        },
      },
    });

    // Update student's Stripe customer ID if provided
    if (stripeCustomerId && !student.stripeCustomerId) {
      await prisma.wpos_wpdatatable_23.update({
        where: { wdt_ID: parseInt(studentId) },
        data: { stripeCustomerId: stripeCustomerId },
      });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        ...subscription,
        package: {
          ...subscription.package,
          price: Number(subscription.package.price),
        },
      },
      message: "Manual subscription created successfully",
    });
  } catch (error: any) {
    console.error("POST /api/admin/manual-subscription error:", error);
    return NextResponse.json(
      { error: "Failed to create manual subscription" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/manual-subscription
 * Get all manual subscriptions for testing
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await prisma.student_subscriptions.findMany({
      include: {
        package: true,
        student: {
          select: {
            wdt_ID: true,
            name: true,
            phoneno: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions.map((sub) => ({
        ...sub,
        package: {
          ...sub.package,
          price: Number(sub.package.price),
        },
      })),
    });
  } catch (error: any) {
    console.error("GET /api/admin/manual-subscription error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}