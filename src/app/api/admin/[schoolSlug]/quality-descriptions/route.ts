import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

const QualityDescriptionSchema = z.object({
  type: z.enum(["positive", "negative"]),
  description: z.string().min(2),
});

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!session || (session.role !== "admin" && session.role !== "controller")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get school information
  const school = await prisma.school.findUnique({
    where: { slug: params.schoolSlug },
    select: { id: true, name: true },
  });

  if (!school) {
    return NextResponse.json(
      { error: "School not found" },
      { status: 404 }
    );
  }

  // Verify user has access to this school
  let hasAccess = false;
  if (session.role === "admin") {
    const admin = await prisma.admin.findUnique({
      where: { id: session.id as string },
      select: { schoolId: true },
    });
    hasAccess = admin?.schoolId === school.id;
  } else if (session.role === "controller") {
    const controller = await prisma.wpos_wpdatatable_28.findUnique({
      where: { code: session.username },
      select: { schoolId: true },
    });
    hasAccess = controller?.schoolId === school.id;
  }

  if (!hasAccess) {
    return NextResponse.json(
      { error: "Unauthorized access to school" },
      { status: 403 }
    );
  }
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const where = type ? { type, schoolId: school.id } : { schoolId: school.id };
  const descriptions = await prisma.qualitydescription.findMany({
    where,
    orderBy: { updatedAt: "asc" },
  });
  return NextResponse.json(descriptions);
}

export async function POST(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get school information
  const school = await prisma.school.findUnique({
    where: { slug: params.schoolSlug },
    select: { id: true, name: true },
  });

  if (!school) {
    return NextResponse.json(
      { error: "School not found" },
      { status: 404 }
    );
  }

  // Verify admin has access to this school
  const admin = await prisma.admin.findUnique({
    where: { id: session.id as string },
    select: { schoolId: true },
  });

  if (!admin || admin.schoolId !== school.id) {
    return NextResponse.json(
      { error: "Unauthorized access to school" },
      { status: 403 }
    );
  }
  const body = await req.json();
  const parse = QualityDescriptionSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parse.error.issues },
      { status: 400 }
    );
  }
  const { type, description } = parse.data;
  // Do NOT set createdBy at all
  const created = await prisma.qualitydescription.create({
    data: {
      type,
      description,
      schoolId: school.id,
    },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get school information
  const school = await prisma.school.findUnique({
    where: { slug: params.schoolSlug },
    select: { id: true, name: true },
  });

  if (!school) {
    return NextResponse.json(
      { error: "School not found" },
      { status: 404 }
    );
  }

  // Verify admin has access to this school
  const admin = await prisma.admin.findUnique({
    where: { id: session.id as string },
    select: { schoolId: true },
  });

  if (!admin || admin.schoolId !== school.id) {
    return NextResponse.json(
      { error: "Unauthorized access to school" },
      { status: 403 }
    );
  }
  const body = await req.json();
  const { id, type, description } = body;
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }
  const parse = QualityDescriptionSchema.safeParse({ type, description });
  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parse.error.issues },
      { status: 400 }
    );
  }
  const updated = await prisma.qualitydescription.update({
    where: { id: Number(id) },
    data: { type, description },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get school information
  const school = await prisma.school.findUnique({
    where: { slug: params.schoolSlug },
    select: { id: true, name: true },
  });

  if (!school) {
    return NextResponse.json(
      { error: "School not found" },
      { status: 404 }
    );
  }

  // Verify admin has access to this school
  const admin = await prisma.admin.findUnique({
    where: { id: session.id as string },
    select: { schoolId: true },
  });

  if (!admin || admin.schoolId !== school.id) {
    return NextResponse.json(
      { error: "Unauthorized access to school" },
      { status: 403 }
    );
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }
  await prisma.qualitydescription.delete({ where: { id: Number(id), schoolId: school.id } });
  return NextResponse.json({ success: true });
}
