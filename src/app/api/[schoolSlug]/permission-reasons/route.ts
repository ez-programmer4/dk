import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    // Permission reasons are generic and not school-specific
    const reasons = [
      "Sick Leave",
      "Personal Emergency",
      "Family Matter",
      "Medical Appointment",
      "Religious Holiday",
      "Exam Period",
      "Professional Development",
      "Transportation Issues",
      "Weather Conditions",
      "Other",
    ];

    return NextResponse.json({ reasons });
  } catch (error) {
    console.error("Error fetching permission reasons:", error);
    return NextResponse.json(
      { error: "Failed to fetch permission reasons" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    // This would seed permission reasons if needed
    // For now, just return success
    return NextResponse.json({ success: true, message: "Permission reasons seeded" });
  } catch (error) {
    console.error("Error seeding permission reasons:", error);
    return NextResponse.json(
      { error: "Failed to seed permission reasons" },
      { status: 500 }
    );
  }
}








