import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/admin/subscription-package-configs
 * Get all subscription package configs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { schoolSlug: string } }
) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (
      !session ||
      (session.role !== "admin" &&
        session.role !== "registral" &&
        session.role !== "controller")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolSlug = params.schoolSlug;
    const schoolId = schoolSlug === "darulkubra" ? null : schoolSlug;

    const configs = await prisma.subscription_package_config.findMany({
      include: {
        packages: {
          where: {
            isActive: true,
            ...(schoolId ? { schoolId } : { schoolId: null }),
          },
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            currency: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Debug logging: Log configs with their package counts
    configs.forEach((config) => {
      console.log(
        `[ConfigAPI] Config ${config.id} (${config.name}): ${config.packages.length} active packages, ${config._count.students} students`
      );
    });

    return NextResponse.json({
      success: true,
      configs: configs.map((config) => ({
        ...config,
        packages: config.packages.map((pkg) => ({
          ...pkg,
          price: Number(pkg.price),
        })),
        studentCount: config._count.students,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/admin/subscription-package-configs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription package configs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/subscription-package-configs
 * Create a new subscription package config
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
    const { name, description, isActive = true, packageIds = [] } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Config name is required" },
        { status: 400 }
      );
    }

    const config = await prisma.$transaction(async (tx) => {
      // Create the config
      const newConfig = await tx.subscription_package_config.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Assign packages to this config if provided
      if (packageIds.length > 0) {
        const validPackageIds = packageIds
          .map((id: any) => parseInt(String(id)))
          .filter((id: number) => !isNaN(id));

        if (validPackageIds.length > 0) {
          await tx.subscription_packages.updateMany({
            where: {
              id: { in: validPackageIds },
            },
            data: {
              configId: newConfig.id,
            },
          });
        }
      }

      return newConfig;
    });

    return NextResponse.json({
      success: true,
      config,
      message: "Config created successfully",
    });
  } catch (error: any) {
    console.error("POST /api/admin/subscription-package-configs error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription package config" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/subscription-package-configs
 * Update a subscription package config
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, isActive, packageIds } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Config ID is required" },
        { status: 400 }
      );
    }

    const config = await prisma.$transaction(async (tx) => {
      // Update the config
      const updateData: any = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined)
        updateData.description = description?.trim() || null;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedConfig = await tx.subscription_package_config.update({
        where: { id: parseInt(String(id)) },
        data: updateData,
      });

      // Update package assignments if provided
      if (packageIds !== undefined) {
        // First, remove all packages from this config
        const removedCount = await tx.subscription_packages.updateMany({
          where: {
            configId: updatedConfig.id,
          },
          data: {
            configId: null,
          },
        });
        console.log(
          `[ConfigAPI] Removed ${removedCount.count} packages from config ${updatedConfig.id}`
        );

        // Then assign new packages
        if (Array.isArray(packageIds) && packageIds.length > 0) {
          const validPackageIds = packageIds
            .map((id: any) => parseInt(String(id)))
            .filter((id: number) => !isNaN(id));

          if (validPackageIds.length > 0) {
            const assignedCount = await tx.subscription_packages.updateMany({
              where: {
                id: { in: validPackageIds },
              },
              data: {
                configId: updatedConfig.id,
              },
            });
            console.log(
              `[ConfigAPI] Assigned ${assignedCount.count} packages to config ${
                updatedConfig.id
              }: [${validPackageIds.join(", ")}]`
            );
          } else {
            console.warn(
              `[ConfigAPI] No valid package IDs provided for config ${updatedConfig.id}`
            );
          }
        } else {
          console.log(
            `[ConfigAPI] No packages to assign to config ${updatedConfig.id} (packageIds is empty)`
          );
        }
      }

      return updatedConfig;
    });

    return NextResponse.json({
      success: true,
      config,
      message: "Config updated successfully",
    });
  } catch (error: any) {
    console.error("PUT /api/admin/subscription-package-configs error:", error);
    return NextResponse.json(
      { error: "Failed to update subscription package config" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/subscription-package-configs
 * Delete a subscription package config
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Config ID is required" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Remove packages from this config
      await tx.subscription_packages.updateMany({
        where: {
          configId: parseInt(id),
        },
        data: {
          configId: null,
        },
      });

      // Delete the config (will fail if students are assigned to it due to RESTRICT)
      await tx.subscription_package_config.delete({
        where: { id: parseInt(id) },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Config deleted successfully",
    });
  } catch (error: any) {
    console.error(
      "DELETE /api/admin/subscription-package-configs error:",
      error
    );

    // Check if error is due to foreign key constraint
    if (error.code === "P2003" || error.message?.includes("foreign key")) {
      return NextResponse.json(
        {
          error:
            "Cannot delete config: Students are assigned to this config. Please reassign them first.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete subscription package config" },
      { status: 500 }
    );
  }
}
