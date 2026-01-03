import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { PaymentIntent, PaymentSource } from "@prisma/client";
import { stripeClient } from "@/lib/payments/stripe";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/payments/stripe/subscription
 * Create a Stripe subscription checkout for a student
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[Stripe Subscription] Received subscription request");
    const body = await request.json();
    const { studentId, packageId, returnUrl } = body;

    console.log("[Stripe Subscription] Request data:", {
      studentId,
      packageId,
      hasReturnUrl: !!returnUrl,
    });

    if (!studentId || !packageId) {
      console.error("[Stripe Subscription] Missing required fields:", {
        hasStudentId: !!studentId,
        hasPackageId: !!packageId,
      });
      return NextResponse.json(
        { error: "studentId and packageId are required" },
        { status: 400 }
      );
    }

    // Get student
    const student = await prisma.wpos_wpdatatable_23.findUnique({
      where: { wdt_ID: studentId },
      select: {
        wdt_ID: true,
        name: true,
        phoneno: true,
        classfee: true,
        classfeeCurrency: true,
        country: true,
        stripeCustomerId: true,
        chatId: true,
      },
    });

    if (!student) {
      console.error("[Stripe Subscription] Student not found:", studentId);
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    console.log("[Stripe Subscription] Student found:", {
      studentId: student.wdt_ID,
      name: student.name,
      currency: student.classfeeCurrency,
    });

    // Check if student has non-ETB currency (for subscription eligibility)
    const isNonETB = student.classfeeCurrency !== "ETB";

    if (!isNonETB) {
      console.warn(
        "[Stripe Subscription] Student has ETB currency, not eligible:",
        {
          studentId: student.wdt_ID,
          currency: student.classfeeCurrency,
        }
      );
      return NextResponse.json(
        {
          error:
            "Subscription packages are only available for students with non-ETB currency",
        },
        { status: 400 }
      );
    }

    // Get package
    const packageData = await prisma.subscription_packages.findUnique({
      where: { id: packageId },
    });

    if (!packageData) {
      console.error("[Stripe Subscription] Package not found:", packageId);
      return NextResponse.json(
        { error: "Subscription package not found" },
        { status: 404 }
      );
    }

    console.log("[Stripe Subscription] Package found:", {
      packageId: packageData.id,
      name: packageData.name,
      price: packageData.price,
      isActive: packageData.isActive,
    });

    if (!packageData.isActive) {
      console.warn("[Stripe Subscription] Package is not active:", packageId);
      return NextResponse.json(
        { error: "This subscription package is no longer available" },
        { status: 400 }
      );
    }

    // Check if student already has an active subscription
    const existingSubscription = await prisma.student_subscriptions.findFirst({
      where: {
        studentId: student.wdt_ID,
        status: { in: ["active", "trialing"] },
      },
    });

    if (existingSubscription) {
      console.warn(
        "[Stripe Subscription] Student already has active subscription:",
        {
          studentId: student.wdt_ID,
          subscriptionId: existingSubscription.id,
          status: existingSubscription.status,
        }
      );
      return NextResponse.json(
        {
          error:
            "You already have an active subscription. Please cancel it first or wait for it to expire.",
        },
        { status: 400 }
      );
    }

    console.log(
      "[Stripe Subscription] No existing subscription, proceeding..."
    );

    if (!stripeClient) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    // Create payment_checkout record for tracking
    const txRef = `sub_${randomUUID()}`;
    
    // Get the correct base URL for return redirects
    // Priority: Environment variables > Production domain detection > Request headers > request.nextUrl.origin
    const getBaseUrl = () => {
      // Helper function to check if URL is absolute
      const isAbsoluteUrl = (url: string) => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      };

      // 1. Check environment variables first (highest priority for production)
      const ngrokUrl = process.env.NGROK_URL || process.env.NEXT_PUBLIC_NGROK_URL;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
      const configuredBaseRaw = ngrokUrl || appUrl;
      
      if (configuredBaseRaw && isAbsoluteUrl(configuredBaseRaw)) {
        console.log(`[Stripe Subscription] Using configured base URL: ${configuredBaseRaw}`);
        return configuredBaseRaw.replace(/\/$/, "");
      }
      
      // 2. Check request headers (for production behind reverse proxy)
      const forwardedHost = request.headers.get("x-forwarded-host");
      const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
      const host = request.headers.get("host");
      const referer = request.headers.get("referer");
      
      // Try to extract production URL from referer if available
      let refererUrl: string | null = null;
      if (referer) {
        try {
          const refererParsed = new URL(referer);
          if (!refererParsed.hostname.includes("localhost") && 
              !refererParsed.hostname.includes("127.0.0.1") &&
              !refererParsed.hostname.includes("ngrok")) {
            refererUrl = `${refererParsed.protocol}//${refererParsed.host}`;
          }
        } catch {}
      }
      
      // Check if host is the production domain
      const productionDomain = "exam.darelkubra.com";
      if (forwardedHost && forwardedHost.includes(productionDomain)) {
        const baseUrl = `${forwardedProto}://${forwardedHost}`;
        console.log(`[Stripe Subscription] Using forwarded host (production): ${baseUrl}`);
        return baseUrl;
      }
      
      if (host && host.includes(productionDomain)) {
        const protocol = forwardedProto || (request.nextUrl.protocol === "https:" ? "https" : "http");
        const baseUrl = `${protocol}://${host}`;
        console.log(`[Stripe Subscription] Using host header (production): ${baseUrl}`);
        return baseUrl;
      }
      
      if (refererUrl && refererUrl.includes(productionDomain)) {
        console.log(`[Stripe Subscription] Using referer URL (production): ${refererUrl}`);
        return refererUrl;
      }
      
      // Use forwarded host if available (even if not production domain)
      if (forwardedHost && !forwardedHost.includes("localhost") && !forwardedHost.includes("127.0.0.1")) {
        const baseUrl = `${forwardedProto}://${forwardedHost}`;
        console.log(`[Stripe Subscription] Using forwarded host: ${baseUrl}`);
        return baseUrl;
      }
      
      if (refererUrl) {
        console.log(`[Stripe Subscription] Using referer URL: ${refererUrl}`);
        return refererUrl;
      }
      
      if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
        const protocol = request.headers.get("x-forwarded-proto") || 
                        (request.nextUrl.protocol === "https:" ? "https" : "http");
        const baseUrl = `${protocol}://${host}`;
        console.log(`[Stripe Subscription] Using host header: ${baseUrl}`);
        return baseUrl;
      }
      
      // 3. Fallback: Use production URL if we're in production environment
      // Check if we're not in development (no localhost in any header)
      const isProduction = process.env.NODE_ENV === "production" || 
                          (!host?.includes("localhost") && 
                           !host?.includes("127.0.0.1") &&
                           !forwardedHost?.includes("localhost") &&
                           !forwardedHost?.includes("127.0.0.1"));
      
      if (isProduction) {
        const productionUrl = `https://${productionDomain}`;
        console.log(`[Stripe Subscription] Using production URL (fallback): ${productionUrl}`);
        return productionUrl;
      }
      
      // 4. Last resort: request origin (may be localhost in dev)
      const requestOrigin = request.nextUrl.origin;
      
      // Warn if using localhost in what might be production
      if (requestOrigin.includes("localhost") || requestOrigin.includes("127.0.0.1")) {
        console.warn(
          `[Stripe Subscription] ⚠️ WARNING: Using localhost URL (${requestOrigin}) for return URL. ` +
          `This will cause redirect issues in production. ` +
          `Please set NEXT_PUBLIC_APP_URL=https://${productionDomain} environment variable.`
        );
      }
      
      console.log(`[Stripe Subscription] Using request origin (fallback): ${requestOrigin}`);
      return requestOrigin;
    };
    
    const baseUrl = getBaseUrl();

    // Use return page to show success message before redirecting
    // Include session_id placeholder for Stripe to replace with actual session ID
    const successUrl =
      returnUrl ||
      `${baseUrl}/student/payments/return?status=success&tx_ref=${txRef}&session_id={CHECKOUT_SESSION_ID}&studentId=${student.wdt_ID}&packageId=${packageData.id}`;

    const cancelUrl =
      returnUrl ||
      `${baseUrl}/student/payments/return?status=cancelled&tx_ref=${txRef}&studentId=${student.wdt_ID}&packageId=${packageData.id}`;

    // Create or retrieve Stripe customer
    let customerId = student.stripeCustomerId;
    let needsCustomerCreation = !customerId;

    // If customer ID exists, verify it still exists in Stripe
    if (customerId) {
      try {
        const existingCustomer = await stripeClient.customers.retrieve(
          customerId
        );
        // Customer exists, we can use it
        console.log(
          `[Stripe Subscription] Using existing customer: ${customerId}`
        );
      } catch (error: any) {
        // Customer doesn't exist in Stripe (deleted, wrong account, or test/live mismatch)
        console.error(
          `[Stripe Subscription] Customer ${customerId} not found in Stripe:`,
          error.message
        );
        console.log(
          `[Stripe Subscription] Creating new customer to replace invalid ID`
        );
        customerId = null;
        needsCustomerCreation = true;

        // Clear the invalid customer ID from database
        await prisma.wpos_wpdatatable_23.update({
          where: { wdt_ID: student.wdt_ID },
          data: { stripeCustomerId: null },
        });
      }
    }

    if (needsCustomerCreation) {
      // Validate email format - only use if it's a valid email, not a phone number
      const isValidEmail = (str: string | null | undefined): boolean => {
        if (!str) return false;
        // Simple email validation - check for @ symbol
        return str.includes("@") && str.includes(".") && str.length > 5;
      };

      const customerData: {
        name?: string;
        email?: string;
        metadata: {
          studentId: string;
        };
      } = {
        metadata: {
          studentId: String(student.wdt_ID),
        },
      };

      // Only add email if it's a valid email format
      if (student.phoneno && isValidEmail(student.phoneno)) {
        customerData.email = student.phoneno;
      }

      // Add name if available
      if (student.name) {
        customerData.name = student.name;
      }

      const customer = await stripeClient.customers.create(customerData);
      customerId = customer.id;
      console.log(`[Stripe Subscription] Created new customer: ${customerId}`);

      // Save customer ID to student record
      await prisma.wpos_wpdatatable_23.update({
        where: { wdt_ID: student.wdt_ID },
        data: { stripeCustomerId: customerId },
      });
    }

    // Final safety check: ensure customerId is valid before creating checkout session
    if (!customerId) {
      throw new Error("Failed to create or retrieve Stripe customer");
    }

    // If package has a payment link, use it directly (it already has trial period configured in Stripe)
    if (packageData.paymentLink && packageData.paymentLink.trim()) {
      console.log("[Stripe Subscription] Using payment link from package:", {
        paymentLink: packageData.paymentLink,
        packageId: packageData.id,
      });

      // CRITICAL: Update customer metadata with studentId and packageId
      // This ensures the webhook can identify the student when payment link is used
      // (Payment links don't have checkout session metadata, so we rely on customer metadata)
      try {
        await stripeClient.customers.update(customerId, {
          metadata: {
            studentId: String(student.wdt_ID),
            packageId: String(packageData.id),
            packageName: packageData.name,
            packageDuration: String(packageData.duration),
            txRef: txRef,
          },
        });
        console.log(
          "[Stripe Subscription] Updated customer metadata for payment link",
          {
            customerId,
            studentId: student.wdt_ID,
            packageId: packageData.id,
          }
        );
      } catch (metadataError: any) {
        console.error(
          "[Stripe Subscription] Failed to update customer metadata:",
          metadataError.message
        );
        // Continue anyway - webhook will try to match by payment link
      }

      // Create payment_checkout record for tracking
      await prisma.payment_checkout.create({
        data: {
          txRef: txRef,
          studentId: student.wdt_ID,
          provider: PaymentSource.stripe,
          intent: PaymentIntent.subscription,
          amount: packageData.price,
          currency: packageData.currency,
          status: "initialized",
          checkoutUrl: packageData.paymentLink,
          returnUrl: successUrl,
          metadata: {
            packageId: packageData.id,
            packageName: packageData.name,
            paymentLink: packageData.paymentLink,
            usingPaymentLink: true,
          },
        },
      });

      console.log(
        "[Stripe Subscription] Payment link ready, redirecting student:",
        {
          paymentLink: packageData.paymentLink,
          txRef,
        }
      );

      return NextResponse.json({
        success: true,
        checkoutUrl: packageData.paymentLink, // Use the payment link directly
        sessionId: null, // Payment links don't have session IDs
        txRef: txRef,
        usingPaymentLink: true,
      });
    }

    // Create Stripe Checkout Session with subscription (only if no payment link)
    // The subscription will automatically renew every {packageDuration} months
    const checkoutSession = await stripeClient.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",

      // REQUIRED: Collect billing address for tax calculation and records
      billing_address_collection: "required", // Force address collection

      // Automatically update customer address when provided
      customer_update: {
        address: "auto", // Update customer's billing address in Stripe
        name: "auto", // Update customer name if needed
      },

      // ENABLE AUTOMATIC TAX: Stripe will calculate and deduct tax from payment amount
      // Tax is INCLUSIVE: deducted from the $150, student pays $150 total, business gets $150 - tax - stripe fee
      automatic_tax: {
        enabled: true, // Enable Stripe Tax API automatic calculation
      },

      // Set tax behavior to INCLUSIVE (tax deducted from price, not added on top)
      // Student pays $150 total, tax is deducted from that $150
      tax_id_collection: {
        enabled: false, // Don't require tax IDs for B2C transactions
      },

      line_items: [
        {
          price_data: {
            currency: packageData.currency.toLowerCase(),
            product_data: {
              name: packageData.name,
              description:
                packageData.description ||
                `Subscription for ${packageData.duration} months`,
              // Only set tax_code if explicitly provided in database
              // Otherwise, let Stripe automatically determine taxability based on product type
              ...(packageData.taxCode ? { tax_code: packageData.taxCode } : {}),
            },
            unit_amount: Math.round(Number(packageData.price) * 100), // Convert to cents
            recurring: {
              interval: "month",
              interval_count: packageData.duration, // Recur every X months (e.g., every 3 months for 3-month package)
            },
            // Set tax behavior to INCLUSIVE: tax is deducted from the price, not added on top
            // Student pays $150 total, tax comes out of that $150
            tax_behavior: "inclusive",
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: txRef,
      metadata: {
        studentId: String(student.wdt_ID),
        packageId: String(packageData.id),
        packageName: packageData.name,
        packageDuration: String(packageData.duration),
      },
      subscription_data: {
        metadata: {
          studentId: String(student.wdt_ID),
          packageId: String(packageData.id),
          packageName: packageData.name,
          packageDuration: String(packageData.duration),
          txRef: txRef,
        },
      },
      payment_method_types: ["card"],
    });

    await prisma.payment_checkout.create({
      data: {
        txRef: txRef,
        studentId: student.wdt_ID,
        provider: PaymentSource.stripe,
        intent: PaymentIntent.subscription,
        amount: packageData.price,
        currency: packageData.currency,
        status: "initialized",
        checkoutUrl: checkoutSession.url || "",
        returnUrl: successUrl,
        metadata: {
          packageId: packageData.id,
          packageName: packageData.name,
          checkoutSessionId: checkoutSession.id,
        },
      },
    });

    console.log(
      "[Stripe Subscription] Checkout session created successfully:",
      {
        sessionId: checkoutSession.id,
        checkoutUrl: checkoutSession.url,
        hasUrl: !!checkoutSession.url,
        txRef,
      }
    );

    // Ensure checkout URL exists
    if (!checkoutSession.url) {
      console.error(
        "[Stripe Subscription] CRITICAL: Checkout session created but URL is missing!",
        {
          sessionId: checkoutSession.id,
          sessionStatus: checkoutSession.status,
          sessionObject: JSON.stringify(checkoutSession, null, 2),
        }
      );
      return NextResponse.json(
        {
          error: "Checkout session created but URL is not available",
          details: "Please try again or contact support",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      txRef: txRef,
    });
  } catch (error: any) {
    console.error(
      "[Stripe Subscription] Error creating subscription checkout:",
      {
        error: error.message,
        stack: error.stack,
        name: error.name,
      }
    );
    return NextResponse.json(
      {
        error: "Failed to create subscription checkout",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
