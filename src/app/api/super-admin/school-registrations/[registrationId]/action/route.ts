import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

async function sendApprovalEmail(school: any, adminEmail: string) {
  if (!resend) {
    console.log('Resend not configured, skipping email');
    return;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Darulkubra!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin: 0; font-size: 28px;">🎉 Welcome to Darulkubra!</h1>
          <p style="color: #6b7280; margin: 10px 0;">Your school registration has been approved</p>
        </div>

        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
          <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">${school.name}</h2>
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">
            Your school is now active and ready to use!
          </p>
        </div>

        <div style="background-color: #f8fafc; padding: 30px; border-radius: 12px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin: 0 0 20px 0;">Next Steps:</h3>

          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 15px 0;">
            <h4 style="color: #059669; margin: 0 0 10px 0;">1. Set Up Your Branding</h4>
            <p style="margin: 0; color: #64748b;">
              Customize your school's appearance with colors, logo, and branding preferences.
            </p>
            <a href="${process.env.NEXTAUTH_URL}/admin/${school.slug}/settings" style="display: inline-block; background: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin: 10px 0 0 0;">
              Set Up Branding →
            </a>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 15px 0;">
            <h4 style="color: #059669; margin: 0 0 10px 0;">2. Access Your Dashboard</h4>
            <p style="margin: 0; color: #64748b;">
              Start managing your school with our comprehensive dashboard.
            </p>
            <a href="${process.env.NEXTAUTH_URL}/admin/${school.slug}" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin: 10px 0 0 0;">
              Go to Dashboard →
            </a>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 15px 0;">
            <h4 style="color: #059669; margin: 0 0 10px 0;">3. Add Your Team</h4>
            <p style="margin: 0; color: #64748b;">
              Invite teachers, staff, and administrators to your school platform.
            </p>
          </div>
        </div>

        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0;">
            <strong>Important:</strong> Please complete your branding setup within 7 days to ensure your school's unique identity is established.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

        <div style="text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Darulkubra - Empowering Islamic Education
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 5px 0;">
            Need help? Contact our support team at support@darulkubra.com
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: 'Darulkubra <onboarding@resend.dev>',
      to: [adminEmail],
      subject: `🎉 Welcome to Darulkubra - ${school.name} is now active!`,
      html: emailHtml,
    });
    console.log(`✅ Approval email sent to ${adminEmail} for school ${school.name}`);
  } catch (error) {
    console.error('❌ Failed to send approval email:', error);
  }
}

async function sendRejectionEmail(school: any, adminEmail: string) {
  if (!resend) {
    console.log('Resend not configured, skipping email');
    return;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Darulkubra Registration Update</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin: 0; font-size: 28px;">Darulkubra Registration Update</h1>
          <p style="color: #6b7280; margin: 10px 0;">Regarding your school registration</p>
        </div>

        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
          <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">${school.name}</h2>
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">
            Registration Status: Not Approved
          </p>
        </div>

        <div style="background-color: #f8fafc; padding: 30px; border-radius: 12px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin: 0 0 20px 0;">What Happened:</h3>
          <p style="margin: 0 0 15px 0; color: #64748b;">
            After careful review of your school registration application, we were unable to approve it at this time.
          </p>
          <p style="margin: 0 0 15px 0; color: #64748b;">
            Our team has contacted you directly regarding the verification process and any additional information needed.
          </p>
        </div>

        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0;">
            <strong>Next Steps:</strong> Our team will be in touch soon with specific feedback and guidance on how to proceed with your registration.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #64748b; margin: 0;">
            Questions? Contact our support team for assistance.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

        <div style="text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Darulkubra - Empowering Islamic Education
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 5px 0;">
            📧 support@darulkubra.com | 🌐 darulkubra.com
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: 'Darulkubra <onboarding@resend.dev>',
      to: [adminEmail],
      subject: `Darulkubra Registration Update - ${school.name}`,
      html: emailHtml,
    });
    console.log(`✅ Rejection email sent to ${adminEmail} for school ${school.name}`);
  } catch (error) {
    console.error('❌ Failed to send rejection email:', error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { registrationId: string } }
) {
  try {
    // TODO: Re-enable authentication after testing
    // Check super admin authentication
    // const session = await getServerSession(authOptions);
    // if (!session || (session.user as any)?.role !== 'superAdmin') {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    console.log('⚠️  AUTHENTICATION DISABLED FOR TESTING');

    const { registrationId } = params;
    const body = await req.json();
    const { action } = actionSchema.parse(body);

    // Find the school registration
    const school = await prisma.school.findUnique({
      where: { id: registrationId },
      include: {
        admins: true,
      },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School registration not found" },
        { status: 404 }
      );
    }

    if (!school.isSelfRegistered) {
      return NextResponse.json(
        { error: "This school was not registered through self-registration" },
        { status: 400 }
      );
    }

    if (school.registrationStatus !== "pending_review") {
      return NextResponse.json(
        { error: "This registration has already been processed" },
        { status: 400 }
      );
    }

    // Perform the action
    if (action === "approve") {
      // Approve the registration
      await prisma.$transaction(async (tx) => {
        // Update school status
        await tx.school.update({
          where: { id: registrationId },
          data: {
            status: "active",
            registrationStatus: "approved",
          },
        });

        // Activate the admin accounts for this school
        await tx.admin.updateMany({
          where: {
            schoolId: registrationId,
            isActive: false,
          },
          data: {
            isActive: true,
          },
        });

        // Log the approval
        await tx.superAdminAuditLog.create({
          data: {
            superAdminId: "78er9w", // Current super admin ID
            action: "APPROVE_SCHOOL_REGISTRATION",
            resourceType: "school",
            resourceId: registrationId,
            details: {
              schoolName: school.name,
              schoolEmail: school.email,
            },
          },
        });
      });

      // Send approval email
      const adminEmail = school.admins?.[0]?.email || school.registrationData?.adminEmail;
      if (adminEmail) {
        await sendApprovalEmail(school, adminEmail);
      }

      return NextResponse.json({
        success: true,
        message: "School registration approved successfully",
      });

    } else if (action === "reject") {
      // Reject the registration
      await prisma.$transaction(async (tx) => {
        // Update school status
        await tx.school.update({
          where: { id: registrationId },
          data: {
            status: "inactive",
            registrationStatus: "rejected",
          },
        });

        // Keep admin account inactive (or we could delete it)
        // For now, we'll keep it inactive so they can see their account status

        // Log the rejection
        await tx.superAdminAuditLog.create({
          data: {
            superAdminId: "78er9w", // Current super admin ID
            action: "REJECT_SCHOOL_REGISTRATION",
            resourceType: "school",
            resourceId: registrationId,
            details: {
              schoolName: school.name,
              schoolEmail: school.email,
            },
          },
        });
      });

      // Send rejection email
      const adminEmail = school.admins?.[0]?.email || school.registrationData?.adminEmail;
      if (adminEmail) {
        await sendRejectionEmail(school, adminEmail);
      }

      return NextResponse.json({
        success: true,
        message: "School registration rejected",
      });
    }

  } catch (error) {
    console.error("School registration action error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid action", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




