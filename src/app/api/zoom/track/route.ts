import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEthiopianTime } from "@/lib/ethiopian-time";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // Log immediately - first thing
    console.log("[TRACK] ====== Tracking route called ======");
    console.log("[TRACK] Request URL:", req.url);

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || searchParams.get("t"); // Support both formats

    console.log(`[TRACK] Extracted token: ${token}`);

    if (!token) {
      console.error("[TRACK] ❌ No token provided in tracking URL");
      return new Response("Invalid tracking link - no token.", { status: 400 });
    }

    console.log(`[TRACK] Looking up record with token: ${token}`);

    let record;
    try {
      record = await prisma.wpos_zoom_links.findFirst({
        where: { tracking_token: token },
      });
    } catch (dbError: any) {
      console.error(`[TRACK] ❌ Database error finding record:`, dbError);
      throw dbError;
    }

    if (!record) {
      console.error(`[TRACK] ❌ No record found for token: ${token}`);
      return new Response("Invalid or expired tracking link.", { status: 404 });
    }

    console.log(
      `[TRACK] Record found - ID: ${record.id}, current clicked_at: ${
        record.clicked_at?.toISOString() || "null"
      }`
    );

    if (!record.clicked_at) {
      // Record clicked time when student first clicks
      // Use Ethiopian local time (UTC+3)
      try {
        const clickTime = getEthiopianTime();
        console.log(
          `[TRACK] Recording clicked_at for record ${
            record.id
          } at ${clickTime.toISOString()}`
        );

        const updated = await prisma.wpos_zoom_links.update({
          where: { id: record.id },
          data: {
            clicked_at: clickTime,
          },
        });

        console.log(
          `[TRACK] ✅ clicked_at saved: ${
            updated.clicked_at?.toISOString() || "null"
          }`
        );
      } catch (error: any) {
        console.error(`[TRACK] ❌ Failed to save clicked_at:`, error);
        console.error(`[TRACK] Error details:`, {
          message: error?.message,
          code: error?.code,
          stack: error?.stack,
        });
        // Continue with redirect even if update fails
      }
    } else {
      console.log(
        `[TRACK] clicked_at already set: ${record.clicked_at.toISOString()}`
      );
    }

    // Redirect directly to Zoom link
    const target = record.link;

    if (!target || target.trim() === "") {
      console.error("[TRACK] ❌ Empty Zoom link in database");
      return new Response("Zoom link not found.", { status: 404 });
    }

    console.log(`[TRACK] Redirecting to Zoom: ${target}`);
    return new Response(null, {
      status: 302,
      headers: { Location: target },
    });
  } catch (error: any) {
    // Catch any unhandled errors
    console.error("[TRACK] ❌❌❌ UNHANDLED ERROR in tracking route:", error);
    console.error("[TRACK] Error type:", typeof error);
    console.error("[TRACK] Error message:", error?.message);
    console.error("[TRACK] Error stack:", error?.stack);

    // Still try to redirect if we have a record
    try {
      const { searchParams } = new URL(req.url);
      const token = searchParams.get("token") || searchParams.get("t");
      if (token) {
        const record = await prisma.wpos_zoom_links.findFirst({
          where: { tracking_token: token },
          select: { link: true },
        });
        if (record?.link) {
          console.log("[TRACK] Attempting redirect despite error");
          return new Response(null, {
            status: 302,
            headers: { Location: record.link },
          });
        }
      }
    } catch (redirectError) {
      console.error("[TRACK] Failed to redirect after error:", redirectError);
    }

    return new Response("Internal server error", { status: 500 });
  }
}
