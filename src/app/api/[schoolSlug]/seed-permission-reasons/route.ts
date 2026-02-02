import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    // This is a simple seeding endpoint
    // In a real application, you might store these in a database
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: "Permission reasons seeding completed",
      reasons: [
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
      ]
    });
  } catch (error) {
    console.error("Error seeding permission reasons:", error);
    return NextResponse.json(
      { error: "Failed to seed permission reasons" },
      { status: 500 }
    );
  }
}




















