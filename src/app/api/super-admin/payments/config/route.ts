import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Get super admin from token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current base salary configuration
    const config = await prisma.superAdminAuditLog.findFirst({
      where: {
        action: "UPDATE_BASE_SALARY",
        superAdminId: "78er9w" // Current super admin
      },
      orderBy: { createdAt: "desc" }
    });

    let baseSalary = 50; // Default
    let lastUpdated = null;

    if (config?.details && typeof config.details === 'object') {
      baseSalary = (config.details as any).baseSalary || 50;
      lastUpdated = config.createdAt;
    }

    return NextResponse.json({
      success: true,
      config: {
        baseSalary,
        lastUpdated,
        currency: "ETB"
      }
    });

  } catch (error) {
    console.error("Payment config fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get super admin from token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { baseSalary } = body;

    if (!baseSalary || typeof baseSalary !== 'number' || baseSalary < 0) {
      return NextResponse.json(
        { error: "Valid base salary is required" },
        { status: 400 }
      );
    }

    const superAdminId = "78er9w"; // Current super admin

    // Log the configuration change
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId,
        action: "UPDATE_BASE_SALARY",
        resourceType: "system",
        resourceId: "payment_config",
        details: {
          baseSalary,
          previousValue: null, // Could track previous value if needed
          currency: "ETB"
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Base salary configuration updated successfully",
      config: {
        baseSalary,
        currency: "ETB",
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error("Payment config update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}








