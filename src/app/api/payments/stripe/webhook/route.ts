import { NextRequest, NextResponse } from "next/server";
import { stripeClient } from "@/lib/payments/stripe";
import { finalizeSubscriptionPayment } from "@/lib/payments/finalizeSubscription";
import { prisma } from "@/lib/prisma";
import { PaymentSource, PaymentIntent } from "@prisma/client";
import { paymentLogger } from "@/lib/payments/logger";
import {
  handlePaymentError,
  SecurityError,
  safeExecute,
} from "@/lib/payments/errorHandler";
import {
  checkWebhookRateLimit,
  validateWebhookRequestSize,
  validateWebhookContentType,
} from "@/lib/payments/webhookSecurity";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const WEBHOOK_CONTEXT = "StripeWebhook";

/**
 * POST /api/payments/stripe/webhook
 * Handle Stripe webhook events for subscription auto-renewal
 *
 * This is separate from /api/payments/webhooks/stripe which handles UI payments
 */
export async function POST(request: NextRequest) {
  if (!stripeClient) {
    paymentLogger.error(WEBHOOK_CONTEXT, "Stripe client not configured");
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  return safeExecute(
    async () => {
      // Security: Validate content type
      const contentTypeCheck = validateWebhookContentType(request);
      if (!contentTypeCheck.valid) {
        throw new SecurityError(
          contentTypeCheck.error || "Invalid content type"
        );
      }

      // Security: Rate limiting
      const rateLimitCheck = checkWebhookRateLimit(request);
      if (!rateLimitCheck.allowed) {
        paymentLogger.warn(WEBHOOK_CONTEXT, "Rate limit exceeded", {
          retryAfter: rateLimitCheck.retryAfter,
        });
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            retryAfter: rateLimitCheck.retryAfter,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(rateLimitCheck.retryAfter || 60),
            },
          }
        );
      }

      const body = await request.text();

      // Security: Validate request size
      const sizeCheck = validateWebhookRequestSize(body);
      if (!sizeCheck.valid) {
        throw new SecurityError(sizeCheck.error || "Request too large");
      }

      const signature = request.headers.get("stripe-signature");

      if (!signature) {
        paymentLogger.error(
          WEBHOOK_CONTEXT,
          "Missing stripe-signature header",
          undefined,
          {
            headers: Object.fromEntries(request.headers.entries()),
          }
        );
        throw new SecurityError("Missing stripe-signature header");
      }

      if (!webhookSecret) {
        paymentLogger.warn(
          WEBHOOK_CONTEXT,
          "STRIPE_WEBHOOK_SECRET not set, skipping signature verification"
        );
        if (process.env.NODE_ENV === "production") {
          throw new SecurityError("Webhook secret required in production");
        }
        // In development, allow without verification but log warning
        paymentLogger.warn(
          WEBHOOK_CONTEXT,
          "âڑ ï¸ڈ Running without webhook secret - NOT SECURE for production!"
        );
      }

      let event: any;

      try {
        if (webhookSecret && stripeClient) {
          event = stripeClient.webhooks.constructEvent(
            body,
            signature,
            webhookSecret
          );
        } else {
          paymentLogger.warn(
            WEBHOOK_CONTEXT,
            "Parsing event without signature verification (development mode)"
          );
          // In development without secret, parse JSON directly
          try {
            event = JSON.parse(body);
          } catch (parseErr: any) {
            throw new SecurityError(
              `Failed to parse webhook body: ${parseErr.message}`
            );
          }
        }
      } catch (err: any) {
        paymentLogger.error(
          WEBHOOK_CONTEXT,
          "Signature verification failed",
          err,
          {
            errorType: err.constructor.name,
            errorMessage: err.message,
            hasWebhookSecret: !!webhookSecret,
            hasSignature: !!signature,
            bodyLength: body.length,
          }
        );

        // Provide more helpful error message
        if (err.message?.includes("No signatures found")) {
          throw new SecurityError(
            "Invalid webhook signature format. Check STRIPE_WEBHOOK_SECRET matches Stripe CLI secret."
          );
        } else if (err.message?.includes("No signatures found matching")) {
          throw new SecurityError(
            "Webhook signature doesn't match. Ensure STRIPE_WEBHOOK_SECRET matches your Stripe webhook endpoint secret."
          );
        } else {
          throw new SecurityError(
            `Webhook signature verification failed: ${err.message}`
          );
        }
      }

      try {
        switch (event.type) {
          case "checkout.session.completed":
            await handleCheckoutSessionCompleted(event.data.object);
            break;

          case "invoice.payment_succeeded":
            await handleInvoicePaymentSucceeded(event.data.object);
            break;

          case "invoice.payment_failed":
            await handleInvoicePaymentFailed(event.data.object);
            break;

          case "customer.subscription.deleted":
            await handleSubscriptionDeleted(event.data.object);
            break;

          case "customer.subscription.updated":
            await handleSubscriptionUpdated(event.data.object);
            break;

          case "invoice.upcoming":
            await handleInvoiceUpcoming(event.data.object);
            break;

          default:
            // Unhandled event type - silently ignore
            break;
        }
        return NextResponse.json({ received: true });
      } catch (error: unknown) {
        paymentLogger.error(WEBHOOK_CONTEXT, "Error processing event", error, {
          eventType: event.type,
        });
        throw error;
      }
    },
    WEBHOOK_CONTEXT,
    "Webhook processing failed"
  ).catch((error) => {
    // Log the error with more context before handling
    if (error instanceof SecurityError) {
      paymentLogger.error(WEBHOOK_CONTEXT, "Security error in webhook", error, {
        errorCode: error.code,
        errorMessage: error.message,
        details: error.details,
      });
    }
    return handlePaymentError(error, WEBHOOK_CONTEXT);
  });
}

/**
 * Handle checkout.session.completed event
 * This is triggered when a subscription checkout is completed (initial payment)
 * Works for both dynamic checkout sessions and payment links
 */
