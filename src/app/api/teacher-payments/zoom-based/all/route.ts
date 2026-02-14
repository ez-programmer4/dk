import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const schoolSlug = searchParams.get("schoolSlug");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!schoolSlug || !from || !to) {
      return NextResponse.json(
        { error: "schoolSlug, from, to are required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // Get school for multi-tenancy
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Distinct teachers that have links in range (multi-tenant)
    const teacherIds = await prisma.wpos_zoom_links.findMany({
      where: {
        schoolId: school.id, // Multi-tenancy filter
        sent_time: {
          gte: new Date(`${from}T00:00:00`),
          lte: new Date(`${to}T23:59:59`),
        },
      },
      select: { ustazid: true },
      distinct: ["ustazid"],
    });

    // Map teacher names
    const ids = teacherIds.map((t) => t.ustazid).filter(Boolean) as string[];
    const teacherNames = await prisma.wpos_wpdatatable_24.findMany({
      where: { ustazid: { in: ids } },
      select: { ustazid: true, ustazname: true },
    });
    const idToName = new Map(teacherNames.map((t) => [t.ustazid, t.ustazname]));

    // For each teacher, call the per-teacher API logic by composing a URL fetch (simplest reuse)
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    const results: any[] = [];
    for (const t of teacherIds) {
      if (!t.ustazid) continue;
      try {
        const url = `${base}/api/teacher-payments/zoom-based?teacherId=${encodeURIComponent(
          t.ustazid
        )}&schoolSlug=${encodeURIComponent(schoolSlug)}&from=${from}&to=${to}`;
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (res.ok && json?.success) {
          results.push({
            teacherId: t.ustazid,
            teacherName: idToName.get(t.ustazid) || null,
            ...json,
          });
        } else {
          results.push({
            teacherId: t.ustazid,
            teacherName: idToName.get(t.ustazid) || null,
            error: json?.error || "failed",
          });
        }
      } catch (e: any) {
        results.push({
          teacherId: t.ustazid,
          teacherName: idToName.get(t.ustazid) || null,
          error: e?.message || String(e),
        });
      }
    }

    return NextResponse.json({
      success: true,
      from,
      to,
      count: results.length,
      data: results,
    });
  } catch (error: any) {
    console.error("Zoom-based all teachers API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal error" },
      { status: 500 }
    );
  }
}
