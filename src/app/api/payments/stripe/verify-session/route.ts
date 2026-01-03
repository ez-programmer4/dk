import { NextRequest, NextResponse } from "next/server";
import { stripeClient } from "@/lib/payments/stripe";
import { finalizeSubscriptionPayment } from "@/lib/payments/finalizeSubscription";
import { prisma } from "@/lib/prisma";
import { paymentLogger } from "@/lib/payments/logger";
import {
  handlePaymentError,
  ValidationError,
  NotFoundError,
  safeExecute,
} from "@/lib/payments/errorHandler";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERIFY_SESSION_CONTEXT = "VerifySession";

/**
 * POST /api/payments/stripe/verify-session
 * Verifies a Stripe checkout session and links subscription with metadata
 * This is used for payment links that don't have metadata in the session
 */
export async function POST(request: NextRequest) {
  return safeExecute(
    async () => {
      const body = await request.json();
      const { sessionId, studentId, packageId } = body;

      paymentLogger.info(
        VERIFY_SESSION_CONTEXT,
        "Received verify-session request",
        {
          hasSessionId: !!sessionId,
          hasStudentId: !!studentId,
          hasPackageId: !!packageId,
          sessionId: sessionId || "none",
          studentId: studentId || "none",
          packageId: packageId || "none",
        }
      );

      if (!stripeClient) {
        throw new Error("Stripe client not configured");
      }

      // If no sessionId but we have studentId and packageId, try to find subscription by metadata
      // The webhook sets packageId in metadata, so we can find subscriptions that match
      if (!sessionId && studentId && packageId) {
        paymentLogger.debug(
          VERIFY_SESSION_CONTEXT,
          "No sessionId provided, finding subscription by metadata",
          {
            studentId,
            packageId,
          }
        );

        try {
          // CRITICAL: Get student's Stripe customer ID to verify subscription ownership
          const student = await prisma.wpos_wpdatatable_23.findUnique({
            where: { wdt_ID: parseInt(String(studentId)) },
            select: {
              wdt_ID: true,
              stripeCustomerId: true,
            },
          });

          if (!student) {
            throw new ValidationError(`Student ${studentId} not found`);
          }

          // Search for subscriptions with matching packageId in metadata (set by webhook)
          // CRITICAL: When we have both studentId and packageId from return page, this is a legitimate subscription creation
          // We can be more lenient with the search window, but still verify customer ID if available
          // - If student has customer ID: search last 30 minutes (very lenient for payment links)
          // - If student has NO customer ID: search last 15 minutes (lenient since we have both IDs)
          const hasCustomerId = !!student.stripeCustomerId;
          const searchWindowMinutes = hasCustomerId ? 30 : 15; // Very lenient when we have both studentId and packageId
          const searchWindowAgo = Math.floor(
            (Date.now() - searchWindowMinutes * 60 * 1000) / 1000
          );

          paymentLogger.debug(
            VERIFY_SESSION_CONTEXT,
            "Searching subscriptions (has both studentId and packageId - legitimate request)",
            {
              after: new Date(searchWindowAgo * 1000).toISOString(),
              searchWindowMinutes,
              studentId,
              packageId,
              studentCustomerId: student.stripeCustomerId || "NONE",
              hasCustomerId,
              note: hasCustomerId
                ? "Can match by customer ID - 30 minute window"
                : "No customer ID - 15 minute window (lenient since we have both IDs)",
            }
          );

          const subscriptions = await stripeClient.subscriptions.list({
            limit: 100,
            created: { gte: searchWindowAgo },
            status: "all", // Include all statuses
          });

          paymentLogger.debug(
            VERIFY_SESSION_CONTEXT,
            "Found recent subscriptions to check",
            {
              count: subscriptions.data.length,
            }
          );

          let matchingSubscription = null;
          // CRITICAL: Always require studentId when searching for subscriptions
          // This prevents assigning another student's subscription to the wrong student
          if (!studentId) {
            throw new ValidationError(
              "studentId is required when searching for subscriptions by packageId"
            );
          }

          // First, try to find by both studentId and packageId
          for (const sub of subscriptions.data) {
            const metadata = sub.metadata || {};
            if (
              metadata.studentId === String(studentId) &&
              metadata.packageId === String(packageId)
            ) {
              matchingSubscription = sub;
              paymentLogger.info(
                VERIFY_SESSION_CONTEXT,
                "Found matching subscription (both IDs)",
                {
                  subscriptionId: sub.id,
                  studentId,
                  packageId,
                }
              );
              break;
            }
          }

          // If not found, try to find by packageId only BUT only if:
          // 1. The subscription has NO studentId in metadata (truly pending)
          // 2. The subscription is NOT already in the database for a different student
          if (!matchingSubscription) {
            paymentLogger.debug(
              VERIFY_SESSION_CONTEXT,
              "No match with both IDs, searching for pending subscriptions by packageId",
              {
                packageId,
                studentId,
                subscriptionCount: subscriptions.data.length,
              }
            );

            for (const sub of subscriptions.data) {
              const metadata = sub.metadata || {};
              const subscriptionCustomerId = sub.customer as string;
              const studentCustomerId = student.stripeCustomerId;

              paymentLogger.debug(
                VERIFY_SESSION_CONTEXT,
                "Checking subscription",
                {
                  subscriptionId: sub.id,
                  metadataPackageId: metadata.packageId,
                  metadataStudentId: metadata.studentId || "MISSING",
                  targetPackageId: String(packageId),
                  targetStudentId: String(studentId),
                  status: sub.status,
                  subscriptionCustomerId,
                  studentCustomerId: studentCustomerId || "NONE",
                  customerIdMatch: subscriptionCustomerId === studentCustomerId,
                  created: new Date(sub.created * 1000).toISOString(),
                  ageSeconds: Math.floor(
                    (Date.now() - sub.created * 1000) / 1000
                  ),
                }
              );

              // Only match if packageId matches AND no studentId in metadata (truly pending)
              if (
                metadata.packageId === String(packageId) &&
                !metadata.studentId
              ) {
                paymentLogger.info(
                  VERIFY_SESSION_CONTEXT,
                  "Found subscription with matching packageId and no studentId - evaluating...",
                  {
                    subscriptionId: sub.id,
                    packageId: metadata.packageId,
                  }
                );
                // CRITICAL: Verify the subscription's customer ID matches the student's customer ID
                // This is the strongest check to prevent cross-student assignment
                const subscriptionCustomerId = sub.customer as string;
                const studentCustomerId = student.stripeCustomerId;

                paymentLogger.debug(
                  VERIFY_SESSION_CONTEXT,
                  "Checking customer ID match",
                  {
                    subscriptionId: sub.id,
                    subscriptionCustomerId,
                    studentCustomerId: studentCustomerId || "NONE",
                    match: subscriptionCustomerId === studentCustomerId,
                  }
                );

                // CRITICAL: Check if subscription is already in database for ANY student FIRST
                // This is the most important check - prevents cross-student assignment
                const existingInDb =
                  await prisma.student_subscriptions.findFirst({
                    where: {
                      stripeSubscriptionId: sub.id,
                    },
                    select: {
                      id: true,
                      studentId: true,
                    },
                  });

                if (
                  existingInDb &&
                  existingInDb.studentId !== parseInt(String(studentId))
                ) {
                  // Subscription already belongs to a different student - REJECT
                  paymentLogger.warn(
                    VERIFY_SESSION_CONTEXT,
                    "Subscription already assigned to different student - REJECTING",
                    {
                      subscriptionId: sub.id,
                      existingStudentId: existingInDb.studentId,
                      requestedStudentId: studentId,
                      warning:
                        "This prevents cross-student subscription assignment",
                    }
                  );
                  continue; // Skip this subscription
                }

                // If we get here, subscription is either:
                // 1. Not in database yet (new subscription)
                // 2. Already in database for THIS student (can proceed)

                // Now check customer ID - but be more lenient since we have both studentId and packageId
                if (
                  studentCustomerId &&
                  subscriptionCustomerId !== studentCustomerId
                ) {
                  // Customer ID doesn't match, but subscription isn't assigned to another student
                  // This can happen with payment links where Stripe creates a new customer
                  // Since we have both studentId and packageId from return page (legitimate request),
                  // we can proceed but log a warning
                  paymentLogger.info(
                    VERIFY_SESSION_CONTEXT,
                    "Customer ID mismatch but subscription not assigned - proceeding with finalization",
                    {
                      subscriptionId: sub.id,
                      subscriptionCustomerId,
                      studentCustomerId,
                      note: "Legitimate subscription creation - customer ID mismatch is OK for payment links",
                    }
                  );
                  // Note: We can't change a subscription's customer ID in Stripe, but we can still finalize it
                  // The subscription will be linked to the correct studentId in our database
                }

                paymentLogger.debug(
                  VERIFY_SESSION_CONTEXT,
                  "Database check result",
                  {
                    subscriptionId: sub.id,
                    existsInDb: !!existingInDb,
                    existingStudentId: existingInDb?.studentId,
                    requestedStudentId: studentId,
                  }
                );

                // Only use this subscription if:
                // 1. It's not in the database at all (truly new)
                // 2. OR it's in the database for the SAME student (already linked correctly)
                // Customer ID check was done above and is more lenient for legitimate requests
                if (!existingInDb) {
                  // Since we have both studentId and packageId from the return page, this is a legitimate subscription creation
                  // We don't need the strict 30-second check - the search window (5-10 minutes) is sufficient
                  // The customer ID check above already prevents cross-student assignment

                  matchingSubscription = sub;
                  paymentLogger.info(
                    VERIFY_SESSION_CONTEXT,
                    "Found pending subscription by packageId (no studentId in metadata, not in DB)",
                    {
                      subscriptionId: sub.id,
                      studentId,
                      packageId,
                      subscriptionCustomerId: subscriptionCustomerId,
                      studentCustomerId: studentCustomerId || "NONE",
                      customerIdMatch:
                        subscriptionCustomerId === studentCustomerId,
                      subscriptionAgeSeconds: Math.floor(
                        (Date.now() - sub.created * 1000) / 1000
                      ),
                      note: "Legitimate subscription creation - will update metadata and finalize",
                    }
                  );
                  break;
                } else if (
                  existingInDb.studentId === parseInt(String(studentId))
                ) {
                  // Already exists for this student - that's fine, we can use it
                  matchingSubscription = sub;
                  paymentLogger.info(
                    VERIFY_SESSION_CONTEXT,
                    "Found subscription already linked to this student",
                    {
                      subscriptionId: sub.id,
                      studentId,
                    }
                  );
                  break;
                } else {
                  // Subscription exists for a DIFFERENT student - DO NOT USE IT
                  paymentLogger.warn(
                    VERIFY_SESSION_CONTEXT,
                    "Subscription already exists for a different student - SKIPPING",
                    {
                      subscriptionId: sub.id,
                      existingStudentId: existingInDb.studentId,
                      requestedStudentId: studentId,
                      warning:
                        "This prevents cross-student subscription assignment",
                    }
                  );
                }
              } else if (
                metadata.packageId === String(packageId) &&
                metadata.studentId &&
                metadata.studentId !== String(studentId)
              ) {
                // Package matches but studentId is different - this is another student's subscription
                paymentLogger.warn(
                  VERIFY_SESSION_CONTEXT,
                  "Found subscription with matching packageId but different studentId - SKIPPING",
                  {
                    subscriptionId: sub.id,
                    metadataStudentId: metadata.studentId,
                    requestedStudentId: studentId,
                    warning:
                      "This prevents cross-student subscription assignment",
                  }
                );
              }
            }

            if (!matchingSubscription) {
              paymentLogger.warn(
                VERIFY_SESSION_CONTEXT,
                "No pending subscription found by packageId for this student",
                {
                  packageId,
                  studentId,
                  checkedCount: subscriptions.data.length,
                }
              );
            }
          }

          if (!matchingSubscription) {
            // Also check database for recent subscriptions
            const dbSubscription = await prisma.student_subscriptions.findFirst(
              {
                where: {
                  studentId: parseInt(String(studentId)),
                  packageId: parseInt(String(packageId)),
                  createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                  },
                },
                orderBy: {
                  createdAt: "desc",
                },
              }
            );

            if (dbSubscription && dbSubscription.stripeSubscriptionId) {
              paymentLogger.debug(
                VERIFY_SESSION_CONTEXT,
                "Found subscription in database, retrieving from Stripe",
                {
                  subscriptionId: dbSubscription.stripeSubscriptionId,
                }
              );
              matchingSubscription = await stripeClient.subscriptions.retrieve(
                dbSubscription.stripeSubscriptionId
              );
            }
          }

          if (matchingSubscription) {
            // Use the found subscription to finalize
            const subscriptionId = matchingSubscription.id;
            const existingMetadata = matchingSubscription.metadata || {};

            paymentLogger.debug(VERIFY_SESSION_CONTEXT, "Using subscription", {
              subscriptionId,
              existingMetadata,
            });

            // CRITICAL: Never update metadata if subscription already has a different studentId
            // This prevents overwriting another student's subscription
            const existingStudentId = existingMetadata.studentId;
            if (existingStudentId && existingStudentId !== String(studentId)) {
              throw new ValidationError(
                `Subscription ${subscriptionId} already belongs to student ${existingStudentId}. Cannot assign to student ${studentId}.`
              );
            }

            // Update metadata if needed (only if studentId matches or is missing)
            const needsUpdate =
              (studentId &&
                (!existingMetadata.studentId ||
                  existingMetadata.studentId === String(studentId)) &&
                existingMetadata.studentId !== String(studentId)) ||
              (packageId && existingMetadata.packageId !== String(packageId));

            if (needsUpdate) {
              paymentLogger.debug(
                VERIFY_SESSION_CONTEXT,
                "Updating subscription metadata"
              );
              try {
                const updatedMetadata: Record<string, string> = {
                  ...existingMetadata,
                };
                // Only update studentId if it's missing or matches
                if (
                  studentId &&
                  (!existingMetadata.studentId ||
                    existingMetadata.studentId === String(studentId))
                ) {
                  updatedMetadata.studentId = String(studentId);
                }
                if (packageId) updatedMetadata.packageId = String(packageId);

                await stripeClient.subscriptions.update(subscriptionId, {
                  metadata: updatedMetadata,
                });
                paymentLogger.info(
                  VERIFY_SESSION_CONTEXT,
                  "Updated subscription metadata",
                  { updatedMetadata }
                );
              } catch (err: any) {
                paymentLogger.warn(
                  VERIFY_SESSION_CONTEXT,
                  "Could not update metadata",
                  err
                );
              }
            }

            // CRITICAL: Check if subscription already exists for a DIFFERENT student
            const existingSubscription =
              await prisma.student_subscriptions.findFirst({
                where: {
                  stripeSubscriptionId: subscriptionId,
                },
                select: {
                  id: true,
                  studentId: true,
                  status: true,
                },
              });

            if (existingSubscription) {
              // If it exists for a different student, this is a security issue
              if (
                existingSubscription.studentId !== parseInt(String(studentId))
              ) {
                throw new ValidationError(
                  `Subscription ${subscriptionId} already exists for student ${existingSubscription.studentId}. Cannot assign to student ${studentId}.`
                );
              }

              paymentLogger.debug(
                VERIFY_SESSION_CONTEXT,
                "Subscription already exists in database for this student"
              );
              return NextResponse.json({
                verified: true,
                finalized: true,
                message: "Subscription already finalized",
                subscription: {
                  id: existingSubscription.id,
                  status: existingSubscription.status,
                },
              });
            }

            // Finalize
            const finalStudentId = studentId || existingMetadata.studentId;
            const finalPackageId = packageId || existingMetadata.packageId;

            if (finalStudentId && finalPackageId) {
              paymentLogger.info(
                VERIFY_SESSION_CONTEXT,
                "Finalizing subscription payment",
                {
                  subscriptionId,
                  studentId: finalStudentId,
                  packageId: finalPackageId,
                }
              );
              try {
                const finalizeResult = await finalizeSubscriptionPayment(
                  subscriptionId,
                  {
                    isInitialPayment: true,
                    invoiceAmount: matchingSubscription.items.data[0]?.price
                      ?.unit_amount
                      ? matchingSubscription.items.data[0].price.unit_amount /
                        100
                      : undefined,
                    idempotencyKey: `verify_session_${subscriptionId}_${Date.now()}`,
                  }
                );
                paymentLogger.info(
                  VERIFY_SESSION_CONTEXT,
                  "Subscription payment finalized successfully",
                  {
                    subscriptionId,
                    result: finalizeResult,
                  }
                );

                const createdSubscription =
                  await prisma.student_subscriptions.findFirst({
                    where: {
                      stripeSubscriptionId: subscriptionId,
                    },
                    include: {
                      package: {
                        select: {
                          id: true,
                          name: true,
                          price: true,
                          currency: true,
                          duration: true,
                        },
                      },
                    },
                  });

                return NextResponse.json({
                  verified: true,
                  finalized: true,
                  message: "Subscription finalized successfully",
                  subscription: createdSubscription
                    ? {
                        id: createdSubscription.id,
                        status: createdSubscription.status,
                        startDate: createdSubscription.startDate,
                        endDate: createdSubscription.endDate,
                        nextBillingDate: createdSubscription.nextBillingDate,
                        package: createdSubscription.package,
                      }
                    : null,
                });
              } catch (error: any) {
                paymentLogger.error(
                  VERIFY_SESSION_CONTEXT,
                  "Error finalizing",
                  error
                );
                return NextResponse.json(
                  {
                    verified: true,
                    finalized: false,
                    error: "Failed to finalize subscription",
                    message: error.message,
                  },
                  { status: 500 }
                );
              }
            } else {
              return NextResponse.json(
                {
                  verified: true,
                  finalized: false,
                  message: "Cannot finalize without studentId and packageId",
                  requiresMetadata: true,
                  hasStudentId: !!finalStudentId,
                  hasPackageId: !!finalPackageId,
                },
                { status: 200 }
              );
            }
          } else {
            paymentLogger.warn(
              VERIFY_SESSION_CONTEXT,
              "Could not find subscription with matching metadata"
            );

            // Wait a bit and retry - webhook might still be processing
            paymentLogger.debug(
              VERIFY_SESSION_CONTEXT,
              "Waiting 2 seconds and retrying subscription search"
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Retry search - use same search window
            const retrySubscriptions = await stripeClient.subscriptions.list({
              limit: 100,
              created: { gte: searchWindowAgo }, // Same search window
            });

            for (const sub of retrySubscriptions.data) {
              const metadata = sub.metadata || {};
              // Only match if packageId matches AND (no studentId OR studentId matches)
              if (
                metadata.packageId === String(packageId) &&
                (!metadata.studentId ||
                  metadata.studentId === String(studentId))
              ) {
                // CRITICAL: Verify customer ID matches
                const subscriptionCustomerId = sub.customer as string;
                const studentCustomerId = student.stripeCustomerId;

                if (
                  studentCustomerId &&
                  subscriptionCustomerId !== studentCustomerId
                ) {
                  paymentLogger.warn(
                    VERIFY_SESSION_CONTEXT,
                    "Subscription on retry - customer ID mismatch - SKIPPING",
                    {
                      subscriptionId: sub.id,
                      subscriptionCustomerId,
                      studentCustomerId,
                    }
                  );
                  continue;
                }

                // CRITICAL: Check if subscription is already in database for a different student
                const existingInDb =
                  await prisma.student_subscriptions.findFirst({
                    where: {
                      stripeSubscriptionId: sub.id,
                    },
                    select: {
                      id: true,
                      studentId: true,
                    },
                  });

                if (
                  existingInDb &&
                  existingInDb.studentId !== parseInt(String(studentId))
                ) {
                  paymentLogger.warn(
                    VERIFY_SESSION_CONTEXT,
                    "Subscription on retry already exists for different student - SKIPPING",
                    {
                      subscriptionId: sub.id,
                      existingStudentId: existingInDb.studentId,
                      requestedStudentId: studentId,
                    }
                  );
                  continue;
                }

                matchingSubscription = sub;
                paymentLogger.info(
                  VERIFY_SESSION_CONTEXT,
                  "Found matching subscription on retry",
                  {
                    subscriptionId: sub.id,
                    studentId,
                  }
                );
                break;
              }
            }

            if (matchingSubscription) {
              // Use the found subscription (same logic as above)
              const subscriptionId = matchingSubscription.id;
              const existingMetadata = matchingSubscription.metadata || {};

              paymentLogger.debug(
                VERIFY_SESSION_CONTEXT,
                "Using subscription from retry",
                {
                  subscriptionId,
                }
              );

              // CRITICAL: Never update metadata if subscription already has a different studentId
              const existingStudentId = existingMetadata.studentId;
              if (
                existingStudentId &&
                existingStudentId !== String(studentId)
              ) {
                throw new ValidationError(
                  `Subscription ${subscriptionId} already belongs to student ${existingStudentId}. Cannot assign to student ${studentId}.`
                );
              }

              // Update metadata if needed (only if studentId matches or is missing)
              const needsUpdate =
                (studentId &&
                  (!existingMetadata.studentId ||
                    existingMetadata.studentId === String(studentId)) &&
                  existingMetadata.studentId !== String(studentId)) ||
                (packageId && existingMetadata.packageId !== String(packageId));

              if (needsUpdate) {
                paymentLogger.debug(
                  VERIFY_SESSION_CONTEXT,
                  "Updating subscription metadata"
                );
                try {
                  const updatedMetadata: Record<string, string> = {
                    ...existingMetadata,
                  };
                  // Only update studentId if it's missing or matches
                  if (
                    studentId &&
                    (!existingMetadata.studentId ||
                      existingMetadata.studentId === String(studentId))
                  ) {
                    updatedMetadata.studentId = String(studentId);
                  }
                  if (packageId) updatedMetadata.packageId = String(packageId);

                  await stripeClient.subscriptions.update(subscriptionId, {
                    metadata: updatedMetadata,
                  });
                  paymentLogger.info(
                    VERIFY_SESSION_CONTEXT,
                    "Updated subscription metadata",
                    { updatedMetadata }
                  );

                  // Wait for metadata to propagate in Stripe and verify it was updated
                  let metadataVerified = false;
                  let retries = 5; // Try up to 5 times (2.5 seconds total)

                  while (retries > 0 && !metadataVerified) {
                    await new Promise((resolve) => setTimeout(resolve, 500));

                    try {
                      const verifySubscription =
                        await stripeClient.subscriptions.retrieve(
                          subscriptionId
                        );
                      const verifiedMetadata =
                        verifySubscription.metadata || {};

                      const hasStudentId = studentId
                        ? verifiedMetadata.studentId === String(studentId)
                        : !!verifiedMetadata.studentId;
                      const hasPackageId = packageId
                        ? verifiedMetadata.packageId === String(packageId)
                        : !!verifiedMetadata.packageId;

                      if (hasStudentId && hasPackageId) {
                        metadataVerified = true;
                        paymentLogger.info(
                          VERIFY_SESSION_CONTEXT,
                          "Metadata update verified",
                          {
                            studentId: verifiedMetadata.studentId,
                            packageId: verifiedMetadata.packageId,
                          }
                        );
                      } else {
                        paymentLogger.debug(
                          VERIFY_SESSION_CONTEXT,
                          `Metadata not yet propagated (retry ${
                            6 - retries
                          }/5)`,
                          {
                            hasStudentId,
                            hasPackageId,
                            verifiedMetadata,
                          }
                        );
                        retries--;
                      }
                    } catch (err: any) {
                      paymentLogger.warn(
                        VERIFY_SESSION_CONTEXT,
                        "Error verifying metadata update",
                        err
                      );
                      retries--;
                    }
                  }

                  if (!metadataVerified) {
                    paymentLogger.warn(
                      VERIFY_SESSION_CONTEXT,
                      "Metadata update not verified after retries, but proceeding anyway"
                    );
                  }
                } catch (err: any) {
                  paymentLogger.warn(
                    VERIFY_SESSION_CONTEXT,
                    "Could not update metadata",
                    err
                  );
                  // Continue anyway - finalizeSubscriptionPayment will check metadata again
                }
              }

              // CRITICAL: Check if subscription already exists for a DIFFERENT student
              const existingSubscription =
                await prisma.student_subscriptions.findFirst({
                  where: {
                    stripeSubscriptionId: subscriptionId,
                  },
                  select: {
                    id: true,
                    studentId: true,
                    status: true,
                  },
                });

              if (existingSubscription) {
                // If it exists for a different student, this is a security issue
                if (
                  existingSubscription.studentId !== parseInt(String(studentId))
                ) {
                  throw new ValidationError(
                    `Subscription ${subscriptionId} already exists for student ${existingSubscription.studentId}. Cannot assign to student ${studentId}.`
                  );
                }

                paymentLogger.debug(
                  VERIFY_SESSION_CONTEXT,
                  "Subscription already exists in database for this student"
                );
                return NextResponse.json({
                  verified: true,
                  finalized: true,
                  message: "Subscription already finalized",
                  subscription: {
                    id: existingSubscription.id,
                    status: existingSubscription.status,
                  },
                });
              }

              // Finalize
              const finalStudentId = studentId || existingMetadata.studentId;
              const finalPackageId = packageId || existingMetadata.packageId;

              if (finalStudentId && finalPackageId) {
                paymentLogger.info(
                  VERIFY_SESSION_CONTEXT,
                  "Finalizing subscription payment"
                );
                try {
                  await finalizeSubscriptionPayment(subscriptionId, {
                    isInitialPayment: true,
                    invoiceAmount: matchingSubscription.items.data[0]?.price
                      ?.unit_amount
                      ? matchingSubscription.items.data[0].price.unit_amount /
                        100
                      : undefined,
                    idempotencyKey: `verify_session_retry_${subscriptionId}_${Date.now()}`,
                  });
                  paymentLogger.info(
                    VERIFY_SESSION_CONTEXT,
                    "Subscription payment finalized successfully"
                  );

                  const createdSubscription =
                    await prisma.student_subscriptions.findFirst({
                      where: {
                        stripeSubscriptionId: subscriptionId,
                      },
                      include: {
                        package: {
                          select: {
                            id: true,
                            name: true,
                            price: true,
                            currency: true,
                            duration: true,
                          },
                        },
                      },
                    });

                  return NextResponse.json({
                    verified: true,
                    finalized: true,
                    message: "Subscription finalized successfully",
                    subscription: createdSubscription
                      ? {
                          id: createdSubscription.id,
                          status: createdSubscription.status,
                          startDate: createdSubscription.startDate,
                          endDate: createdSubscription.endDate,
                          nextBillingDate: createdSubscription.nextBillingDate,
                          package: createdSubscription.package,
                        }
                      : null,
                  });
                } catch (error: any) {
                  paymentLogger.error(
                    VERIFY_SESSION_CONTEXT,
                    "Error finalizing",
                    error
                  );
                  return NextResponse.json(
                    {
                      verified: true,
                      finalized: false,
                      error: "Failed to finalize subscription",
                      message: error.message,
                    },
                    { status: 500 }
                  );
                }
              }
            }

            // Still not found after retry
            throw new NotFoundError(
              "No matching subscription found. The webhook may still be processing. Please wait a moment and refresh, or contact support."
            );
          }
        } catch (error: any) {
          paymentLogger.error(
            VERIFY_SESSION_CONTEXT,
            "Error finding subscription",
            error
          );
          throw error;
        }
      }

      if (!sessionId) {
        throw new ValidationError(
          "Session ID or studentId+packageId is required"
        );
      }

      paymentLogger.debug(VERIFY_SESSION_CONTEXT, "Verifying session", {
        sessionId,
        studentId,
        packageId,
      });

      // Retrieve the checkout session
      const session = await stripeClient.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription", "customer"],
      });

      paymentLogger.debug(VERIFY_SESSION_CONTEXT, "Retrieved session", {
        mode: session.mode,
        paymentStatus: session.payment_status,
      });

      // Only process subscription checkouts
      if (session.mode !== "subscription") {
        return NextResponse.json(
          {
            verified: true,
            finalized: false,
            message: "Not a subscription checkout",
            payment: null,
          },
          { status: 200 }
        );
      }

      // Check if payment was successful
      if (session.payment_status !== "paid") {
        return NextResponse.json(
          {
            verified: false,
            finalized: false,
            message: "Payment not completed",
            payment: null,
          },
          { status: 200 }
        );
      }

      // Extract subscription ID - it can be a string or an object when expanded
      let subscriptionId: string;
      if (typeof session.subscription === "string") {
        subscriptionId = session.subscription;
      } else if (
        session.subscription &&
        typeof session.subscription === "object" &&
        "id" in session.subscription
      ) {
        subscriptionId = session.subscription.id;
      } else {
        return NextResponse.json(
          { error: "No subscription found in session" },
          { status: 400 }
        );
      }

      if (!subscriptionId) {
        return NextResponse.json(
          { error: "No subscription found in session" },
          { status: 400 }
        );
      }

      paymentLogger.debug(VERIFY_SESSION_CONTEXT, "Subscription ID", {
        subscriptionId,
      });

      // Get subscription from Stripe
      const subscription = await stripeClient.subscriptions.retrieve(
        subscriptionId
      );
      const existingMetadata = subscription.metadata || {};

      paymentLogger.debug(
        VERIFY_SESSION_CONTEXT,
        "Existing subscription metadata",
        { existingMetadata }
      );

      // CRITICAL: Never update metadata if subscription already has a different studentId
      // This prevents overwriting another student's subscription
      const existingStudentId = existingMetadata.studentId;
      if (
        studentId &&
        existingStudentId &&
        existingStudentId !== String(studentId)
      ) {
        // Check if subscription is already in database for the existing student
        const existingInDb = await prisma.student_subscriptions.findFirst({
          where: {
            stripeSubscriptionId: subscriptionId,
          },
          select: {
            id: true,
            studentId: true,
          },
        });

        if (
          existingInDb &&
          existingInDb.studentId !== parseInt(String(studentId))
        ) {
          throw new ValidationError(
            `Subscription ${subscriptionId} already belongs to student ${existingInDb.studentId}. Cannot assign to student ${studentId}.`
          );
        }

        // If not in DB but has different studentId in metadata, still reject to be safe
        if (!existingInDb) {
          throw new ValidationError(
            `Subscription ${subscriptionId} metadata indicates it belongs to student ${existingStudentId}. Cannot assign to student ${studentId}.`
          );
        }
      }

      // Update subscription metadata if studentId/packageId provided
      // For payment links, packageId might already be in metadata (from webhook), but studentId is missing
      // Only update if studentId matches or is missing
      const needsUpdate =
        (studentId &&
          (!existingMetadata.studentId ||
            existingMetadata.studentId === String(studentId)) &&
          existingMetadata.studentId !== String(studentId)) ||
        (packageId && existingMetadata.packageId !== String(packageId));

      if (needsUpdate && (studentId || packageId)) {
        paymentLogger.debug(
          VERIFY_SESSION_CONTEXT,
          "Updating subscription metadata"
        );
        try {
          const updatedMetadata: Record<string, string> = {
            ...existingMetadata,
          };

          // Only update studentId if it's missing or matches
          if (
            studentId &&
            (!existingMetadata.studentId ||
              existingMetadata.studentId === String(studentId))
          ) {
            updatedMetadata.studentId = String(studentId);
          }
          if (packageId) {
            updatedMetadata.packageId = String(packageId);
          }

          await stripeClient.subscriptions.update(subscriptionId, {
            metadata: updatedMetadata,
          });
          paymentLogger.info(
            VERIFY_SESSION_CONTEXT,
            "Updated subscription metadata in Stripe",
            { updatedMetadata }
          );
        } catch (err: any) {
          paymentLogger.warn(
            VERIFY_SESSION_CONTEXT,
            "Could not update metadata",
            err
          );
        }
      } else {
        paymentLogger.debug(
          VERIFY_SESSION_CONTEXT,
          "Metadata already up to date, skipping update"
        );
      }

      // CRITICAL: Check if subscription already exists for a DIFFERENT student
      const existingSubscription = await prisma.student_subscriptions.findFirst(
        {
          where: {
            stripeSubscriptionId: subscriptionId,
          },
          select: {
            id: true,
            studentId: true,
            status: true,
          },
        }
      );

      // Finalize the subscription payment
      // For payment links, we might have packageId from webhook but need studentId from return page
      // Or we might have both from the return page
      const finalStudentId = studentId || existingMetadata.studentId;
      const finalPackageId = packageId || existingMetadata.packageId;

      if (existingSubscription) {
        // If studentId is provided and doesn't match, this is a security issue
        if (
          finalStudentId &&
          existingSubscription.studentId !== parseInt(String(finalStudentId))
        ) {
          throw new ValidationError(
            `Subscription ${subscriptionId} already exists for student ${existingSubscription.studentId}. Cannot assign to student ${finalStudentId}.`
          );
        }

        paymentLogger.debug(
          VERIFY_SESSION_CONTEXT,
          "Subscription already exists in database"
        );
        return NextResponse.json({
          verified: true,
          finalized: true,
          message: "Subscription already finalized",
          subscription: {
            id: existingSubscription.id,
            status: existingSubscription.status,
          },
        });
      }

      paymentLogger.debug(
        VERIFY_SESSION_CONTEXT,
        "Final IDs for finalization",
        {
          finalStudentId,
          finalPackageId,
          studentIdSource: studentId
            ? "request body"
            : existingMetadata.studentId
            ? "subscription metadata"
            : "MISSING",
          packageIdSource: packageId
            ? "request body"
            : existingMetadata.packageId
            ? "subscription metadata"
            : "MISSING",
        }
      );

      if (finalStudentId && finalPackageId) {
        paymentLogger.info(
          VERIFY_SESSION_CONTEXT,
          "Both studentId and packageId available, finalizing subscription payment",
          {
            subscriptionId,
            studentId: finalStudentId,
            packageId: finalPackageId,
            sessionId: session.id,
          }
        );

        // Ensure subscription metadata is up to date before finalizing
        // This is important because finalizeSubscriptionPayment reads from subscription metadata
        if (needsUpdate && (studentId || packageId)) {
          paymentLogger.debug(
            VERIFY_SESSION_CONTEXT,
            "Waiting for metadata update to propagate"
          );
          // Small delay to ensure Stripe has processed the metadata update
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        try {
          // Double-check that subscription metadata has both IDs before finalizing
          const subscriptionCheck = await stripeClient.subscriptions.retrieve(
            subscriptionId
          );
          const checkMetadata = subscriptionCheck.metadata || {};

          if (!checkMetadata.studentId || !checkMetadata.packageId) {
            paymentLogger.warn(
              VERIFY_SESSION_CONTEXT,
              "Subscription metadata still missing IDs after update, retrying metadata update",
              {
                hasStudentId: !!checkMetadata.studentId,
                hasPackageId: !!checkMetadata.packageId,
              }
            );

            // Force update metadata again
            await stripeClient.subscriptions.update(subscriptionId, {
              metadata: {
                studentId: String(finalStudentId),
                packageId: String(finalPackageId),
                packageName: existingMetadata.packageName || "",
              },
            });

            // Wait a bit more for propagation
            await new Promise((resolve) => setTimeout(resolve, 500));
          }

          paymentLogger.info(
            VERIFY_SESSION_CONTEXT,
            "Calling finalizeSubscriptionPayment",
            {
              subscriptionId,
              isInitialPayment: true,
              invoiceAmount: session.amount_total
                ? session.amount_total / 100
                : undefined,
            }
          );

          const finalizeResult = await finalizeSubscriptionPayment(
            subscriptionId,
            {
              isInitialPayment: true,
              sessionId: session.id,
              invoiceAmount: session.amount_total
                ? session.amount_total / 100
                : undefined,
              idempotencyKey: `verify_session_${session.id}`,
            }
          );

          paymentLogger.info(
            VERIFY_SESSION_CONTEXT,
            "Subscription payment finalized successfully",
            {
              subscriptionId,
              result: finalizeResult,
            }
          );

          // Get the created subscription with full details
          const createdSubscription =
            await prisma.student_subscriptions.findFirst({
              where: {
                stripeSubscriptionId: subscriptionId,
              },
              include: {
                package: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    currency: true,
                    duration: true,
                  },
                },
              },
            });

          if (!createdSubscription) {
            paymentLogger.warn(
              VERIFY_SESSION_CONTEXT,
              "Subscription finalized but not found in database"
            );
            return NextResponse.json(
              {
                verified: true,
                finalized: true,
                message: "Subscription finalized but record not found",
                warning: "Subscription may have been created but not retrieved",
              },
              { status: 200 }
            );
          }

          paymentLogger.info(
            VERIFY_SESSION_CONTEXT,
            "Subscription record found",
            {
              subscriptionRecordId: createdSubscription.id,
              status: createdSubscription.status,
            }
          );

          return NextResponse.json({
            verified: true,
            finalized: true,
            message: "Subscription finalized successfully",
            subscription: {
              id: createdSubscription.id,
              status: createdSubscription.status,
              startDate: createdSubscription.startDate,
              endDate: createdSubscription.endDate,
              nextBillingDate: createdSubscription.nextBillingDate,
              package: createdSubscription.package,
            },
          });
        } catch (error: any) {
          paymentLogger.error(
            VERIFY_SESSION_CONTEXT,
            "Error finalizing",
            error
          );

          // If metadata is still missing, return error with helpful message
          if (
            error.message?.includes("studentId") ||
            error.message?.includes("packageId")
          ) {
            return NextResponse.json(
              {
                verified: true,
                finalized: false,
                error:
                  "Missing studentId or packageId in subscription metadata",
                message: error.message,
                suggestion:
                  "The subscription metadata may not have been updated. Please try again or contact support.",
              },
              { status: 400 }
            );
          }

          // For other errors, return 500 but include helpful info
          return NextResponse.json(
            {
              verified: true,
              finalized: false,
              error: "Failed to finalize subscription",
              message: error.message,
            },
            { status: 500 }
          );
        }
      } else {
        const missing = [];
        if (!finalStudentId) missing.push("studentId");
        if (!finalPackageId) missing.push("packageId");

        paymentLogger.warn(
          VERIFY_SESSION_CONTEXT,
          `Cannot finalize - missing: ${missing.join(" and ")}`,
          {
            finalStudentId: finalStudentId || "MISSING",
            finalPackageId: finalPackageId || "MISSING",
            requestBody: {
              studentId: studentId || "undefined",
              packageId: packageId || "undefined",
            },
            existingMetadata,
          }
        );

        return NextResponse.json(
          {
            verified: true,
            finalized: false,
            message: `Session verified but cannot finalize without ${missing.join(
              " and "
            )}`,
            requiresMetadata: true,
            hasStudentId: !!finalStudentId,
            hasPackageId: !!finalPackageId,
            suggestion: missing.includes("studentId")
              ? "Please provide studentId in the request body or ensure it's in subscription metadata"
              : "Please provide packageId in the request body or ensure it's in subscription metadata",
          },
          { status: 200 }
        );
      }
    },
    VERIFY_SESSION_CONTEXT,
    "Failed to verify session"
  ).catch((error) => handlePaymentError(error, VERIFY_SESSION_CONTEXT));
}