async function handleCheckoutSessionCompleted(session: any) {
  paymentLogger.debug(
    WEBHOOK_CONTEXT,
    "Processing checkout.session.completed",
    {
      sessionId: session.id,
      mode: session.mode,
      paymentStatus: session.payment_status,
      metadata: session.metadata,
      subscription: session.subscription,
    }
  );

  // Only process subscription checkouts
  if (session.mode !== "subscription") {
    paymentLogger.debug(
      WEBHOOK_CONTEXT,
      "Not a subscription checkout, skipping"
    );
    return;
  }

  // Extract subscription ID - it can be a string ID or an expanded object
  let subscriptionId: string | null = null;
  if (session.subscription) {
    if (typeof session.subscription === "string") {
      subscriptionId = session.subscription;
    } else if (session.subscription.id) {
      subscriptionId = session.subscription.id;
    }
  }

  let metadata = session.metadata || {};

  paymentLogger.debug(WEBHOOK_CONTEXT, "Extracted subscription info", {
    subscriptionId,
    metadata,
  });

  if (!subscriptionId) {
    paymentLogger.error(WEBHOOK_CONTEXT, "No subscription ID in session");
    return;
  }

  // If metadata doesn't have studentId/packageId, try multiple sources
  if (!metadata.studentId || !metadata.packageId) {
    paymentLogger.debug(
      WEBHOOK_CONTEXT,
      "Missing studentId/packageId in session metadata, trying to extract"
    );

    // Method 1: Try to get from payment_checkout (for dynamic checkouts)
    const checkout = await prisma.payment_checkout.findFirst({
      where: {
        OR: [
          { txRef: session.client_reference_id || "" },
          { checkoutUrl: { contains: session.id } },
        ],
        provider: PaymentSource.stripe,
        intent: PaymentIntent.subscription,
      },
    });

    if (checkout) {
      paymentLogger.debug(WEBHOOK_CONTEXT, "Found payment_checkout record", {
        checkoutId: checkout.id,
      });
      const checkoutMetadata = checkout.metadata as any;
      if (checkoutMetadata?.packageId) {
        metadata.packageId = String(checkoutMetadata.packageId);
        metadata.studentId = String(checkout.studentId);
        metadata.packageName = checkoutMetadata.packageName || "";

        paymentLogger.info(WEBHOOK_CONTEXT, "Extracted from payment_checkout", {
          studentId: metadata.studentId,
          packageId: metadata.packageId,
        });
      }
    }

    // Method 2: Try to get from Stripe subscription metadata (for payment links)
    // This is especially useful when invoice.payment_succeeded has already set packageId
    if ((!metadata.studentId || !metadata.packageId) && stripeClient) {
      try {
        paymentLogger.debug(
          WEBHOOK_CONTEXT,
          "Checking Stripe subscription metadata"
        );
        const stripeSubscription = await stripeClient.subscriptions.retrieve(
          subscriptionId
        );
        const subscriptionMetadata = stripeSubscription.metadata || {};

        // Use packageId from subscription metadata if available (even without studentId)
        if (subscriptionMetadata.packageId && !metadata.packageId) {
          metadata.packageId = subscriptionMetadata.packageId;
          metadata.packageName = subscriptionMetadata.packageName || "";
          paymentLogger.debug(
            WEBHOOK_CONTEXT,
            "Extracted packageId from Stripe subscription metadata",
            {
              packageId: metadata.packageId,
            }
          );
        }

        // Use studentId from subscription metadata if available
        if (subscriptionMetadata.studentId && !metadata.studentId) {
          metadata.studentId = subscriptionMetadata.studentId;
          paymentLogger.debug(
            WEBHOOK_CONTEXT,
            "Extracted studentId from Stripe subscription metadata",
            {
              studentId: metadata.studentId,
            }
          );
        }

        // If we have both, log success
        if (metadata.studentId && metadata.packageId) {
          paymentLogger.info(
            WEBHOOK_CONTEXT,
            "Extracted from Stripe subscription metadata",
            {
              studentId: metadata.studentId,
              packageId: metadata.packageId,
            }
          );
        } else if (
          !subscriptionMetadata.studentId &&
          !subscriptionMetadata.packageId
        ) {
          paymentLogger.warn(
            WEBHOOK_CONTEXT,
            "Stripe subscription also missing metadata"
          );
        }
      } catch (err: any) {
        paymentLogger.warn(
          WEBHOOK_CONTEXT,
          "Could not retrieve Stripe subscription",
          err
        );
      }
    }

    // Method 3: Try to match by payment link (if payment link was used)
    if ((!metadata.studentId || !metadata.packageId) && session.payment_link) {
      try {
        paymentLogger.debug(
          WEBHOOK_CONTEXT,
          "Payment link detected, trying to find matching package"
        );
        const paymentLinkId =
          typeof session.payment_link === "string"
            ? session.payment_link
            : session.payment_link.id;

        paymentLogger.debug(WEBHOOK_CONTEXT, "Payment link ID from Stripe", {
          paymentLinkId,
        });

        // Payment links can be stored in different formats:
        // 1. Full URL: "https://buy.stripe.com/test_XXXXX" or "https://pay.stripe.com/XXXXX"
        // 2. Payment link ID: "plink_XXXXX"
        // 3. Just the ID part: "XXXXX"

        // Extract the ID part from payment link ID (e.g., "plink_1SUiaNJUqo1eecQ6qf2nn7LW" -> "1SUiaNJUqo1eecQ6qf2nn7LW")
        let idPart = paymentLinkId;
        if (paymentLinkId.startsWith("plink_")) {
          idPart = paymentLinkId.replace("plink_", "");
        }

        paymentLogger.debug(
          WEBHOOK_CONTEXT,
          "Extracted ID part from payment link",
          { idPart }
        );

        // Get the actual payment link URL from Stripe to match with database
        let paymentLinkUrl = null;
        if (stripeClient && paymentLinkId.startsWith("plink_")) {
          try {
            const stripePaymentLink = await stripeClient.paymentLinks.retrieve(
              paymentLinkId
            );
            paymentLinkUrl = stripePaymentLink.url;
            paymentLogger.debug(
              WEBHOOK_CONTEXT,
              "Retrieved payment link URL from Stripe",
              { paymentLinkUrl }
            );

            // Extract ID from the URL (e.g., "https://buy.stripe.com/test_aFa14o9SAe3S1yadcK1ZS06" -> "aFa14o9SAe3S1yadcK1ZS06")
            const urlIdMatch = paymentLinkUrl.match(/test_([a-zA-Z0-9]+)/);
            if (urlIdMatch) {
              idPart = urlIdMatch[1]; // Use the ID from the URL for matching
              paymentLogger.debug(
                WEBHOOK_CONTEXT,
                "Extracted ID from payment link URL",
                { idPart }
              );
            }
          } catch (err: any) {
            paymentLogger.warn(
              WEBHOOK_CONTEXT,
              "Could not retrieve payment link from Stripe",
              err
            );
          }
        }

        // Get all packages with payment links to match manually
        // This is more reliable than database queries with complex patterns
        const allPackagesWithLinks =
          await prisma.subscription_packages.findMany({
            where: {
              paymentLink: { not: null },
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              paymentLink: true,
            },
          });

        paymentLogger.debug(
          WEBHOOK_CONTEXT,
          "Found packages with payment links",
          {
            count: allPackagesWithLinks.length,
          }
        );

        // Try to match by extracting ID from each payment link
        let packageWithLink = null;
        for (const pkg of allPackagesWithLinks) {
          if (!pkg.paymentLink) continue;

          paymentLogger.debug(
            WEBHOOK_CONTEXT,
            "Checking package for payment link match",
            {
              packageId: pkg.id,
              paymentLink: pkg.paymentLink,
            }
          );

          // Extract ID from URL format: "https://buy.stripe.com/test_XXXXX"
          // Also handle other formats like "https://pay.stripe.com/XXXXX"
          const urlMatch = pkg.paymentLink.match(
            /(?:test_|pay\.stripe\.com\/)([a-zA-Z0-9]+)/
          );
          const extractedId = urlMatch ? urlMatch[1] : null;

          // Also check if payment link contains the plink_ format
          const plinkMatch = pkg.paymentLink.match(/plink_([a-zA-Z0-9]+)/);
          const extractedPlinkId = plinkMatch ? plinkMatch[1] : null;

          paymentLogger.debug(WEBHOOK_CONTEXT, "Extracted IDs for comparison", {
            packageId: pkg.id,
            extractedId,
            extractedPlinkId,
            stripeId: idPart,
          });

          // Match if:
          // 1. Payment link URL matches exactly
          // 2. Payment link contains the full payment link ID
          // 3. Payment link contains just the ID part
          // 4. Extracted ID from URL matches the ID part
          // 5. Extracted plink ID matches the ID part
          const fullMatch =
            (paymentLinkUrl && pkg.paymentLink === paymentLinkUrl) ||
            pkg.paymentLink.includes(paymentLinkId) ||
            pkg.paymentLink.includes(idPart) ||
            (extractedId && extractedId === idPart) ||
            (extractedPlinkId && extractedPlinkId === idPart);

          if (fullMatch) {
            packageWithLink = pkg;
            paymentLogger.info(
              WEBHOOK_CONTEXT,
              "Matched package by payment link",
              {
                packageId: pkg.id,
                paymentLink: pkg.paymentLink,
                extractedId,
              }
            );
            break;
          } else {
            paymentLogger.debug(WEBHOOK_CONTEXT, "No match for package", {
              packageId: pkg.id,
            });
          }
        }

        if (packageWithLink) {
          paymentLogger.info(WEBHOOK_CONTEXT, "Found package by payment link", {
            packageId: packageWithLink.id,
            packageName: packageWithLink.name,
            paymentLink: packageWithLink.paymentLink,
          });

          // Store packageId immediately
          metadata.packageId = String(packageWithLink.id);
          metadata.packageName = packageWithLink.name;

          // We still need studentId - try to get from customer
          if (session.customer && stripeClient) {
            try {
              const customer = await stripeClient.customers.retrieve(
                session.customer as string
              );
              const customerMetadata =
                customer && !customer.deleted && "metadata" in customer
                  ? customer.metadata || {}
                  : {};
              paymentLogger.debug(WEBHOOK_CONTEXT, "Customer metadata", {
                customerMetadata,
              });

              if (customerMetadata.studentId) {
                metadata.studentId = customerMetadata.studentId;
                paymentLogger.info(
                  WEBHOOK_CONTEXT,
                  "Extracted from customer metadata",
                  {
                    studentId: metadata.studentId,
                    packageId: metadata.packageId,
                  }
                );
              } else {
                paymentLogger.warn(
                  WEBHOOK_CONTEXT,
                  "Customer metadata also missing studentId"
                );
                paymentLogger.debug(
                  WEBHOOK_CONTEXT,
                  "Stored packageId, studentId will be added by return page",
                  {
                    packageId: metadata.packageId,
                  }
                );
              }
            } catch (err: any) {
              paymentLogger.warn(
                WEBHOOK_CONTEXT,
                "Could not retrieve customer",
                err
              );
              paymentLogger.debug(
                WEBHOOK_CONTEXT,
                "Stored packageId, studentId will be added by return page",
                {
                  packageId: metadata.packageId,
                }
              );
            }
          } else {
            paymentLogger.debug(
              WEBHOOK_CONTEXT,
              "Stored packageId, studentId will be added by return page",
              {
                packageId: metadata.packageId,
              }
            );
          }

          // Update subscription metadata in Stripe with packageId (even without studentId)
          // This ensures the subscription has the packageId for future processing
          if (stripeClient && subscriptionId) {
            try {
              await stripeClient.subscriptions.update(subscriptionId, {
                metadata: {
                  ...metadata,
                  packageId: metadata.packageId,
                  packageName: metadata.packageName,
                },
              });
              paymentLogger.info(
                WEBHOOK_CONTEXT,
                "Updated subscription metadata in Stripe with packageId",
                {
                  packageId: metadata.packageId,
                }
              );
            } catch (err: any) {
              paymentLogger.warn(
                WEBHOOK_CONTEXT,
                "Could not update subscription metadata",
                err
              );
            }
          }
        } else {
          paymentLogger.warn(
            WEBHOOK_CONTEXT,
            "Could not find package with payment link",
            {
              paymentLinkId,
            }
          );
          // List all packages with payment links for debugging
          const allPackagesWithLinks =
            await prisma.subscription_packages.findMany({
              where: {
                paymentLink: { not: null },
                isActive: true,
              },
              select: {
                id: true,
                name: true,
                paymentLink: true,
              },
            });
          paymentLogger.debug(
            WEBHOOK_CONTEXT,
            "Available packages with payment links",
            {
              packages: allPackagesWithLinks,
            }
          );
        }
      } catch (err: any) {
        paymentLogger.error(
          WEBHOOK_CONTEXT,
          "Error matching payment link",
          err
        );
      }
    }

    // Update subscription metadata in Stripe if we found any data
    // Update with packageId even if studentId is missing (studentId will come from return page)
    if (metadata.packageId && stripeClient && subscriptionId) {
      try {
        const updateData: any = {
          packageId: metadata.packageId,
          packageName: metadata.packageName || "",
        };

        if (metadata.studentId) {
          updateData.studentId = metadata.studentId;
        }

        if (checkout?.txRef) {
          updateData.txRef = checkout.txRef;
        }

        await stripeClient.subscriptions.update(subscriptionId, {
          metadata: updateData,
        });
        paymentLogger.info(
          WEBHOOK_CONTEXT,
          "Updated subscription metadata in Stripe",
          { updateData }
        );
      } catch (err: any) {
        paymentLogger.warn(
          WEBHOOK_CONTEXT,
          "Could not update subscription metadata",
          err
        );
      }
    }

    // If we have packageId but not studentId, wait a bit and re-check subscription metadata
    // This handles the race condition where invoice.payment_succeeded has just set packageId
    if (metadata.packageId && !metadata.studentId && stripeClient) {
      paymentLogger.debug(
        WEBHOOK_CONTEXT,
        "Found packageId but missing studentId, re-checking subscription metadata",
        {
          packageId: metadata.packageId,
        }
      );

      // Wait up to 2 seconds, checking every 500ms for studentId to be added
      let retries = 4;
      while (retries > 0 && !metadata.studentId) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        try {
          const stripeSubscription = await stripeClient.subscriptions.retrieve(
            subscriptionId
          );
          const subscriptionMetadata = stripeSubscription.metadata || {};

          if (subscriptionMetadata.studentId) {
            metadata.studentId = subscriptionMetadata.studentId;
            paymentLogger.info(
              WEBHOOK_CONTEXT,
              "Found studentId in subscription metadata after retry",
              {
                studentId: metadata.studentId,
              }
            );
            break;
          }
        } catch (err: any) {
          paymentLogger.warn(
            WEBHOOK_CONTEXT,
            "Could not retrieve subscription during retry",
            err
          );
        }
        retries--;
      }
    }

    if (!metadata.studentId || !metadata.packageId) {
      const missingFields = [];
      if (!metadata.studentId) missingFields.push("studentId");
      if (!metadata.packageId) missingFields.push("packageId");

      paymentLogger.warn(
        WEBHOOK_CONTEXT,
        `Could not find ${missingFields.join(" and ")} from any source`,
        {
          sessionId: session.id,
          subscriptionId,
          clientReferenceId: session.client_reference_id,
          paymentLink: session.payment_link,
          customer: session.customer,
        }
      );
    }
  }

  // Finalize the initial subscription payment
  // The invoice.payment_succeeded event will also fire, but we handle initial payment here
  // to ensure subscription record is created immediately
  // Check if already processed to avoid duplicates
  const existingSubscription = await prisma.student_subscriptions.findFirst({
    where: {
      stripeSubscriptionId: subscriptionId,
    },
  });

  if (existingSubscription) {
    paymentLogger.debug(
      WEBHOOK_CONTEXT,
      "Subscription already exists, skipping duplicate processing",
      {
        subscriptionId,
      }
    );
  } else if (metadata.studentId && metadata.packageId) {
    // Both IDs present - finalize immediately
    try {
      paymentLogger.info(
        WEBHOOK_CONTEXT,
        "Finalizing initial subscription payment (both IDs present)"
      );
      await finalizeSubscriptionPayment(subscriptionId, {
        isInitialPayment: true,
        sessionId: session.id,
        invoiceAmount: session.amount_total
          ? session.amount_total / 100
          : undefined,
        idempotencyKey: `webhook_session_${session.id}`,
      });
      paymentLogger.info(
        WEBHOOK_CONTEXT,
        "Initial subscription payment finalized"
      );
    } catch (error: any) {
      paymentLogger.error(
        WEBHOOK_CONTEXT,
        "Error finalizing initial payment",
        error
      );
      // Don't throw - invoice.payment_succeeded will handle it as fallback
    }
  } else if (metadata.packageId && !metadata.studentId) {
    // We have packageId but no studentId - this happens with payment links
    // Try to get studentId from the customer or wait for return page
    paymentLogger.info(
      WEBHOOK_CONTEXT,
      "Have packageId but missing studentId - will be finalized by return page",
      {
        packageId: metadata.packageId,
        subscriptionId,
      }
    );

    // Update subscription metadata with packageId so return page can find it
    if (stripeClient && subscriptionId) {
      try {
        await stripeClient.subscriptions.update(subscriptionId, {
          metadata: {
            packageId: metadata.packageId,
            packageName: metadata.packageName || "",
            // Don't set studentId yet - return page will add it
          },
        });
        paymentLogger.info(
          WEBHOOK_CONTEXT,
          "Updated subscription metadata with packageId for return page processing"
        );
      } catch (err: any) {
        paymentLogger.warn(
          WEBHOOK_CONTEXT,
          "Could not update subscription metadata",
          err
        );
      }
    }

    // Don't finalize here - let the return page handle it when studentId is available
    // The return page's verify-session will find this subscription by packageId and finalize it
  } else {
    const hasPackageId = !!metadata.packageId;
    const hasStudentId = !!metadata.studentId;

    if (hasPackageId && !hasStudentId) {
      paymentLogger.info(
        WEBHOOK_CONTEXT,
        "Found packageId but missing studentId (expected for payment links)",
        {
          packageId: metadata.packageId,
          subscriptionId,
        }
      );
      paymentLogger.debug(
        WEBHOOK_CONTEXT,
        "Return page will call verify-session with studentId to finalize"
      );
    } else if (!hasPackageId && !hasStudentId) {
      paymentLogger.warn(
        WEBHOOK_CONTEXT,
        "Cannot finalize - missing both studentId and packageId",
        {
          sessionId: session.id,
          subscriptionId,
          paymentLink: session.payment_link || "N/A",
          metadata,
        }
      );
    } else {
      paymentLogger.warn(
        WEBHOOK_CONTEXT,
        `Cannot finalize - missing ${
          !hasStudentId ? "studentId" : "packageId"
        }`,
        {
          metadata,
        }
      );
    }
  }

  // Mark checkout as completed
  if (session.client_reference_id) {
    await prisma.payment_checkout.updateMany({
      where: { txRef: session.client_reference_id },
      data: { status: "completed" },
    });
    paymentLogger.info(
      WEBHOOK_CONTEXT,
      "Updated payment_checkout status to completed",
      {
        txRef: session.client_reference_id,
      }
    );
  }
}

