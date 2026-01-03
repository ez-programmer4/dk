import { NextRequest, NextResponse } from "next/server";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Test Chapa API connection and configuration
 * GET /api/payments/chapa/test
 */
export async function GET(request: NextRequest) {
  try {
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
      checks: {},
      errors: [],
      warnings: [],
    };

    // Check 1: Environment variables
    const chapaToken = process.env.CHAPA_TOKEN;
    const chapaApi = process.env.CHAPA_API;
    const chapaTestMode = process.env.CHAPA_TEST_MODE;
    const chapaTestPhone = process.env.CHAPA_TEST_PHONE;

    diagnostics.checks.env = {
      CHAPA_TOKEN: chapaToken ? `${chapaToken.substring(0, 10)}...` : "NOT SET",
      CHAPA_API: chapaApi || "Using default: https://api.chapa.co/v1",
      CHAPA_TEST_MODE: chapaTestMode || "Not set",
      CHAPA_TEST_PHONE: chapaTestPhone || "Not set",
    };

    if (!chapaToken) {
      diagnostics.errors.push("CHAPA_TOKEN is not set in environment variables");
    }

    // Check 2: Test API connection
    if (chapaToken) {
      const chapaApiBase = chapaApi?.replace(/\/$/, "") ?? "https://api.chapa.co/v1";
      const cleanToken = chapaToken.replace(/^Bearer\s+/i, "").trim();
      
      // Check token format
      const tokenFormat = cleanToken.startsWith("CHAPUBK") ? "CHAPUBK (production)" 
        : cleanToken.startsWith("CHASECK") ? "CHASECK (test)" 
        : cleanToken.startsWith("CHAPUBK_TEST") ? "CHAPUBK_TEST (test)" 
        : "unknown format";
      
      diagnostics.checks.tokenFormat = {
        format: tokenFormat,
        length: cleanToken.length,
        prefix: cleanToken.substring(0, 15) + "...",
        isValidFormat: cleanToken.startsWith("CHAPUBK") || cleanToken.startsWith("CHASECK") || cleanToken.startsWith("CHAPUBK_TEST"),
      };
      
      if (!diagnostics.checks.tokenFormat.isValidFormat) {
        diagnostics.errors.push(`Invalid token format. Should start with CHAPUBK-, CHASECK-, or CHAPUBK_TEST-`);
      }

      // Try API connection with Bearer format
      try {
        const testResponse = await fetch(`${chapaApiBase}/banks`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${cleanToken}`,
            "Content-Type": "application/json",
          },
        });

        const responseText = await testResponse.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }

        diagnostics.checks.apiConnection = {
          status: testResponse.status,
          ok: testResponse.ok,
          statusText: testResponse.statusText,
          authMethod: "Bearer",
          response: responseData,
        };

        if (testResponse.ok) {
          diagnostics.checks.apiConnection.message = "âœ… Chapa API connection successful";
        } else {
          diagnostics.errors.push(`Chapa API connection failed: ${testResponse.status} - ${JSON.stringify(responseData)}`);
          
          // If 401, provide specific guidance
          if (testResponse.status === 401) {
            diagnostics.errors.push("401 Unauthorized - This usually means:");
            diagnostics.errors.push("1. The API token is incorrect or expired");
            diagnostics.errors.push("2. The Chapa account is not activated for payments");
            diagnostics.errors.push("3. The token format is wrong");
            diagnostics.errors.push("Action: Check your Chapa Dashboard â†’ Settings â†’ API Keys and verify the token");
          }
        }
      } catch (error: any) {
        diagnostics.errors.push(`Chapa API connection error: ${error.message}`);
        diagnostics.checks.apiConnection = {
          error: error.message,
        };
      }
    }

    // Check 3: Webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
    const webhookUrl = baseUrl
      ? `${baseUrl}/api/payments/webhooks/chapa`
      : "âڑ ï¸ڈ NEXT_PUBLIC_BASE_URL not set - webhook URL unknown";

    diagnostics.checks.webhook = {
      url: webhookUrl,
      configured: !!baseUrl,
    };

    if (!baseUrl) {
      diagnostics.warnings.push("NEXT_PUBLIC_BASE_URL not set - webhook URL cannot be determined");
    }

    // Summary
    const hasErrors = diagnostics.errors.length > 0;
    const hasWarnings = diagnostics.warnings.length > 0;

    return NextResponse.json({
      success: !hasErrors,
      diagnostics,
      summary: {
        totalChecks: Object.keys(diagnostics.checks).length,
        errors: diagnostics.errors.length,
        warnings: diagnostics.warnings.length,
        status: hasErrors ? "â‌Œ Issues Found" : hasWarnings ? "âڑ ï¸ڈ Warnings" : "âœ… All Good",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run diagnostics",
        details: error.message,
      },
      { status: 500 }
    );
  }
}


