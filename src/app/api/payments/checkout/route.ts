import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { randomUUID } from "crypto";
import { PaymentIntent, PaymentSource, Prisma } from "@prisma/client";
import { stripeClient } from "@/lib/payments/stripe";
import { checkPaymentRateLimit } from "@/lib/payments/rateLimiter";
import {
  ValidationError,
  PaymentError,
  handlePaymentError,
} from "@/lib/payments/errorHandler";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

type CheckoutProvider = "chapa" | "stripe";

interface CheckoutRequestBody {
  studentId?: number;
  chatId?: string;
  provider: CheckoutProvider;
  months?: string[];
  amount?: number;
  currency?: string;
  returnUrl?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  mode?: "tuition" | "deposit";
}

const chapApiBase =
  process.env.CHAPA_API?.replace(/\/$/, "") ?? "https://api.chapa.co/v1";
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutRequestBody;
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session && !body?.chatId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!body || !body.provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    const provider = body.provider.toLowerCase() as CheckoutProvider;
    if (!["chapa", "stripe"].includes(provider)) {
      return NextResponse.json(
        { error: "Unsupported provider" },
        { status: 400 }
      );
    }

    const studentId = body.studentId;
    const chatId = body.chatId;

    if (!studentId && !chatId) {
      return NextResponse.json(
        { error: "studentId or chatId is required" },
        { status: 400 }
      );
    }

    // If only chatId is provided, check if multiple students share it
    // This prevents payments from being attributed to the wrong student
    if (chatId && !studentId) {
      const studentsWithChatId = await prisma.wpos_wpdatatable_23.findMany({
        where: { chatId },
        select: { wdt_ID: true, name: true },
      });

      if (studentsWithChatId.length > 1) {
        console.warn(
          `[Checkout] Multiple students (${studentsWithChatId.length}) share chatId ${chatId}. studentId must be explicitly provided.`
        );
        return NextResponse.json(
          {
            error: "Multiple students found with this chatId. Please provide studentId explicitly.",
            students: studentsWithChatId.map((s) => ({
              id: s.wdt_ID,
              name: s.name,
            })),
          },
          { status: 400 }
        );
      }
    }

    const student = await prisma.wpos_wpdatatable_23.findFirst({
      where: {
        ...(chatId ? { chatId } : {}),
        ...(studentId ? { wdt_ID: studentId } : {}),
      },
      select: {
        wdt_ID: true,
        name: true,
        phoneno: true,
        classfee: true,
        classfeeCurrency: true,
        country: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found or access denied" },
        { status: 404 }
      );
    }

    const currency = (
      body.currency ||
      student.classfeeCurrency ||
      "ETB"
    ).toUpperCase();
    const classFee = student.classfee ?? 0;

    const intent =
      body.mode === "deposit" ? PaymentIntent.deposit : PaymentIntent.tuition;

    console.log(
      `[Checkout] Creating checkout for student ${
        student.wdt_ID
      }, intent: ${intent}, mode: ${body.mode}, amount: ${
        body.amount ?? classFee
      }`
    );

    const amount = body.amount ?? classFee;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount", code: "INVALID_AMOUNT" },
        { status: 400 }
      );
    }

    // Check payment amount limits
    const maxPaymentAmount = 1000000; // 1 million (adjust as needed)
    if (amount > maxPaymentAmount) {
      return NextResponse.json(
        { 
          error: `Payment amount exceeds maximum limit of ${maxPaymentAmount}`, 
          code: "PAYMENT_LIMIT_EXCEEDED" 
        },
        { status: 400 }
      );
    }

    // Check for duplicate payment (same amount, same student, within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicateCheckout = await prisma.payment_checkout.findFirst({
      where: {
        studentId: student.wdt_ID,
        amount: new Prisma.Decimal(amount),
        status: {
          in: ["initialized", "pending"],
        },
        createdAt: {
          gte: fiveMinutesAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (duplicateCheckout) {
      return NextResponse.json(
        {
          error:
            "A similar payment is already in progress. Please wait a few minutes and check your payment status.",
          code: "DUPLICATE_PAYMENT",
        },
        { status: 409 }
      );
    }

    // Check rate limiting
    const rateLimit = await checkPaymentRateLimit(student.wdt_ID);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many payment attempts. ${
            rateLimit.retryAfter
              ? `Please try again in ${Math.ceil(
                  (rateLimit.retryAfter || 0) / 60
                )} minutes.`
              : "Please try again later."
          }`,
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429 }
      );
    }

    if (provider === "chapa" && currency !== "ETB") {
      return NextResponse.json(
        {
          error:
            "Chapa currently supports ETB only. Switch provider or update currency.",
        },
        { status: 400 }
      );
    }

    if (provider === "stripe" && currency === "ETB") {
      return NextResponse.json(
        {
          error:
            "Stripe integration is intended for non-ETB currencies. Choose Chapa for ETB payments.",
        },
        { status: 400 }
      );
    }

    // Validate and normalize Stripe currency
    // Stripe supports 135+ currencies, but we validate common ones upfront
    // Stripe requires lowercase ISO 4217 currency codes (e.g., "usd", "eur", "gbp")
    if (provider === "stripe") {
      const commonStripeCurrencies = [
        "usd",
        "eur",
        "gbp",
        "cad",
        "aud",
        "jpy",
        "chf",
        "sek",
        "nok",
        "dkk",
        "pln",
        "czk",
        "huf",
        "ron",
        "bgn",
        "hrk",
        "rub",
        "try",
        "brl",
        "mxn",
        "ars",
        "clp",
        "cop",
        "pen",
        "inr",
        "sgd",
        "hkd",
        "nzd",
        "zar",
        "aed",
        "sar",
        "qar",
        "kwd",
        "bhd",
        "omr",
        "jod",
        "egp",
        "ils",
        "thb",
        "myr",
        "php",
        "idr",
        "vnd",
        "krw",
        "cny",
        "twd",
        "ngn",
        "kes",
        "ugx",
        "tzs",
        "ghs",
        "xof",
        "xaf",
        "mad",
        "bdt",
        "pkr",
        "lkr",
        "mmk",
        "khr",
        "lak",
      ];

      const normalizedCurrency = currency.toLowerCase();

      // Validate currency code format (3 letters)
      if (!/^[a-z]{3}$/.test(normalizedCurrency)) {
        return NextResponse.json(
          {
            error: `Invalid currency code format: ${currency}. Currency codes must be 3 letters (e.g., USD, EUR, GBP).`,
          },
          { status: 400 }
        );
      }

      // Warn about uncommon currencies but don't block (Stripe will reject if truly unsupported)
      if (!commonStripeCurrencies.includes(normalizedCurrency)) {
        console.warn(
          `[Stripe] Uncommon currency detected: ${normalizedCurrency}. Stripe will validate if supported.`
        );
      }
    }

    const txRef = randomUUID();
    const now = new Date();
    
    // Get the correct base URL for return redirects
    // Priority: Environment variables > Production domain detection > Request headers > request.nextUrl.origin
    const getBaseUrl = () => {
      // 1. Check environment variables first (highest priority for production)
      const ngrokUrl = process.env.NGROK_URL || process.env.NEXT_PUBLIC_NGROK_URL;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
      const configuredBaseRaw = ngrokUrl || appUrl;
      
      if (configuredBaseRaw && isAbsoluteUrl(configuredBaseRaw)) {
        console.log(`[Checkout] Using configured base URL: ${configuredBaseRaw}`);
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
        console.log(`[Checkout] Using forwarded host (production): ${baseUrl}`);
        return baseUrl;
      }
      
      if (host && host.includes(productionDomain)) {
        const protocol = forwardedProto || (request.nextUrl.protocol === "https:" ? "https" : "http");
        const baseUrl = `${protocol}://${host}`;
        console.log(`[Checkout] Using host header (production): ${baseUrl}`);
        return baseUrl;
      }
      
      if (refererUrl && refererUrl.includes(productionDomain)) {
        console.log(`[Checkout] Using referer URL (production): ${refererUrl}`);
        return refererUrl;
      }
      
      // Use forwarded host if available (even if not production domain)
      if (forwardedHost && !forwardedHost.includes("localhost") && !forwardedHost.includes("127.0.0.1")) {
        const baseUrl = `${forwardedProto}://${forwardedHost}`;
        console.log(`[Checkout] Using forwarded host: ${baseUrl}`);
        return baseUrl;
      }
      
      if (refererUrl) {
        console.log(`[Checkout] Using referer URL: ${refererUrl}`);
        return refererUrl;
      }
      
      if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
        const protocol = request.headers.get("x-forwarded-proto") || 
                        (request.nextUrl.protocol === "https:" ? "https" : "http");
        const baseUrl = `${protocol}://${host}`;
        console.log(`[Checkout] Using host header: ${baseUrl}`);
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
        console.log(`[Checkout] Using production URL (fallback): ${productionUrl}`);
        return productionUrl;
      }
      
      // 4. Last resort: request origin (may be localhost in dev)
      const requestOrigin = request.nextUrl.origin;
      
      // Warn if using localhost in what might be production
      if (requestOrigin.includes("localhost") || requestOrigin.includes("127.0.0.1")) {
        console.warn(
          `[Checkout] ⚠️ WARNING: Using localhost URL (${requestOrigin}) for return URL. ` +
          `This will cause redirect issues in production. ` +
          `Please set NEXT_PUBLIC_APP_URL=https://${productionDomain} environment variable.`
        );
      }
      
      console.log(`[Checkout] Using request origin (fallback): ${requestOrigin}`);
      return requestOrigin;
    };
    
    const baseUrl = getBaseUrl();
    const requestOrigin = request.nextUrl.origin; // Keep for Stripe fallback

    // For Chapa, we must use a real URL without placeholders
    // Chapa will append ?status=successful&tx_ref=... to the return URL
    // But we'll also include txRef in our return URL to ensure we have it
    // For Stripe, we can use placeholders which Stripe will replace
    const chapaReturnUrl = `${baseUrl}/student/payments/return?tx_ref=${txRef}`;

    const resolvedReturnUrl =
      provider === "chapa"
        ? chapaReturnUrl // Chapa doesn't support placeholders, use return page
        : ensureAbsoluteUrl(
            body.returnUrl,
            baseUrl ? `${baseUrl}/student/payments/return` : null,
            `${requestOrigin}/student/payments/return`
          );
    
    // Only set callback URL for Stripe (webhooks)
    // Chapa doesn't use webhooks - payment status is handled via return URL redirect
    const resolvedCallbackUrl = provider === "stripe"
      ? ensureAbsoluteUrl(
          body.callbackUrl,
          baseUrl ? `${baseUrl}/api/payments/webhooks/stripe` : null,
          `${requestOrigin}/api/payments/webhooks/stripe`
        )
      : undefined;

    // Log URLs for debugging
    if (provider === "chapa") {
      console.log(
        `[Checkout] Chapa Return URL: ${resolvedReturnUrl} (no webhook needed - status via return URL)`
      );
    } else if (provider === "stripe") {
      console.log(
        `[Checkout] Stripe URLs - Return: ${resolvedReturnUrl}, Webhook: ${resolvedCallbackUrl}`
      );
    }

    const sanitizedMonths =
      Array.isArray(body.months) && body.months.length > 0
        ? body.months
            .map((month) => (typeof month === "string" ? month : null))
            .filter((month): month is string => Boolean(month))
        : [];

    // Don't create payment record yet - wait for gateway confirmation
    // Payment will be created in finalizePaymentByTxRef when webhook confirms
    const checkout = await prisma.payment_checkout.create({
      data: {
        txRef,
        studentId: student.wdt_ID,
        provider:
          provider === "chapa" ? PaymentSource.chapa : PaymentSource.stripe,
        intent,
        amount: new Prisma.Decimal(amount),
        currency,
        status: "initialized",
        months: sanitizedMonths,
        returnUrl: body.returnUrl,
        callbackUrl: body.callbackUrl,
        paymentId: null, // Will be set when payment is created after gateway confirmation
        metadata: {
          ...(body.metadata ?? {}),
          studentName: student.name || "",
        },
      },
    });

    console.log(
      `[Checkout] Created checkout ${checkout.id} with txRef ${txRef}, intent: ${intent} (payment will be created after gateway confirmation)`
    );

    if (provider === "chapa") {
      if (!process.env.CHAPA_TOKEN) {
        return NextResponse.json(
          { error: "Chapa credentials are not configured" },
          { status: 500 }
        );
      }

      try {
        const checkoutUrl = await initializeChapaCheckout({
          amount,
          currency,
          txRef,
          student,
          months: sanitizedMonths,
          intent,
          returnUrl: resolvedReturnUrl,
          // No callback URL - Chapa doesn't use webhooks
        });

        // Validate checkout URL
        if (!checkoutUrl || typeof checkoutUrl !== "string") {
          console.error(
            "[Checkout] Invalid checkout URL received from Chapa:",
            checkoutUrl
          );
          throw new Error("Chapa returned invalid checkout URL");
        }

        // Validate URL format
        try {
          new URL(checkoutUrl);
        } catch {
          console.error(
            "[Checkout] Checkout URL is not a valid URL:",
            checkoutUrl
          );
          throw new Error("Chapa returned malformed checkout URL");
        }

        await prisma.payment_checkout.update({
          where: { id: checkout.id },
          data: { checkoutUrl, status: "pending" },
        });

        console.log(
          `[Checkout] Chapa checkout URL created successfully: ${checkoutUrl.substring(
            0,
            50
          )}...`
        );

        return NextResponse.json({
          success: true,
          provider: "chapa",
          txRef,
          checkoutUrl,
          // paymentId will be created after gateway confirmation
        });
      } catch (chapaError: any) {
        console.error(
          "[Checkout] Chapa checkout initialization failed:",
          chapaError
        );

        // Update checkout status to failed
        await prisma.payment_checkout.update({
          where: { id: checkout.id },
          data: {
            status: "failed",
            metadata: {
              ...((checkout.metadata as Record<string, unknown>) || {}),
              error: chapaError.message,
              errorAt: new Date().toISOString(),
            },
          },
        });

        // Return user-friendly error
        const errorMessage =
          chapaError.message ||
          "Failed to initialize Chapa payment. Please try again or contact support.";
        return NextResponse.json(
          {
            error: errorMessage,
            code: "CHAPA_INIT_FAILED",
            txRef, // Include txRef so user can check status later
          },
          { status: 500 }
        );
      }
    }

    if (!stripeClient || !stripePublishableKey) {
      return NextResponse.json(
        {
          error:
            "Stripe environment variables are not configured on the server.",
        },
        { status: 500 }
      );
    }

    // Normalize currency to lowercase for Stripe (Stripe requires lowercase ISO codes)
    // This was already validated above, but ensure it's normalized
    const normalizedCurrency = currency.toLowerCase();
    const amountInMinorUnit = convertToMinorUnit(amount, normalizedCurrency);

    console.log(
      `[Stripe] Creating checkout: ${amount} ${currency} (${normalizedCurrency}) = ${amountInMinorUnit} minor units`
    );

    const stripeReturnBase = resolvedReturnUrl;
    // Include session_id placeholder for Stripe to replace with actual session ID
    const successUrl = `${stripeReturnBase}?status=success&tx_ref=${txRef}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${stripeReturnBase}?status=cancelled&tx_ref=${txRef}`;

    try {
      const stripeSession = await stripeClient.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          txRef,
          studentId: student.wdt_ID.toString(),
          months: sanitizedMonths.join(","),
          intent,
          originalCurrency: currency, // Store original currency format
        },
        line_items: [
          {
            price_data: {
              currency: normalizedCurrency, // Stripe requires lowercase
              product_data: {
                name:
                  intent === PaymentIntent.deposit
                    ? `Darul Kubra Deposit (${student.name ?? "Student"})`
                    : `Darul Kubra Class Fee (${student.name ?? "Student"})`,
                description: `Payment in ${currency.toUpperCase()}`,
                metadata: {
                  studentId: student.wdt_ID.toString(),
                  txRef,
                  intent,
                },
              },
              unit_amount: amountInMinorUnit,
            },
            quantity: 1,
          },
        ],
      });

      if (!stripeSession.url) {
        return NextResponse.json(
          { error: "Failed to create Stripe checkout session." },
          { status: 500 }
        );
      }

      await prisma.payment_checkout.update({
        where: { id: checkout.id },
        data: {
          checkoutUrl: stripeSession.url,
          status: "pending",
          metadata: {
            ...((checkout.metadata as Record<string, unknown>) || {}),
            stripeSessionId: stripeSession.id,
            originalCurrency: currency,
            normalizedCurrency: normalizedCurrency,
          },
        },
      });

      return NextResponse.json({
        success: true,
        provider: "stripe",
        txRef,
        checkoutUrl: stripeSession.url,
        sessionId: stripeSession.id,
        publishableKey: stripePublishableKey,
        currency: normalizedCurrency, // Return normalized currency
        // paymentId will be created after gateway confirmation
      });
    } catch (stripeError: any) {
      console.error("Stripe checkout creation error:", stripeError);

      // Handle Stripe-specific errors
      if (
        stripeError?.code === "parameter_invalid_empty" ||
        stripeError?.code === "parameter_invalid_integer"
      ) {
        return NextResponse.json(
          {
            error: `Invalid currency or amount for Stripe. Currency: ${currency}, Amount: ${amount}. Please check that the currency is supported and the amount is valid.`,
            details: stripeError.message,
          },
          { status: 400 }
        );
      }

      if (stripeError?.type === "StripeInvalidRequestError") {
        return NextResponse.json(
          {
            error: `Stripe error: ${stripeError.message}`,
            code: stripeError.code,
          },
          { status: 400 }
        );
      }

      throw stripeError; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    // Use standardized error handling
    return handlePaymentError(error, "Checkout");
  }
}