/**
 * Helper function to re-check invoice for tax (used in background checks)
 */
async function recheckInvoiceTax(
  invoiceId: string,
  subscriptionId: string | null,
  stripeClient: any,
  attemptLabel: string
) {
  try {
    if (!stripeClient) return;
    
    paymentLogger.info(
      WEBHOOK_CONTEXT,
      `Background tax re-check (${attemptLabel})`,
      { invoiceId, subscriptionId }
    );
    
    const recheckedInvoice = await stripeClient.invoices.retrieve(invoiceId, {
      expand: [
        'total_details.breakdown.tax_details',
        'lines.data.tax_amounts',
        'lines.data.tax_rates',
      ],
    });
    
    let recheckTaxAmount = 0;
    if (recheckedInvoice.tax) {
      recheckTaxAmount = recheckedInvoice.tax / 100;
    } else if (recheckedInvoice.total_details?.amount_tax) {
      recheckTaxAmount = recheckedInvoice.total_details.amount_tax / 100;
    } else if (recheckedInvoice.total_details?.breakdown?.tax_details) {
      recheckTaxAmount = recheckedInvoice.total_details.breakdown.tax_details.reduce((sum: number, taxDetail: any) => {
        return sum + (taxDetail.amount ? taxDetail.amount / 100 : 0);
      }, 0);
    } else if (recheckedInvoice.lines?.data) {
      for (const line of recheckedInvoice.lines.data) {
        if (line.tax_amounts && line.tax_amounts.length > 0) {
          recheckTaxAmount += line.tax_amounts.reduce((sum: number, taxAmount: any) => {
            return sum + (taxAmount.amount ? taxAmount.amount / 100 : 0);
          }, 0);
        }
      }
    }
    
    if (recheckTaxAmount > 0) {
      // Get subscription record for this invoice
      const recheckSubscriptionRecord = await prisma.student_subscriptions.findFirst({
        where: {
          stripeSubscriptionId: subscriptionId || "",
        },
        select: {
          id: true,
          studentId: true,
          packageId: true,
        },
      });
      
      // Store the tax transaction now
      await storeTaxTransaction(
        invoiceId,
        subscriptionId,
        recheckTaxAmount,
        recheckedInvoice,
        recheckSubscriptionRecord,
        stripeClient
      );
    }
  } catch (err: any) {
    paymentLogger.warn(
      WEBHOOK_CONTEXT,
      `Error in background tax re-check (${attemptLabel})`,
      err
    );
  }
}

