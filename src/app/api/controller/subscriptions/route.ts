import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!session || session.role !== "controller") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get controller's code from the session
    const controllerCode = (session as any).code || (session as any).username || (session as any).name;
    if (!controllerCode) {
      return NextResponse.json(
        { error: "Controller code not found in session" },
        { status: 404 }
      );
    }

    // Get all student IDs assigned to this controller
    const controllerStudents = await prisma.wpos_wpdatatable_23.findMany({
      where: {
        u_control: controllerCode,
      },
      select: {
        wdt_ID: true,
      },
    });

    const studentIds = controllerStudents.map((s) => s.wdt_ID);

    if (studentIds.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          itemsPerPage: 50,
          totalItems: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        filters: {
          packages: [],
          statuses: [],
        },
      });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const packageId = searchParams.get("packageId") || "";

    const offset = (page - 1) * limit;

    // Build where clause - only include subscriptions for this controller's students
    const whereClause: any = {
      studentId: { in: studentIds },
    };

    if (search) {
      whereClause.OR = [
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { student: { phoneno: { contains: search, mode: 'insensitive' } } },
        { stripeSubscriptionId: { contains: search, mode: 'insensitive' } },
        { stripeCustomerId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (packageId) {
      whereClause.packageId = parseInt(packageId, 10);
    }

    // Get subscriptions with related data
    const [subscriptions, total] = await Promise.all([
      prisma.student_subscriptions.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              wdt_ID: true,
              name: true,
              phoneno: true,
              country: true,
              status: true,
            },
          },
          package: {
            select: {
              id: true,
              name: true,
              duration: true,
              price: true,
              currency: true,
              description: true,
            },
          },
          payments: {
            select: {
              id: true,
              paidamount: true,
              paymentdate: true,
              status: true,
              currency: true,
            },
            orderBy: {
              paymentdate: 'desc',
            },
            take: 1, // Get latest payment
          },
          taxTransactions: {
            select: {
              id: true,
              taxAmount: true,
              totalAmount: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 5, // Get recent tax transactions
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.student_subscriptions.count({ where: whereClause }),
    ]);

    // Get total payment amounts for each subscription
    const subscriptionsWithStats = await Promise.all(
      subscriptions.map(async (sub) => {
        const allPayments = await prisma.payment.findMany({
          where: { subscriptionId: sub.id },
          select: {
            paidamount: true,
            paymentdate: true,
            status: true,
          },
        });

        const totalPaid = allPayments
          .filter((p) => p.status === "Approved" || p.status === "approved")
          .reduce((sum, p) => sum + Number(p.paidamount || 0), 0);

        const totalTaxPaid = Number(sub.totalTaxPaid || 0);

        return {
          id: sub.id,
          studentId: sub.studentId,
          packageId: sub.packageId,
          stripeSubscriptionId: sub.stripeSubscriptionId,
          stripeCustomerId: sub.stripeCustomerId,
          status: sub.status,
          startDate: sub.startDate.toISOString(),
          endDate: sub.endDate.toISOString(),
          nextBillingDate: sub.nextBillingDate?.toISOString() || null,
          autoRenew: sub.autoRenew,
          taxEnabled: sub.taxEnabled,
          totalTaxPaid: totalTaxPaid,
          createdAt: sub.createdAt.toISOString(),
          updatedAt: sub.updatedAt.toISOString(),
          student: {
            id: sub.student.wdt_ID,
            name: sub.student.name,
            phone: sub.student.phoneno || null,
            email: null, // Email not available in student table
            country: sub.student.country || null,
            status: sub.student.status || null,
          },
          package: {
            id: sub.package.id,
            name: sub.package.name,
            duration: sub.package.duration,
            price: Number(sub.package.price),
            currency: sub.package.currency,
            description: sub.package.description || null,
          },
          paymentStats: {
            totalPaid: totalPaid,
            paymentCount: allPayments.length,
            lastPaymentDate: allPayments[0]?.paymentdate?.toISOString() || null,
            lastPayment: sub.payments[0]
              ? {
                  id: sub.payments[0].id,
                  amount: Number(sub.payments[0].paidamount || 0),
                  date: sub.payments[0].paymentdate?.toISOString() || null,
                  status: sub.payments[0].status,
                  currency: sub.payments[0].currency || sub.package.currency,
                }
              : null,
          },
          taxStats: {
            transactionCount: sub.taxTransactions.length,
            recentTransactions: sub.taxTransactions.map((tx) => ({
              id: tx.id,
              taxAmount: Number(tx.taxAmount || 0),
              totalAmount: Number(tx.totalAmount || 0),
              createdAt: tx.createdAt.toISOString(),
            })),
          },
        };
      })
    );

    // Get available packages for filter (only packages used by this controller's students)
    const usedPackageIds = [...new Set(subscriptions.map((s) => s.packageId))];
    const packages = await prisma.subscription_packages.findMany({
      where: {
        id: { in: usedPackageIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      data: subscriptionsWithStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        itemsPerPage: limit,
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
      filters: {
        packages,
        statuses: ['active', 'canceled', 'past_due', 'trialing', 'unpaid', 'incomplete', 'incomplete_expired'],
      },
    });
  } catch (error: any) {
    console.error("Error fetching controller subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions", details: error.message },
      { status: 500 }
    );
  }
}