interface ChapaInitParams {
  amount: number;
  currency: string;
  txRef: string;
  student: {
    name: string | null;
    phoneno: string | null;
    wdt_ID: number;
  };
  months: string[];
  intent: PaymentIntent;
  returnUrl: string;
  // callbackUrl removed - Chapa doesn't use webhooks
}

/**
 * Normalize phone number for Chapa payment gateway
 * Chapa expects Ethiopian phone numbers in format: 9xxxxxxxxx or 7xxxxxxxxx (9 digits)
 * This function removes country codes, leading zeros, and formats correctly
 */
function normalizePhoneForChapa(phone: string | null | undefined): string {
  if (!phone) {
    // Return a valid test number for Chapa (9 digits starting with 9)
    return "912345678";
  }

  // Remove all non-digit characters (spaces, dashes, plus signs, etc.)
  let cleaned = phone.replace(/\D/g, "");
  
  // Log original for debugging
  console.log(`[Chapa] Normalizing phone: "${phone}" -> "${cleaned}" (${cleaned.length} digits)`);

  // Handle various country code formats
  // Ethiopia: +251, 251
  // Some systems use: 259 (non-standard)
  // Tanzania: +255, 255
  if (cleaned.length > 9) {
    // Remove country codes (3-digit codes like 251, 259, 255)
    // Ethiopian numbers are typically 9 digits, so if we have more than 9,
    // there's likely a country code prefix
    if (cleaned.startsWith("251") && cleaned.length >= 11) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith("259") && cleaned.length >= 11) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith("255") && cleaned.length >= 11) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith("00251") && cleaned.length >= 13) {
      cleaned = cleaned.substring(5);
    } else if (cleaned.startsWith("00259") && cleaned.length >= 13) {
      cleaned = cleaned.substring(5);
    } else if (cleaned.startsWith("00255") && cleaned.length >= 13) {
      cleaned = cleaned.substring(5);
    }
  }

  // Remove leading zero if present (e.g., 0912345678 -> 912345678)
  // Chapa requires 9 digits starting with 9 or 7, NOT starting with 0
  // This must be done AFTER country code removal
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  
  // If after removing country code and leading 0 we have 8 digits starting with 9 or 7,
  // the number might be missing a digit. Ethiopian numbers should be 9 digits.
  // We can't automatically fix this - the number might be incorrect in the database.
  // But let's try to handle common cases: if it's 8 digits, it might need a digit added.
  // However, we don't know which digit to add, so we'll just log a warning.

  // Validate: Should be 9 digits starting with 9 or 7 (NO leading 0)
  if (cleaned.length === 9 && /^[79]\d{8}$/.test(cleaned)) {
    console.log(
      `[Chapa] Phone number "${phone}" normalized to "${cleaned}" (valid format - 9 digits starting with ${cleaned[0]})`
    );
    return cleaned;
  }

  // If we have 8 digits starting with 9 or 7, the number might be missing a digit
  // Ethiopian mobile numbers are 9 digits, so 8 digits suggests an error
  if (cleaned.length === 8 && /^[79]/.test(cleaned)) {
    console.warn(
      `[Chapa] Phone number "${phone}" normalized to "${cleaned}" (8 digits) - missing a digit? Chapa requires 9 digits. Original number may be incorrect in database.`
    );
    // Return as-is and let Chapa reject it with a clear error
    return cleaned;
  }

  // If still invalid, log warning and return cleaned version
  // Chapa will validate and return a proper error if needed
  console.warn(
    `[Chapa] Phone number "${phone}" normalized to "${cleaned}" (${cleaned.length} digits, starts with "${cleaned[0] || "empty"}") but doesn't match Chapa format (should be 9 digits starting with 9 or 7, NO leading 0). Chapa will validate.`
  );

  // Don't return a default - return the cleaned version so Chapa can give a proper error
  return cleaned;
}