/**
 * Helper function to store tax transaction in database
 */
async function storeTaxTransaction(
  invoiceId: string,
  subscriptionId: string | null,
  taxAmount: number,
  invoice: any,
  subscriptionRecord: any,
  stripeClient: any
) {
  try {
    // Check if tax transaction already exists for this invoice (idempotency)
    const existingTaxTransaction = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM tax_transactions WHERE invoiceId = ? LIMIT 1`,
      invoiceId
    ).catch(() => []);

    if (existingTaxTransaction.length > 0) {
      paymentLogger.debug(
        WEBHOOK_CONTEXT,
        "Tax transaction already exists for this invoice",
        { invoiceId }
      );
      return;
    }

    // Extract amounts
    const subtotalAmount = invoice.subtotal ? invoice.subtotal / 100 : 0;
    const totalAmount = invoice.total ? invoice.total / 100 : 0;
    const baseAmount = subtotalAmount; // For inclusive tax, base is the subtotal

    // Extract Stripe fee
    let stripeFee = 0;
    if (invoice.charge && stripeClient) {
      try {
        const chargeId = typeof invoice.charge === "string" ? invoice.charge : invoice.charge.id;
        const charge = await stripeClient.charges.retrieve(chargeId);
        if (charge.balance_transaction) {
          const balanceTransaction = await stripeClient.balanceTransactions.retrieve(
            charge.balance_transaction as string
          );
          stripeFee = balanceTransaction.fee ? balanceTransaction.fee / 100 : 0;
        }
      } catch (err: any) {
        // Calculate approximate fee if we can't get it
        const currency = invoice.currency?.toUpperCase() || "USD";
        const feePercentage = 0.029;
        const fixedFee = currency === "USD" ? 0.30 : currency === "EUR" ? 0.25 : 0.30;
        stripeFee = (totalAmount * feePercentage) + fixedFee;
      }
    }

    // Extract tax breakdown
    let taxBreakdown: any = null;
    if (invoice.automatic_tax?.enabled && invoice.total_details?.breakdown?.tax_details) {
      taxBreakdown = {
        total_tax: taxAmount,
        breakdown: invoice.total_details.breakdown.tax_details.map((taxDetail: any) => ({
          jurisdiction: taxDetail.jurisdiction || null,
          tax_type: taxDetail.type || null,
          rate: taxDetail.rate ? taxDetail.rate / 100 : null,
          amount: taxDetail.amount ? taxDetail.amount / 100 : 0,
          taxable_amount: taxDetail.taxable_amount ? taxDetail.taxable_amount / 100 : 0,
        })),
      };
    } else if (taxAmount > 0) {
      taxBreakdown = {
        total_tax: taxAmount,
        breakdown: [{
          jurisdiction: null,
          tax_type: "sales_tax",
          rate: subtotalAmount > 0 ? (taxAmount / subtotalAmount) : null,
          amount: taxAmount,
          taxable_amount: subtotalAmount,
        }],
      };
    }

    // Get billing address
    let billingAddress: any = null;
    let customerId: string | null = null;
    if (invoice.customer) {
      customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;
      if (stripeClient && customerId) {
        try {
          const customer = await stripeClient.customers.retrieve(customerId);
          if (customer && !customer.deleted && "address" in customer) {
            billingAddress = customer.address;
          }
        } catch (err: any) {
          // Ignore errors
        }
      }
    }

    // Create tax transaction record
    const taxTransactionId = `tax_${invoiceId}_${Date.now()}`;
    const taxBreakdownJson = taxBreakdown ? JSON.stringify(taxBreakdown) : null;
    const billingAddressJson = billingAddress ? JSON.stringify(billingAddress) : null;

    await prisma.$executeRawUnsafe(
      `INSERT INTO tax_transactions (
        id, subscriptionId, invoiceId, studentId, packageId,
        taxAmount, baseAmount, totalAmount, taxBreakdown, stripeFee,
        billingCountry, billingState, billingCity, billingPostalCode,
        billingLine1, billingLine2, stripeTaxCalculationId, stripeCustomerId,
        taxStatus, currency, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      taxTransactionId,
      subscriptionRecord?.id || null,
      invoiceId,
      subscriptionRecord?.studentId || null,
      subscriptionRecord?.packageId || null,
      taxAmount,
      baseAmount,
      totalAmount,
      taxBreakdownJson,
      stripeFee,
      billingAddress?.country || null,
      billingAddress?.state || null,
      billingAddress?.city || null,
      billingAddress?.postal_code || null,
      billingAddress?.line1 || null,
      billingAddress?.line2 || null,
      invoice.automatic_tax?.calculation_id || null,
      customerId || null,
      'calculated',
      (invoice.currency?.toUpperCase() || 'USD')
    );

    // Update subscription total tax paid (only if subscription record exists)
    if (subscriptionRecord) {
      await prisma.$executeRawUnsafe(
        `UPDATE student_subscriptions
         SET totalTaxPaid = COALESCE(totalTaxPaid, 0) + ?,
             taxEnabled = TRUE,
             updatedAt = NOW()
         WHERE id = ?`,
        taxAmount,
        subscriptionRecord.id
      ).catch(() => {});

      // Update subscription billing address
      if (billingAddress) {
        await prisma.$executeRawUnsafe(
          `UPDATE student_subscriptions
           SET billingAddress = ?,
               taxEnabled = TRUE,
               updatedAt = NOW()
           WHERE id = ?`,
          billingAddressJson,
          subscriptionRecord.id
        ).catch(() => {});
      }
    }

    paymentLogger.info(
      WEBHOOK_CONTEXT,
      "Tax transaction recorded successfully",
      {
        invoiceId,
        taxAmount,
        subscriptionId: subscriptionRecord?.id || subscriptionId || "unknown",
        hasSubscriptionRecord: !!subscriptionRecord,
      }
    );
  } catch (err: any) {
    paymentLogger.error(
      WEBHOOK_CONTEXT,
      "Error storing tax transaction",
      err,
      { invoiceId, subscriptionId }
    );
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  paymentLogger.info(WEBHOOK_CONTEXT, "Processing invoice.payment_succeeded", {
    invoiceId: invoice.id,
    billingReason: invoice.billing_reason,
    subscription: invoice.subscription,
  });

  // Extract subscription ID - it can be a string ID or an expanded object
  let subscriptionId: string | null = null;

  if (invoice.subscription) {
    if (typeof invoice.subscription === "string") {
      subscriptionId = invoice.subscription;
    } else if (invoice.subscription.id) {
      subscriptionId = invoice.subscription.id;
    }
  }

  // If not directly on invoice, check parent.subscription_details (for subscription invoices)
  if (!subscriptionId && invoice.parent?.subscription_details?.subscription) {
    const parentSub = invoice.parent.subscription_details.subscription;
    subscriptionId = typeof parentSub === "string" ? parentSub : parentSub?.id;
  }

  if (!subscriptionId) {
    paymentLogger.debug(
      WEBHOOK_CONTEXT,
      "No subscription ID in invoice - this might be a one-time payment, skipping"
    );
    return;
  }

  paymentLogger.debug(WEBHOOK_CONTEXT, "Extracted subscription ID", {
    subscriptionId,
  });

  // IMPORTANT: Re-retrieve the invoice from Stripe with full tax details
  // The webhook payload may not include all tax information, especially for inclusive tax
  // We need to fetch it directly from Stripe to get accurate tax data
  // Also, tax calculation might take a moment, so we may need to retry
  if (stripeClient && invoice.id) {
    let retries = 3;
    let fullInvoice = invoice;
    
    while (retries > 0) {
      try {
        // CRITICAL: For inclusive tax, we MUST expand lines.data.tax_amounts to get tax
        // The tax is stored in line items, not in invoice.tax for inclusive tax
        fullInvoice = await stripeClient.invoices.retrieve(invoice.id, {
          expand: [
            'customer',
            'subscription',
            'lines.data.price.product',
            'lines.data.tax_amounts',  // CRITICAL: This is where inclusive tax is stored
            'lines.data.tax_rates',
            'payment_intent',
            'charge',
            'payment_intent.charges.data.balance_transaction',
          ],
        });
        
        // Check if we have tax data (including from line items)
        const hasTax = fullInvoice.tax > 0 || 
                      fullInvoice.total_details?.amount_tax > 0 ||
                      (fullInvoice.total_details?.breakdown?.tax_details && fullInvoice.total_details.breakdown.tax_details.length > 0) ||
                      (fullInvoice.lines?.data && fullInvoice.lines.data.some((line: any) => line.tax_amounts && line.tax_amounts.length > 0));
        
        if (hasTax || retries === 1) {
          // We have tax data, or this is our last attempt
          invoice = fullInvoice;
          break;
        } else {
          // Tax not calculated yet, wait and retry (longer wait for later attempts)
          const waitTime = retries === 3 ? 2000 : retries === 2 ? 3000 : 5000; // 2s, 3s, 5s
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          retries--;
        }
      } catch (err: any) {
        paymentLogger.warn(
          WEBHOOK_CONTEXT,
          "Could not re-retrieve invoice from Stripe, using webhook payload",
          err
        );
        // Continue with webhook payload if retrieval fails
        break;
      }
    }
  }

  // Check if this is a renewal or initial payment
  // Initial payments have billing_reason: "subscription_create"
  // Renewals have billing_reason: "subscription_cycle" or "subscription_update"
  const isRenewal =
    invoice.billing_reason === "subscription_cycle" ||
    invoice.billing_reason === "subscription_update";

  const isInitialPayment =
    invoice.billing_reason === "subscription_create" ||
    invoice.billing_reason === null ||
    invoice.billing_reason === undefined;


  // For initial payments, check if subscription already exists
  // This prevents duplicate processing when both checkout.session.completed and invoice.payment_succeeded fire
  // BUT: We still need to process tax even if subscription exists, so we'll continue to tax extraction
  let subscriptionAlreadyProcessed = false;
  if (isInitialPayment) {
    const existingSubscription = await prisma.student_subscriptions.findFirst({
      where: {
        stripeSubscriptionId: subscriptionId,
      },
    });

    if (existingSubscription) {
      paymentLogger.info(
        WEBHOOK_CONTEXT,
        "Subscription already exists, initial payment likely already processed, but will still process tax",
        {
          subscriptionId,
          invoiceId: invoice.id,
        }
      );
      subscriptionAlreadyProcessed = true;
      // Don't return - we still need to process tax
    }
  }

  // Try to get metadata from Stripe subscription if not available
  let subscriptionMetadata: any = {};
  if (stripeClient) {
    try {
      const stripeSubscription = await stripeClient.subscriptions.retrieve(
        subscriptionId
      );
      subscriptionMetadata = stripeSubscription.metadata || {};
      paymentLogger.debug(WEBHOOK_CONTEXT, "Stripe subscription metadata", {
        subscriptionMetadata,
      });
    } catch (err: any) {
      paymentLogger.warn(
        WEBHOOK_CONTEXT,
        "Could not retrieve subscription metadata",
        err
      );
    }
  }

  // For initial payments, if metadata is missing, wait a bit and retry
  // This handles race condition where invoice.payment_succeeded fires before checkout.session.completed updates metadata
  if (
    isInitialPayment &&
    !subscriptionMetadata.studentId &&
    !subscriptionMetadata.packageId
  ) {
    paymentLogger.debug(
      WEBHOOK_CONTEXT,
      "Missing metadata for initial payment, waiting for checkout.session.completed to update"
    );

    // Wait up to 3 seconds, checking every 500ms for metadata to be updated
    let retries = 6;
    while (
      retries > 0 &&
      !subscriptionMetadata.studentId &&
      !subscriptionMetadata.packageId
    ) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (stripeClient) {
        try {
          const stripeSubscription = await stripeClient.subscriptions.retrieve(
            subscriptionId
          );
          subscriptionMetadata = stripeSubscription.metadata || {};
          paymentLogger.debug(
            WEBHOOK_CONTEXT,
            `Retry ${7 - retries}: Subscription metadata`,
            { subscriptionMetadata }
          );
        } catch (err: any) {
          paymentLogger.warn(
            WEBHOOK_CONTEXT,
            "Could not retrieve subscription metadata",
            err
          );
        }
      }
      retries--;
    }

    // Check if we have packageId but not studentId (payment links scenario)
    if (subscriptionMetadata.packageId && !subscriptionMetadata.studentId) {
      paymentLogger.info(
        WEBHOOK_CONTEXT,
        "Found packageId but missing studentId, subscription will be processed by return page",
        {
          packageId: subscriptionMetadata.packageId,
        }
      );
      return; // Don't throw - let return page handle it via verify-session
    }

    // If we still don't have both, return gracefully
    if (!subscriptionMetadata.studentId || !subscriptionMetadata.packageId) {
      paymentLogger.debug(
        WEBHOOK_CONTEXT,
        "Still missing metadata after waiting, subscription will be processed by checkout.session.completed or return page"
      );
      return; // Don't throw - let checkout.session.completed or return page handle it
    }
  }

  try {
    // For prorated invoices (upgrades/downgrades), use invoice.total which includes all line items
    // For regular invoices, use amount_paid if available, otherwise total
    // invoice.total is the final amount after all credits and charges (proration)
    const invoiceAmount =
      invoice.amount_paid > 0 ? invoice.amount_paid / 100 : invoice.total / 100; // total includes proration credits

    // Extract tax information from invoice (Stripe Tax API)
    // CRITICAL: For inclusive tax, tax is often stored in line items, not in invoice.tax
    // Check line items FIRST, then fall back to other methods
    let taxAmount = 0;
    
    const subtotalAmount = invoice.subtotal ? invoice.subtotal / 100 : 0;
    const totalAmount = invoice.total ? invoice.total / 100 : 0;
    
    
    // Method 1: Line items tax_amounts (CHECK FIRST for inclusive tax)
    // For inclusive tax, Stripe stores tax in line items, not in invoice.tax
    if (invoice.lines?.data) {
      for (const line of invoice.lines.data) {
        if (line.tax_amounts && line.tax_amounts.length > 0) {
          const lineTax = line.tax_amounts.reduce((sum: number, taxAmountItem: any) => {
            const amount = taxAmountItem.amount ? taxAmountItem.amount / 100 : 0;
            return sum + amount;
          }, 0);
          taxAmount += lineTax;
        }
      }
    }
    
    // Method 2: Direct tax field (fallback)
    if (taxAmount === 0 && invoice.tax) {
      taxAmount = invoice.tax / 100; // Convert from cents
    } 
    // Method 3: Total details amount_tax
    else if (taxAmount === 0 && invoice.total_details?.amount_tax) {
      taxAmount = invoice.total_details.amount_tax / 100;
    } 
    // Method 4: Total details breakdown tax_details
    else if (taxAmount === 0 && invoice.total_details?.breakdown?.tax_details && invoice.total_details.breakdown.tax_details.length > 0) {
      // Sum up all tax details
      taxAmount = invoice.total_details.breakdown.tax_details.reduce((sum: number, taxDetail: any) => {
        return sum + (taxDetail.amount ? taxDetail.amount / 100 : 0);
      }, 0);
    }
    
    // Method 5: For inclusive tax, if tax is 0 but automatic tax is enabled,
    // calculate tax from state rate immediately
    // This is critical because for inclusive tax, Stripe may not return tax in API
    // even though it's calculated and shown in Dashboard
    // CRITICAL: This MUST run if tax is 0 and automatic tax is enabled
    if (taxAmount === 0 && invoice.automatic_tax?.enabled && totalAmount > 0) {
      // Try to get state from invoice customer_address first, then from customer object
      let customerState: string | null = null;
      
      if (invoice.customer_address?.state) {
        customerState = invoice.customer_address.state;
      } else if (invoice.customer && stripeClient) {
        // Fallback: Get state from customer object
        try {
          const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;
          const customer = await stripeClient.customers.retrieve(customerId);
          if (customer && !customer.deleted && "address" in customer && customer.address?.state) {
            customerState = customer.address.state;
          }
        } catch (err: any) {
          // Continue without state
        }
      }
      
      if (customerState) {
        const stateTaxRates: Record<string, number> = {
          'ID': 0.06, // Idaho: 6% state tax
          'CA': 0.0725, // California: 7.25% (varies by county)
          'NY': 0.08, // New York: 8% (varies by location)
          'TX': 0.0625, // Texas: 6.25% state tax
          'FL': 0.06, // Florida: 6% state tax
          'WA': 0.065, // Washington: 6.5% state tax
          'NJ': 0.06625, // New Jersey: 6.625% state tax
          'IL': 0.0625, // Illinois: 6.25% state tax
          'PA': 0.06, // Pennsylvania: 6% state tax
          'OH': 0.0575, // Ohio: 5.75% state tax
        };
        
        const taxRate = stateTaxRates[customerState];
        
        if (taxRate) {
          // For inclusive tax: base = total / (1 + taxRate), tax = total - base
          const estimatedBase = totalAmount / (1 + taxRate);
          const estimatedTax = totalAmount - estimatedBase;
          
          // Only use if it's reasonable (tax should be 0-15% of total)
          if (estimatedTax > 0 && estimatedTax < totalAmount * 0.15) {
            taxAmount = estimatedTax;
          } else {
            paymentLogger.warn(
              WEBHOOK_CONTEXT,
              `Calculated tax seems unreasonable, not using it`,
              {
      invoiceId: invoice.id,
                state: customerState,
                estimatedTax,
                totalAmount,
                reason: estimatedTax >= totalAmount * 0.15 ? "Tax too high" : "Tax is 0 or negative",
              }
            );
          }
        } else {
          paymentLogger.warn(
            WEBHOOK_CONTEXT,
            `No tax rate found for state ${customerState}`,
            {
              invoiceId: invoice.id,
              state: customerState,
              availableStates: Object.keys(stateTaxRates),
            }
          );
        }
        
        // Also check if total > subtotal (for non-inclusive tax that might be showing)
        if (taxAmount === 0 && totalAmount > subtotalAmount && Math.abs(totalAmount - subtotalAmount) < totalAmount * 0.2) {
          const possibleTax = totalAmount - subtotalAmount;
          if (possibleTax > 0 && possibleTax < totalAmount * 0.15) {
            taxAmount = possibleTax;
          }
        }
      } else {
        paymentLogger.warn(
          WEBHOOK_CONTEXT,
          "Tax is 0 and automatic tax enabled, but no customer state found",
          {
            invoiceId: invoice.id,
            hasCustomerAddress: !!invoice.customer_address,
            hasCustomerAddressState: !!invoice.customer_address?.state,
            hasCustomer: !!invoice.customer,
            hasStripeClient: !!stripeClient,
            note: "Cannot calculate tax without customer state",
          }
        );
      }
    }
    
    // CRITICAL: If tax is 0 but automatic tax is enabled, the tax calculation might be delayed.
    // Try multiple approaches to get tax information:
    // 1. Check checkout session (if we can find it)
    // 2. Check payment intent
    // 3. Schedule background re-check
    const hasAutomaticTax = invoice.automatic_tax?.enabled || false;
    
    if (taxAmount === 0 && hasAutomaticTax && stripeClient) {
      
      // Method 1: Try to find checkout session from subscription metadata or payment intent
      try {
        let sessionId: string | null = null;
        let checkoutSession: any = null;
        
        // First, try to get checkout session from subscription metadata
        if (subscriptionMetadata?.checkoutSessionId) {
          sessionId = subscriptionMetadata.checkoutSessionId;
        }
        
        // If not found, try to get checkout session from payment intent
        if (!sessionId && invoice.payment_intent) {
          const paymentIntentId = typeof invoice.payment_intent === "string" 
            ? invoice.payment_intent 
            : invoice.payment_intent.id;
          
          try {
            const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.metadata?.checkout_session_id) {
              sessionId = paymentIntent.metadata.checkout_session_id;
            }
          } catch (err: any) {
            // Continue without payment intent
          }
        }
        
        // If still not found, try to list recent checkout sessions for this customer
        if (!sessionId && invoice.customer) {
          try {
            const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;
            const sessions = await stripeClient.checkout.sessions.list({
              customer: customerId,
              limit: 5,
            });
            
            // Find the most recent session that matches this subscription
            const matchingSession = sessions.data.find((s: any) => 
              s.subscription === subscriptionId || 
              s.metadata?.packageId === subscriptionMetadata?.packageId
            );
            
            if (matchingSession) {
              sessionId = matchingSession.id;
            }
          } catch (err: any) {
            paymentLogger.debug(WEBHOOK_CONTEXT, "Could not list checkout sessions", err);
          }
        }
        
        // If we found a checkout session, check it for tax and billing address
        if (sessionId) {
          checkoutSession = await stripeClient.checkout.sessions.retrieve(sessionId, {
            expand: ['total_details.breakdown'],
          });
          
          // Check for tax in checkout session
          if (checkoutSession.total_details?.amount_tax) {
            taxAmount = checkoutSession.total_details.amount_tax / 100;
          }
          
          // If tax is still 0, try to get billing address from checkout session
          // and calculate tax from state rate
          if (taxAmount === 0 && checkoutSession.customer_details?.address?.state) {
            const sessionState = checkoutSession.customer_details.address.state;
            
            // Calculate tax from state rate (same logic as above)
            const stateTaxRates: Record<string, number> = {
              'ID': 0.06, 'CA': 0.0725, 'NY': 0.08, 'TX': 0.0625,
              'FL': 0.06, 'WA': 0.065, 'NJ': 0.06625, 'IL': 0.0625,
              'PA': 0.06, 'OH': 0.0575,
            };
            
            const taxRate = stateTaxRates[sessionState];
            if (taxRate && totalAmount > 0) {
              const estimatedBase = totalAmount / (1 + taxRate);
              const estimatedTax = totalAmount - estimatedBase;
              
              if (estimatedTax > 0 && estimatedTax < totalAmount * 0.15) {
                taxAmount = estimatedTax;
              }
            }
          }
        }
      } catch (err: any) {
        paymentLogger.warn(
          WEBHOOK_CONTEXT,
          "Error trying to get tax from checkout session",
          err
        );
      }
      
      // Method 2: If still 0, schedule multiple background re-checks
      // Tax calculation in Stripe can sometimes take 10-60 seconds
      if (taxAmount === 0) {
        // Store invoice ID and subscription ID for background checks
        const backgroundCheckInvoiceId = invoice.id;
        const backgroundCheckSubscriptionId = subscriptionId;
        
        // Re-check at 15 seconds
        setTimeout(async () => {
          await recheckInvoiceTax(backgroundCheckInvoiceId, backgroundCheckSubscriptionId, stripeClient, "15s");
        }, 15000);
        
        // Re-check at 30 seconds
        setTimeout(async () => {
          await recheckInvoiceTax(backgroundCheckInvoiceId, backgroundCheckSubscriptionId, stripeClient, "30s");
        }, 30000);
        
        // Re-check at 60 seconds (final attempt)
        setTimeout(async () => {
          await recheckInvoiceTax(backgroundCheckInvoiceId, backgroundCheckSubscriptionId, stripeClient, "60s");
        }, 60000);
      }
    }
    
    // For INCLUSIVE tax: subtotal is the amount before tax, total includes tax
    // invoice.subtotal = amount before tax (gross)
    // invoice.total = total amount including tax
    // For inclusive: baseAmount = subtotal (price before tax), taxAmount is deducted from total
    // Note: subtotalAmount and totalAmount are already defined above (line 1496-1497)
    
    // For inclusive tax, the base amount is the subtotal (gross before tax)
    // The total includes tax, so: total = subtotal + tax
    // But since tax is inclusive, we show: baseAmount = subtotal, taxAmount = tax, totalAmount = total
    const baseAmount = subtotalAmount; // For inclusive tax, base is the subtotal
    
    // Extract Stripe fee from charge (if available)
    let stripeFee = 0;
    if (invoice.charge && stripeClient) {
      try {
        const chargeId = typeof invoice.charge === "string" ? invoice.charge : invoice.charge.id;
        const charge = await stripeClient.charges.retrieve(chargeId);
        // Stripe fee = amount - amount received (what business actually gets)
        // For subscriptions: fee is typically 2.9% + $0.30 for USD
        if (charge.balance_transaction) {
          const balanceTransaction = await stripeClient.balanceTransactions.retrieve(
            charge.balance_transaction as string
          );
          stripeFee = balanceTransaction.fee ? balanceTransaction.fee / 100 : 0;
        }
      } catch (err: any) {
        paymentLogger.warn(
          WEBHOOK_CONTEXT,
          "Could not retrieve Stripe fee (non-fatal)",
          err
        );
        // Calculate approximate fee if we can't get it: 2.9% + $0.30 for USD, 2.9% + €0.25 for EUR
        const currency = invoice.currency?.toUpperCase() || "USD";
        const feePercentage = 0.029; // 2.9%
        const fixedFee = currency === "USD" ? 0.30 : currency === "EUR" ? 0.25 : 0.30;
        stripeFee = (totalAmount * feePercentage) + fixedFee;
      }
    }
    
    // Extract tax breakdown from invoice (if automatic tax is enabled)
    // This will be null if tax is not calculated (Stripe Tax not configured - this is OK)
    let taxBreakdown: any = null;
    if (invoice.automatic_tax?.enabled && invoice.total_details?.breakdown?.tax_details) {
      taxBreakdown = {
        total_tax: taxAmount,
        breakdown: invoice.total_details.breakdown.tax_details.map((taxDetail: any) => ({
          jurisdiction: taxDetail.jurisdiction || null,
          tax_type: taxDetail.type || null,
          rate: taxDetail.rate ? taxDetail.rate / 100 : null, // Convert from percentage
          amount: taxDetail.amount ? taxDetail.amount / 100 : 0,
          taxable_amount: taxDetail.taxable_amount ? taxDetail.taxable_amount / 100 : 0,
        })),
      };
    } else if (taxAmount > 0) {
      // Tax exists but no breakdown - create basic breakdown
      taxBreakdown = {
        total_tax: taxAmount,
        breakdown: [{
          jurisdiction: null,
          tax_type: "sales_tax",
          rate: subtotalAmount > 0 ? (taxAmount / subtotalAmount) : null,
          amount: taxAmount,
          taxable_amount: subtotalAmount,
        }],
      };
    }

    // Get billing address from customer (for tax calculation tracking)
    let billingAddress: any = null;
    let customerId: string | null = null;
    if (invoice.customer) {
      customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;
      
      if (stripeClient && customerId) {
        try {
          const customer = await stripeClient.customers.retrieve(customerId);
          if (customer && !customer.deleted && "address" in customer) {
            billingAddress = customer.address;
          }
        } catch (err: any) {
          paymentLogger.warn(
            WEBHOOK_CONTEXT,
            "Could not retrieve customer address for tax tracking",
            err
          );
        }
      }
    }

    // Get subscription details for tax transaction record
    const subscriptionRecord = await prisma.student_subscriptions.findFirst({
      where: {
        stripeSubscriptionId: subscriptionId,
      },
      select: {
        id: true,
        studentId: true,
        packageId: true,
      },
    });

    // Store tax transaction if tax was calculated (business absorbs tax, not charged to student)
    // Note: If taxAmount is 0, we skip storing (tax not configured or not applicable)
    // This is normal and expected if Stripe Tax is not yet configured - no error
    
    // Store tax transaction if tax was calculated, even if subscriptionRecord doesn't exist yet
    // This ensures tax data is captured even if webhook fires before subscription is created
    if (taxAmount > 0) {
      await storeTaxTransaction(
        invoice.id,
        subscriptionId,
        taxAmount,
        invoice,
        subscriptionRecord,
        stripeClient
      );
    }

    // Finalize the subscription payment with idempotency key
    // Use invoice ID as idempotency key to prevent duplicate processing
    // Note: Student only pays the base amount (subtotal), tax is absorbed by business
    // Skip finalization if subscription was already processed (to avoid duplicate payments)
    if (!subscriptionAlreadyProcessed) {
    await finalizeSubscriptionPayment(subscriptionId, {
      isInitialPayment: !isRenewal,
      invoiceId: invoice.id,
      invoiceAmount: invoiceAmount, // Use total for prorated invoices
      idempotencyKey: `webhook_invoice_${invoice.id}`,
    });
    }
  } catch (error: any) {
    paymentLogger.error(
      WEBHOOK_CONTEXT,
      "Error finalizing subscription payment",
      error,
      {
        subscriptionId,
        invoiceId: invoice.id,
        subscriptionMetadata,
      }
    );

    // If it's a missing metadata error and this is an initial payment,
    // it might be processed by checkout.session.completed instead
    if (
      isInitialPayment &&
      (error.message?.includes("studentId") ||
        error.message?.includes("packageId"))
    ) {
      paymentLogger.debug(
        WEBHOOK_CONTEXT,
        "Missing metadata - subscription may be processed by checkout.session.completed or return page instead"
      );
      return; // Don't throw - let checkout.session.completed or return page handle it
    }

    // Re-throw for other errors so webhook returns 500 and Stripe retries
    throw error;
  }
}

/**
 * Handle invoice.payment_failed event
 * This is triggered when a subscription payment fails
 */
async function handleInvoicePaymentFailed(invoice: any) {
  paymentLogger.info(WEBHOOK_CONTEXT, "Processing invoice.payment_failed", {
    invoiceId: invoice.id,
  });

  // Extract subscription ID
  let subscriptionId = invoice.subscription as string;

  if (!subscriptionId && invoice.parent?.subscription_details?.subscription) {
    subscriptionId = invoice.parent.subscription_details.subscription as string;
  }

  if (!subscriptionId) {
    paymentLogger.debug(
      WEBHOOK_CONTEXT,
      "No subscription ID in invoice - skipping"
    );
    return;
  }

  // Update subscription status to "past_due"
  await prisma.student_subscriptions.updateMany({
    where: {
      stripeSubscriptionId: subscriptionId,
    },
    data: {
      status: "past_due",
    },
  });

  // TODO: Send notification to student
  paymentLogger.info(WEBHOOK_CONTEXT, "Subscription marked as past_due", {
    subscriptionId,
  });
}

/**
 * Handle customer.subscription.deleted event
 * This is triggered when a subscription is cancelled
 */
async function handleSubscriptionDeleted(subscription: any) {
  paymentLogger.info(
    WEBHOOK_CONTEXT,
    "Processing customer.subscription.deleted",
    {
      subscriptionId: subscription.id,
    }
  );

  await prisma.student_subscriptions.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: "cancelled",
      endDate: new Date(subscription.canceled_at * 1000), // Convert Unix timestamp to Date
    },
  });

  paymentLogger.info(WEBHOOK_CONTEXT, "Subscription cancelled", {
    subscriptionId: subscription.id,
  });
}