async function initializeChapaCheckout(params: ChapaInitParams) {
  // Normalize phone number for Chapa format
  const phoneNumber = normalizePhoneForChapa(params.student.phoneno);

  const requestBody: Record<string, any> = {
    amount: params.amount,
    currency: params.currency,
    tx_ref: params.txRef,
    phone_number: phoneNumber,
    first_name: params.student.name ?? "Student",
    last_name: "",
    return_url: params.returnUrl,
    // Note: callback_url removed - Chapa doesn't use webhooks
    // Payment status is handled via return URL redirect
    "customization[title]":
      params.intent === PaymentIntent.deposit
        ? "Darul Kubra Deposit"
        : "Darul Kubra Class Fee",
    "customization[description]":
      params.intent === PaymentIntent.deposit
        ? "Top up your Darul Kubra student balance"
        : `Payment for monthly tuition (${params.months.join(", ")})`,
    "meta[student_id]": params.student.wdt_ID,
    "meta[months]": params.months.join(","),
    "meta[intent]": params.intent,
  };

  console.log(`[Chapa] Initializing checkout with:`, {
    apiBase: chapApiBase,
    endpoint: `${chapApiBase}/transaction/initialize`,
    amount: params.amount,
    currency: params.currency,
    txRef: params.txRef,
    returnUrl: params.returnUrl,
    phone: phoneNumber,
    note: "No webhook - status handled via return URL",
  });

  // Chapa API authentication
  // Chapa uses Bearer token format: Authorization: Bearer <token>
  // Token format: CHAPUBK-... (production) or CHASECK-... (test)
  const chapaToken = process.env.CHAPA_TOKEN;
  if (!chapaToken) {
    throw new Error("CHAPA_TOKEN environment variable is not set");
  }

  // Remove "Bearer " prefix if already present, then add it back
  const cleanToken = chapaToken.replace(/^Bearer\s+/i, "").trim();
  const authHeader = `Bearer ${cleanToken}`;

  // Log token info for debugging (without exposing full token)
  const tokenPrefix = cleanToken.substring(0, 15);
  const tokenLength = cleanToken.length;
  const tokenFormat = cleanToken.startsWith("CHAPUBK") ? "CHAPUBK (production)" 
    : cleanToken.startsWith("CHASECK") ? "CHASECK (test)" 
    : cleanToken.startsWith("CHAPUBK_TEST") ? "CHAPUBK_TEST (test)" 
    : "unknown format";
  
  console.log(`[Chapa] Token info: ${tokenPrefix}... (length: ${tokenLength}, format: ${tokenFormat})`);
  console.log(`[Chapa] Authorization header: Bearer ${tokenPrefix}... (${tokenLength} chars)`);
  
  // Validate token format
  if (!cleanToken.startsWith("CHAPUBK") && !cleanToken.startsWith("CHASECK") && !cleanToken.startsWith("CHAPUBK_TEST")) {
    console.error(`[Chapa] WARNING: Token doesn't match expected format. Should start with CHAPUBK-, CHASECK-, or CHAPUBK_TEST-`);
  }

  // Log the exact request being sent (for debugging)
  console.log(`[Chapa] Sending request to: ${chapApiBase}/transaction/initialize`);
  console.log(`[Chapa] Request body:`, JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${chapApiBase}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: authHeader, // Chapa uses Bearer token format
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    redirect: "follow",
  });

  console.log(
    `[Chapa] API response status: ${response.status} ${response.statusText}`
  );
  
  // Log response headers for debugging
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });
  console.log(`[Chapa] Response headers:`, responseHeaders);

  // Check content type
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const responseText = await response.text();
  console.log(`[Chapa] Response content-type: ${contentType}`);
  console.log(`[Chapa] Response length: ${responseText.length} characters`);

  if (!response.ok) {
    console.error(
      `[Chapa] API error - Status: ${response.status}, StatusText: ${response.statusText}`
    );
    console.error(
      `[Chapa] Response body (first 500 chars):`,
      responseText.substring(0, 500)
    );

    let errorMessage = "Failed to initialize Chapa checkout";

    if (isJson) {
      try {
        const errorData = JSON.parse(responseText);
        console.error(
          "[Chapa] Parsed error data:",
          JSON.stringify(errorData, null, 2)
        );

        // Chapa returns errors in different formats
        if (typeof errorData?.message === "string") {
          errorMessage = `Chapa error: ${errorData.message}`;
        } else if (
          typeof errorData?.message === "object" &&
          errorData.message !== null
        ) {
          // Sometimes message is an object with field-specific errors
          const errorFields = Object.entries(errorData.message)
            .map(([field, errors]) => {
              const errorList = Array.isArray(errors)
                ? errors.join(", ")
                : String(errors);
              return `${field}: ${errorList}`;
            })
            .join("; ");
          errorMessage = `Chapa error: ${errorFields}`;
        } else if (errorData?.status === "failed") {
          errorMessage = "Chapa payment initialization failed";
        } else if (errorData?.message) {
          errorMessage = `Chapa error: ${JSON.stringify(errorData.message)}`;
        }
      } catch (parseError) {
        console.error("[Chapa] Failed to parse error response as JSON");
        // If parsing fails, check if it's HTML (error page)
        if (
          responseText.includes("checkout.chapa.co") ||
          responseText.includes("<html")
        ) {
          errorMessage =
            "Chapa returned an error page. Please check your Chapa API credentials and configuration.";
        } else {
          errorMessage = `Chapa error: ${responseText.substring(0, 200)}`;
        }
      }
    } else {
      // Not JSON - might be HTML error page
      if (
        responseText.includes("checkout.chapa.co") ||
        responseText.includes("<html")
      ) {
        errorMessage =
          "Chapa returned an error page. Please verify your API token and account status.";
      } else {
        errorMessage = `Chapa error (${
          response.status
        }): ${responseText.substring(0, 200)}`;
      }
    }

    throw new Error(errorMessage);
  }

  // Parse response
  let data: any;
  if (isJson) {
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(
        "[Chapa] Failed to parse successful response as JSON:",
        parseError
      );
      throw new Error("Chapa returned invalid response format");
    }
  } else {
    // If not JSON, might be a redirect URL or error
    if (responseText.includes("checkout.chapa.co")) {
      // Might be a direct URL in the response
      const urlMatch = responseText.match(
        /https?:\/\/[^\s"<>]+checkout\.chapa\.co[^\s"<>]*/
      );
      if (urlMatch) {
        console.log(`[Chapa] Found checkout URL in response: ${urlMatch[0]}`);
        return urlMatch[0];
      }
    }
    throw new Error(
      "Chapa returned non-JSON response. Please check your Chapa configuration."
    );
  }

  console.log(`[Chapa] API response:`, {
    status: data?.status,
    hasData: !!data?.data,
    hasCheckoutUrl: !!data?.data?.checkout_url,
    message: data?.message,
    keys: Object.keys(data || {}),
  });

  if (data?.status !== "success") {
    console.error("Chapa response error:", JSON.stringify(data, null, 2));
    const errorMsg =
      data?.message ||
      data?.data?.message ||
      "Chapa returned non-success status";
    throw new Error(`Chapa error: ${errorMsg}`);
  }

  const checkoutUrl = data.data?.checkout_url;
  if (!checkoutUrl) {
    console.error(
      "[Chapa] No checkout_url in response:",
      JSON.stringify(data, null, 2)
    );
    throw new Error(
      "Chapa API did not return a checkout URL. Please check your Chapa configuration."
    );
  }

  // Validate URL doesn't point to error page
  if (checkoutUrl.includes("error") || checkoutUrl.includes("failed")) {
    console.error(
      "[Chapa] Checkout URL appears to be an error page:",
      checkoutUrl
    );
    throw new Error(
      "Chapa returned an error page URL. Please check your payment details and Chapa account."
    );
  }

  console.log(
    `[Chapa] âœ… Checkout URL received: ${checkoutUrl.substring(0, 80)}...`
  );
  return checkoutUrl as string;
}

function isAbsoluteUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function ensureAbsoluteUrl(
  candidate: string | null | undefined,
  fallback: string | null,
  defaultUrl: string
) {
  if (candidate && isAbsoluteUrl(candidate)) {
    return candidate;
  }
  if (fallback && isAbsoluteUrl(fallback)) {
    return fallback;
  }
  return defaultUrl;
}

function convertToMinorUnit(amount: number, currency: string) {
  const zeroDecimalCurrencies = new Set([
    "BIF",
    "CLP",
    "DJF",
    "GNF",
    "JPY",
    "KMF",
    "KRW",
    "MGA",
    "PYG",
    "RWF",
    "UGX",
    "VND",
    "VUV",
    "XAF",
    "XOF",
    "XPF",
  ]);

  const upperCurrency = currency.toUpperCase();
  return zeroDecimalCurrencies.has(upperCurrency)
    ? Math.round(amount)
    : Math.round(amount * 100);
}