/**
 * Handle customer.subscription.updated event
 * This is triggered when a subscription is modified
 */
async function handleSubscriptionUpdated(subscription: any) {
  paymentLogger.debug(
    WEBHOOK_CONTEXT,
    "Processing customer.subscription.updated",
    {
      subscriptionId: subscription.id,
    }
  );

  const nextBillingDate = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;

  // IMPORTANT: Check if subscription is scheduled for cancellation
  // If cancel_at_period_end is true, the status should be "cancelled" even though
  // Stripe's status is still "active" until the period ends
  let finalStatus = subscription.status;
  if (subscription.cancel_at_period_end === true) {
    finalStatus = "cancelled";
    paymentLogger.info(
      WEBHOOK_CONTEXT,
      "Subscription is scheduled for cancellation",
      {
        subscriptionId: subscription.id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      }
    );
  }

  // Also check current database status - preserve "cancelled" if it exists
  const existingSubscription = await prisma.student_subscriptions.findFirst({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    select: {
      status: true,
    },
  });

  // If database has "cancelled" status and Stripe has cancel_at_period_end, keep it cancelled
  if (
    existingSubscription?.status === "cancelled" &&
    subscription.cancel_at_period_end === true
  ) {
    finalStatus = "cancelled";
    paymentLogger.info(
      WEBHOOK_CONTEXT,
      "Preserving cancelled status from database",
      {
        subscriptionId: subscription.id,
      }
    );
  }

  await prisma.student_subscriptions.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: finalStatus,
      nextBillingDate: nextBillingDate,
      endDate: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : undefined,
    },
  });

  paymentLogger.info(WEBHOOK_CONTEXT, "Subscription updated", {
    subscriptionId: subscription.id,
    status: finalStatus,
  });

  paymentLogger.info(WEBHOOK_CONTEXT, "Subscription updated", {
    subscriptionId: subscription.id,
    status: subscription.status,
  });
}

/**
 * Handle invoice.upcoming event
 * This is triggered 7 days before a subscription renewal
 * Sends a warning notification to the student
 */
async function handleInvoiceUpcoming(invoice: any) {
  paymentLogger.info(WEBHOOK_CONTEXT, "Processing invoice.upcoming", {
    invoiceId: invoice.id,
  });

  // Extract subscription ID
  let subscriptionId = invoice.subscription as string;

  if (!subscriptionId && invoice.parent?.subscription_details?.subscription) {
    subscriptionId = invoice.parent.subscription_details.subscription as string;
  }

  if (!subscriptionId) {
    paymentLogger.debug(
      WEBHOOK_CONTEXT,
      "No subscription ID in invoice - skipping"
    );
    return;
  }

  // Get subscription from database
  const subscription = await prisma.student_subscriptions.findFirst({
    where: {
      stripeSubscriptionId: subscriptionId,
    },
    include: {
      student: {
        select: {
          wdt_ID: true,
          name: true,
          chatId: true,
          country: true,
          phoneno: true,
        },
      },
      package: {
        select: {
          name: true,
          price: true,
          currency: true,
          duration: true,
        },
      },
    },
  });

  if (!subscription) {
    paymentLogger.warn(WEBHOOK_CONTEXT, "Subscription not found in database", {
      subscriptionId,
    });
    return;
  }

  // Calculate days until renewal
  const nextBillingDate = subscription.nextBillingDate || subscription.endDate;
  const daysUntilRenewal = nextBillingDate
    ? Math.ceil(
        (nextBillingDate.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 7; // Default to 7 days if date not available

  // Format amount
  const amount = invoice.amount_due / 100; // Convert from cents
  const currency = (
    invoice.currency ||
    subscription.package.currency ||
    "USD"
  ).toUpperCase();
  const currencySymbol =
    currency === "USD" ? "$" : currency === "ETB" ? "ETB " : "";

  // Prepare notification message
  const renewalDate = nextBillingDate
    ? nextBillingDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "soon";

  const message = `ًں“… **Subscription Renewal Reminder**

Assalamu Alaikum ${subscription.student.name || "dear student"},

Your subscription "${
    subscription.package.name
  }" will renew automatically in ${daysUntilRenewal} day${
    daysUntilRenewal !== 1 ? "s" : ""
  }.

ًں’° **Renewal Details:**
â€¢ **Amount:** ${currencySymbol}${amount.toFixed(2)} ${currency}
â€¢ **Renewal Date:** ${renewalDate}
â€¢ **Package:** ${subscription.package.name} (${
    subscription.package.duration
  } month${subscription.package.duration !== 1 ? "s" : ""})

ًں’³ **Payment Method:**
Your saved payment method will be charged automatically. No action needed from you.

If you need to update your payment method or cancel your subscription, please contact support.

*May Allah bless your learning journey*`;

  // Send notification based on student country
  let notificationSent = false;

  try {
    if (subscription.student.country === "USA") {
      // Send email for USA students
      try {
        await fetch(`https://darulkubra.com/api/email`, {
          method: "POST",
          body: JSON.stringify({
            id: subscription.student.wdt_ID,
            subject: "Subscription Renewal Reminder",
            message: message.replace(/\*\*/g, ""), // Remove markdown for email
          }),
        });
        notificationSent = true;
        paymentLogger.info(WEBHOOK_CONTEXT, "Sent email renewal reminder", {
          studentId: subscription.student.wdt_ID,
        });
      } catch (error) {
        paymentLogger.error(WEBHOOK_CONTEXT, "Failed to send email", error);
      }
    } else if (subscription.student.chatId) {
      // Send Telegram notification for other students
      const botToken = process.env.TELEGRAM_BOT_TOKEN;

      if (!botToken) {
        paymentLogger.warn(
          WEBHOOK_CONTEXT,
          "Telegram bot token not configured"
        );
      } else {
        try {
          const telegramResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: subscription.student.chatId,
                text: message,
                parse_mode: "Markdown",
              }),
            }
          );

          if (telegramResponse.ok) {
            notificationSent = true;
            paymentLogger.info(
              WEBHOOK_CONTEXT,
              "Sent Telegram renewal reminder",
              {
                studentId: subscription.student.wdt_ID,
              }
            );
          } else {
            const errorData = await telegramResponse.json();
            paymentLogger.error(
              WEBHOOK_CONTEXT,
              "Telegram API error",
              undefined,
              {
                errorData,
              }
            );
          }
        } catch (error) {
          paymentLogger.error(
            WEBHOOK_CONTEXT,
            "Failed to send Telegram",
            error
          );
        }
      }
    } else {
      paymentLogger.warn(
        WEBHOOK_CONTEXT,
        "Student has no chatId or email configured",
        {
          studentId: subscription.student.wdt_ID,
        }
      );
    }

    if (notificationSent) {
      paymentLogger.info(
        WEBHOOK_CONTEXT,
        "Successfully sent renewal reminder",
        {
          subscriptionId,
        }
      );
    }
  } catch (error) {
    paymentLogger.error(
      WEBHOOK_CONTEXT,
      "Error sending renewal reminder",
      error
    );
  }
}
