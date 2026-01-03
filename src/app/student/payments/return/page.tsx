"use client";

import { Suspense } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type CheckoutStatus =
  | "initialized"
  | "pending"
  | "completed"
  | "failed"
  | "provider_required";

interface CheckoutStatusResponse {
  success: boolean;
  status: CheckoutStatus;
  provider: string;
  amount: number;
  currency: string;
  payment: {
    id: number;
    status: string;
    providerStatus: string | null;
    providerReference: string | null;
    currency: string;
  } | null;
  subscription?: {
    id: number;
    status: string;
    startDate: string;
    endDate: string;
    nextBillingDate: string | null;
    package: {
      id: number;
      name: string;
      price: number;
      currency: string;
      duration: number;
    };
  } | null;
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

type ThemeParams = {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  button_color?: string;
  button_text_color?: string;
  section_bg_color?: string;
  secondary_bg_color?: string;
};

function PaymentReturnPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Try to get txRef from URL first
  const urlTxRef =
    searchParams.get("tx_ref") ||
    searchParams.get("txRef") ||
    searchParams.get("reference") ||
    "";

  // State for txRef (can be updated from sessionStorage on client side)
  const [txRef, setTxRef] = useState<string>(urlTxRef);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [packageId, setPackageId] = useState<string | null>(null);

  // Extract Stripe session_id from URL (Stripe adds this when redirecting after payment)
  const stripeSessionId =
    searchParams.get("session_id") || searchParams.get("sessionId") || "";


  // Load subscription metadata from sessionStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const subscriptionMeta = sessionStorage.getItem("dk_subscription_meta");
        if (subscriptionMeta) {
          const meta = JSON.parse(subscriptionMeta);
          if (meta.studentId && !studentId) {
            setStudentId(String(meta.studentId));
          }
          if (meta.packageId && !packageId) {
            setPackageId(String(meta.packageId));
          }
        }

        // Also check for checkout metadata
        const checkoutMeta = sessionStorage.getItem("dk_checkout_meta");
        if (checkoutMeta) {
          const meta = JSON.parse(checkoutMeta);
          if (meta.studentId && !studentId) {
            setStudentId(String(meta.studentId));
          }
          if (meta.txRef && !txRef) {
            setTxRef(meta.txRef);
          }
        }
      } catch (err) {
        console.error(
          "[Payment Return] Error loading metadata from sessionStorage:",
          err
        );
      }
    }
  }, []);

  const statusParam =
    searchParams.get("status") || searchParams.get("Status") || "";

  // Chapa might redirect with different status values
  // Check for common failure indicators (check window only on client side)
  const isFailedStatus =
    typeof window !== "undefined" &&
    (statusParam.toLowerCase() === "failed" ||
      statusParam.toLowerCase() === "error" ||
      statusParam.toLowerCase() === "cancelled" ||
      statusParam.toLowerCase() === "cancel" ||
      window.location.href.includes("error") ||
      window.location.href.includes("failed"));

  // If URL shows success, don't show loading state
  const urlShowsSuccess =
    statusParam.toLowerCase() === "success" ||
    statusParam.toLowerCase() === "successful" ||
    statusParam.toLowerCase() === "completed";
  const [loading, setLoading] = useState(!urlShowsSuccess && !isFailedStatus); // Don't show loading if URL already indicates success or failure
  const [error, setError] = useState<string | null>(null);
  const [checkoutStatus, setCheckoutStatus] =
    useState<CheckoutStatusResponse | null>(null);
  const [themeParams, setThemeParams] = useState<ThemeParams>({});

  const interpretedStatus = useMemo(() => {
    if (!checkoutStatus) return statusParam;
    if (checkoutStatus.status === "completed") return "success";
    if (checkoutStatus.status === "failed") return "failed";
    return checkoutStatus.status;
  }, [checkoutStatus, statusParam]);

  const backgroundColor =
    themeParams.bg_color || themeParams.secondary_bg_color || "#020617";
  const cardBackground =
    themeParams.section_bg_color || themeParams.secondary_bg_color || "#0f172a";
  const textColor = themeParams.text_color || "#f8fafc";
  const hintColor = themeParams.hint_color || "#94a3b8";
  const buttonBg = themeParams.button_color || "#22c55e";
  const buttonTextColor = themeParams.button_text_color || "#022c22";

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp as any;
      if (tg?.themeParams) {
        setThemeParams(tg.themeParams as ThemeParams);
      }
    }
  }, []);

  // Get txRef from sessionStorage on client side (runs after mount)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // If we already have txRef from URL, use it
    if (urlTxRef) {
      setTxRef(urlTxRef);
      console.log("[Payment Return] Found txRef in URL:", urlTxRef);
      return;
    }

    // Try to get from sessionStorage
    try {
      // Try dk_checkout_meta first (newer format)
      const checkoutMeta = sessionStorage.getItem("dk_checkout_meta");
      if (checkoutMeta) {
        const parsed = JSON.parse(checkoutMeta) as { txRef?: string };
        if (parsed.txRef) {
          setTxRef(parsed.txRef);
          console.log(
            "[Payment Return] Found txRef in sessionStorage (dk_checkout_meta):",
            parsed.txRef
          );
          return;
        }
      }

      // Also try dk_checkout_return (older format, might have txRef)
      const checkoutReturn = sessionStorage.getItem("dk_checkout_return");
      if (checkoutReturn) {
        const parsed = JSON.parse(checkoutReturn) as {
          txRef?: string;
          studentId?: number;
        };
        if (parsed.txRef) {
          setTxRef(parsed.txRef);
          console.log(
            "[Payment Return] Found txRef in sessionStorage (dk_checkout_return):",
            parsed.txRef
          );
        }
        if (parsed.studentId) {
          setStudentId(String(parsed.studentId));
        }
      }
    } catch (e) {
      console.error("[Payment Return] Error reading sessionStorage:", e);
    }

    // Log all URL parameters for debugging (use local variables, not state)
    const currentTxRef =
      urlTxRef ||
      (typeof window !== "undefined"
        ? (() => {
            try {
              const meta = sessionStorage.getItem("dk_checkout_meta");
              if (meta) {
                const parsed = JSON.parse(meta) as { txRef?: string };
                return parsed.txRef || "";
              }
              const ret = sessionStorage.getItem("dk_checkout_return");
              if (ret) {
                const parsed = JSON.parse(ret) as { txRef?: string };
                return parsed.txRef || "";
              }
            } catch {}
            return "";
          })()
        : "");

    const currentStudentId = (() => {
      try {
        const ret = sessionStorage.getItem("dk_checkout_return");
        if (ret) {
          const parsed = JSON.parse(ret) as { studentId?: number };
          return parsed.studentId ? String(parsed.studentId) : "";
        }
      } catch {}
      return "";
    })();

    console.log("[Payment Return] URL parameters:", {
      fullUrl: window.location.href,
      searchParams: Object.fromEntries(searchParams.entries()),
      txRef: currentTxRef || "NOT FOUND",
      studentId: currentStudentId || "NOT FOUND",
    });
  }, [urlTxRef, searchParams]);

  useEffect(() => {
    let isActive = true;
    let pollTimer: NodeJS.Timeout | null = null;
    let pollCount = 0;
    const MAX_POLL_ATTEMPTS = 15; // Max 15 attempts (60 seconds total)

    // Get current session_id from URL (may change)
    const currentSessionId =
      searchParams.get("session_id") || searchParams.get("sessionId") || "";

    const fetchStatus = async () => {
      pollCount++;
      console.log(
        `[Payment Return] Fetching status (attempt ${pollCount}/${MAX_POLL_ATTEMPTS})...`
      );

      // Read sessionStorage directly to ensure we have the latest data
      let sessionStorageStudentId: string | null = null;
      let sessionStoragePackageId: string | null = null;
      
      if (typeof window !== "undefined") {
        try {
          const subscriptionMeta = sessionStorage.getItem("dk_subscription_meta");
          if (subscriptionMeta) {
            const meta = JSON.parse(subscriptionMeta);
            console.log("[Payment Return] Subscription metadata from sessionStorage:", meta);
            sessionStorageStudentId = meta.studentId ? String(meta.studentId) : null;
            sessionStoragePackageId = meta.packageId ? String(meta.packageId) : null;
          }
        } catch (err) {
          console.error("[Payment Return] Error reading subscription metadata:", err);
        }
      }

      // SIMPLIFIED: Webhook is the single source of truth for finalization
      // Return page just checks if subscription exists in database (webhook should have finalized it)
      // Extract studentId and packageId from URL or sessionStorage
          const urlStudentId = searchParams.get("studentId");
          const urlPackageId = searchParams.get("packageId");
      const finalStudentId = urlStudentId || sessionStorageStudentId || studentId;
      const finalPackageId = urlPackageId || sessionStoragePackageId || packageId;

      // If we have studentId and packageId, check if subscription was finalized by webhook
      if (finalStudentId && finalPackageId) {
        try {
          console.log("[Payment Return] Checking if subscription was finalized by webhook...", {
            studentId: finalStudentId,
            packageId: finalPackageId,
          });

          // Check if subscription exists in database (webhook should have created it)
          const statusResponse = await fetch(
            `/api/payments/checkout/status?studentId=${encodeURIComponent(finalStudentId)}&packageId=${encodeURIComponent(finalPackageId)}`
          );

          if (statusResponse.ok) {
            const statusResult = await statusResponse.json();
            console.log("[Payment Return] Status check result:", statusResult);

            if (statusResult.status === "completed" || statusResult.subscription) {
              // Subscription was finalized by webhook
                  setCheckoutStatus({
                    success: true,
                    status: "completed",
                    provider: "stripe",
                amount: statusResult.amount || 0,
                currency: statusResult.currency || "USD",
                payment: statusResult.payment || null,
                subscription: statusResult.subscription || null,
                    updatedAt: new Date().toISOString(),
                  });
                  setLoading(false);
                  return;
                }
          }
        } catch (statusError) {
          console.error("[Payment Return] Error checking subscription status:", statusError);
          // Continue to polling if webhook hasn't processed yet
        }
      }

      // If URL indicates failure and we have txRef, mark as failed immediately
      if (isFailedStatus && txRef) {
        console.log(
          "[Payment Return] URL indicates payment failure, marking as failed"
        );
        setCheckoutStatus({
          success: false,
          status: "failed",
          provider: "chapa",
          amount: 0,
          currency: "ETB",
          payment: null,
          updatedAt: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }

      // If no txRef, try to get latest checkout by studentId
      if (!txRef) {
        if (studentId) {
          console.log(
            "[Payment Return] No txRef found, trying to get latest checkout for student:",
            studentId
          );
          try {
            // Try to get latest checkout for this student
            const response = await fetch(
              `/api/payments/checkout/latest?studentId=${encodeURIComponent(
                studentId
              )}`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.txRef) {
                console.log(
                  "[Payment Return] Found latest checkout txRef:",
                  data.txRef
                );
                setTxRef(data.txRef);
                // Retry with the found txRef
                setTimeout(() => fetchStatus(), 100);
                return;
              }
            }
          } catch (e) {
            console.error(
              "[Payment Return] Error fetching latest checkout:",
              e
            );
          }
        }

        // If we have txRef from URL but it's empty, try Stripe verification by tx_ref
        const urlTxRef =
          searchParams.get("tx_ref") || searchParams.get("txRef");
        if (urlTxRef && !txRef) {
          console.log(
            `[Payment Return] Found tx_ref in URL: ${urlTxRef}, verifying with Stripe...`
          );
          try {
            const verifyResponse = await fetch(
              "/api/payments/stripe/verify-payment",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tx_ref: urlTxRef }),
              }
            );

            if (verifyResponse.ok) {
              const verifyResult = await verifyResponse.json();
              console.log(
                "[Payment Return] Stripe tx_ref verification result:",
                verifyResult
              );

              if (verifyResult.verified && verifyResult.finalized) {
                if (verifyResult.payment) {
                  setCheckoutStatus({
                    success: true,
                    status: "completed",
                    provider: "stripe",
                    amount: verifyResult.payment.amount || 0,
                    currency: verifyResult.payment.currency || "USD",
                    payment: {
                      id: verifyResult.payment.id,
                      status: verifyResult.payment.status,
                      providerStatus: "paid",
                      providerReference: urlTxRef,
                      currency: verifyResult.payment.currency || "USD",
                    },
                    updatedAt: new Date().toISOString(),
                  });
                } else {
                  // Subscription payment
                  setCheckoutStatus({
                    success: true,
                    status: "completed",
                    provider: "stripe",
                    amount: 0,
                    currency: "USD",
                    payment: null,
                    updatedAt: new Date().toISOString(),
                  });
                }
                setLoading(false);
                return;
              }
            }
          } catch (verifyError) {
            console.error(
              "[Payment Return] Stripe tx_ref verification error:",
              verifyError
            );
            // Fall through to regular status check
          }
        }

        setError(
          "Missing transaction reference. Please check your payment history or contact support."
        );
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/payments/checkout/status?txRef=${encodeURIComponent(txRef)}`
        );

        if (!isActive) return;

        // Check content type before parsing
        const contentType = response.headers.get("content-type");
        const isJson = contentType?.includes("application/json");

        if (!response.ok) {
          let errorMessage = "Unable to load payment status.";

          // Handle 503 Service Unavailable - might be temporary
          if (response.status === 503) {
            console.warn(
              "[Payment Return] Service temporarily unavailable (503), will retry..."
            );
            // Retry after a delay
            setTimeout(() => {
              if (isActive) {
                fetchStatus();
              }
            }, 3000);
            return; // Don't throw error, just retry
          }

          if (isJson) {
            try {
              const result = await response.json();
              errorMessage = result?.error || errorMessage;
            } catch {
              // If JSON parsing fails, use default message
            }
          } else {
            // If response is HTML (error page), try to get status text
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }

          throw new Error(errorMessage);
        }

        if (!isJson) {
          throw new Error("Server returned invalid response format.");
        }

        const result = (await response.json()) as CheckoutStatusResponse;
        console.log(
          `[Payment Return] Status received: ${result.status}, provider: ${result.provider}`
        );
        setCheckoutStatus(result);

        // If status is still pending and it's a Chapa payment, try to verify manually
        // This helps if the webhook hasn't fired yet
        if (
          result.status === "pending" &&
          result.provider === "chapa" &&
          pollCount <= 3 // Only try manual verification in first 3 attempts
        ) {
          console.log(
            "[Payment Return] Chapa payment is pending, attempting manual verification..."
          );
          try {
            const verifyResponse = await fetch("/api/payments/chapa/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ txRef }),
            });

            if (verifyResponse.ok) {
              const verifyResult = await verifyResponse.json();
              console.log(
                "[Payment Return] Manual verification result:",
                verifyResult
              );
              if (verifyResult.success) {
                console.log(
                  "[Payment Return] Payment verified and finalized successfully, re-fetching status..."
                );
                // Immediately re-fetch status to get updated info
                // Use a short delay to ensure database transaction is committed
                setTimeout(() => {
                  if (isActive) {
                    fetchStatus();
                  }
                }, 500);
                return;
              } else {
                console.log(
                  "[Payment Return] Verification returned success=false:",
                  verifyResult
                );
              }
            } else {
              const errorText = await verifyResponse.text();
              console.warn(
                "[Payment Return] Manual verification failed:",
                verifyResponse.status,
                errorText
              );
            }
          } catch (verifyError) {
            console.error(
              "[Payment Return] Manual verification error:",
              verifyError
            );
            // Continue with normal polling
          }
        }

        if (result.status === "completed" || result.status === "failed") {
          console.log(
            `[Payment Return] Payment ${result.status}, stopping polling`
          );
          setLoading(false);
          if (pollTimer) {
            clearTimeout(pollTimer);
            pollTimer = null;
          }
        } else {
          // Check if we've exceeded max attempts
          if (pollCount >= MAX_POLL_ATTEMPTS) {
            console.warn(
              "[Payment Return] Max polling attempts reached, stopping"
            );
            setLoading(false);
            setError(
              "Payment is taking longer than expected to confirm. Please check your payment history or contact support."
            );
            if (pollTimer) {
              clearTimeout(pollTimer);
              pollTimer = null;
            }
            return;
          }

          setLoading(false);
          console.log(
            `[Payment Return] Status still pending, will retry in 4 seconds...`
          );
          pollTimer = setTimeout(fetchStatus, 4000);
        }
      } catch (err) {
        if (!isActive) return;

        let errorMessage = "Something went wrong while checking your payment.";

        if (err instanceof Error) {
          errorMessage = err.message;

          // If it's a JSON parse error, provide more helpful message
          if (
            err.message.includes("JSON") ||
            err.message.includes("<!DOCTYPE")
          ) {
            errorMessage =
              "Unable to connect to payment server. Please try refreshing the page or contact support.";
          }
        }

        console.error("[Payment Return] Error fetching status:", err);
        setError(errorMessage);
        setLoading(false);

        // If we have txRef and status from URL, we can still try to redirect
        // even if the API call fails
        if (
          txRef &&
          (statusParam === "success" || statusParam === "successful")
        ) {
          console.log(
            "[Payment Return] API failed but URL indicates success, attempting redirect anyway"
          );
          // Don't set error, just try to redirect after a delay
          setTimeout(() => {
            const redirectToMiniApp = () => {
              // Try to get chatId and studentId from session storage
              try {
                const stored = sessionStorage.getItem("dk_checkout_return");
                if (stored) {
                  const parsed = JSON.parse(stored) as {
                    chatId?: string;
                    studentId?: number;
                  };
                  if (parsed.chatId && parsed.studentId) {
                    const redirectUrl = `/student/mini-app/${parsed.chatId}?studentId=${parsed.studentId}&tx_ref=${txRef}&status=${statusParam}`;
                    sessionStorage.removeItem("dk_checkout_return");
                    window.location.href = redirectUrl;
                    return;
                  }
                }
              } catch {
                // ignore
              }
            };
            redirectToMiniApp();
          }, 2000);
        }
      }
    };

    fetchStatus();

    return () => {
      isActive = false;
      if (pollTimer) {
        clearTimeout(pollTimer);
      }
    };
  }, [txRef, studentId, isFailedStatus, statusParam]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
    }
  }, []);

  const handleReturnToMiniApp = () => {
    if (typeof window !== "undefined") {
      // Try to get chatId and studentId from session storage
      try {
        const stored = sessionStorage.getItem("dk_checkout_return");
        if (stored) {
          const parsed = JSON.parse(stored) as {
            chatId?: string;
            studentId?: number;
          };
          if (parsed.chatId && parsed.studentId) {
            // Redirect to mini-app with payment status
            const redirectUrl = `/student/mini-app/${parsed.chatId}?studentId=${parsed.studentId}&tx_ref=${txRef}&status=${statusParam}`;
            sessionStorage.removeItem("dk_checkout_return");
            router.push(redirectUrl);
            return;
          }
        }
      } catch {
        // ignore storage errors
      }

      // Fallback: Try to extract from referrer
      const referrer = document.referrer;
      const chatIdMatch = referrer?.match(/\/student\/mini-app\/([^/?]+)/);
      const studentIdMatch = referrer?.match(/[?&]studentId=(\d+)/);

      if (chatIdMatch && studentIdMatch) {
        const chatId = chatIdMatch[1];
        const studentId = studentIdMatch[1];
        const redirectUrl = `/student/mini-app/${chatId}?studentId=${studentId}&tx_ref=${txRef}&status=${statusParam}`;
        router.push(redirectUrl);
      } else if (window.Telegram?.WebApp) {
        (window.Telegram.WebApp as any)?.close?.();
      } else if (document.referrer) {
        window.history.back();
      } else {
        router.push("/");
      }
    }
  };

  // Auto-redirect to mini-app after successful payment
  useEffect(() => {
    // Also check URL params for status (Chapa might redirect with status=successful)
    const urlStatus = statusParam.toLowerCase();
    const isSuccess =
      checkoutStatus?.status === "completed" ||
      urlStatus === "success" ||
      urlStatus === "successful" ||
      urlStatus === "completed";

    if (isSuccess && txRef) {
      const redirectToMiniApp = () => {
        // Try multiple methods to get chatId and studentId
        let chatId: string | null = null;
        let studentId: string | null = null;

        // Method 1: Session storage
        try {
          const stored = sessionStorage.getItem("dk_checkout_return");
          if (stored) {
            const parsed = JSON.parse(stored) as {
              chatId?: string;
              studentId?: number;
            };
            if (parsed.chatId && parsed.studentId) {
              chatId = parsed.chatId;
              studentId = String(parsed.studentId);
              sessionStorage.removeItem("dk_checkout_return");
            }
          }
        } catch {
          // ignore storage errors
        }

        // Method 2: URL parameters (from Stripe redirect)
        if (!chatId || !studentId) {
          const urlChatId = searchParams.get("chatId");
          const urlStudentId = searchParams.get("studentId");
          if (urlChatId) chatId = urlChatId;
          if (urlStudentId) studentId = urlStudentId;
        }

        // Method 3: Subscription metadata
        if (!chatId || !studentId) {
          try {
            const subscriptionMeta = sessionStorage.getItem(
              "dk_subscription_meta"
            );
            if (subscriptionMeta) {
              const meta = JSON.parse(subscriptionMeta) as {
                chatId?: string;
                studentId?: number;
              };
              if (meta.chatId && !chatId) chatId = meta.chatId;
              if (meta.studentId && !studentId)
                studentId = String(meta.studentId);
            }
          } catch {
            // ignore
          }
        }

        // Method 4: Referrer
        if (!chatId || !studentId) {
          const referrer = document.referrer;
          const chatIdMatch = referrer?.match(/\/student\/mini-app\/([^/?]+)/);
          const studentIdMatch = referrer?.match(/[?&]studentId=(\d+)/);
          if (chatIdMatch) chatId = chatIdMatch[1];
          if (studentIdMatch) studentId = studentIdMatch[1];
        }

        // Redirect if we have both
        if (chatId && studentId) {
          const redirectUrl = `/student/mini-app/${chatId}?studentId=${studentId}&tx_ref=${txRef}&status=${
            statusParam || "success"
          }&reload=true&timestamp=${Date.now()}`;
          console.log(
            `[Payment Return] Redirecting to mini-app with reload: ${redirectUrl}`
          );
          // Clear session storage to force reload
          try {
            sessionStorage.removeItem("dk_checkout_meta");
            sessionStorage.removeItem("dk_subscription_meta");
          } catch {}
          // Use window.location.replace to force reload
          window.location.replace(redirectUrl);
          return;
        }

        // Fallback: Try Telegram WebApp close
        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
          console.log("[Payment Return] Closing Telegram WebApp");
          (window.Telegram.WebApp as any)?.close?.();
          return;
        }

        // Last resort: Go back
        if (document.referrer) {
          console.log("[Payment Return] Going back to referrer");
          window.history.back();
        } else {
          console.log("[Payment Return] Redirecting to home");
          router.push("/");
        }
      };

      // Show success message for 3 seconds before redirecting
      // If URL already shows success, show message for 3 seconds
      // If waiting for API confirmation, show message for 3 seconds after confirmation
      const urlShowsSuccess =
        statusParam.toLowerCase() === "success" ||
        statusParam.toLowerCase() === "successful";
      const delay =
        checkoutStatus?.status === "completed" || urlShowsSuccess ? 3000 : 500;
      const timer = setTimeout(redirectToMiniApp, delay);

      return () => clearTimeout(timer);
    }
  }, [checkoutStatus?.status, txRef, statusParam, router, searchParams]);

  const isSuccess =
    interpretedStatus === "success" ||
    statusParam.toLowerCase() === "success" ||
    statusParam.toLowerCase() === "successful";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor, color: textColor }}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-white/10 p-8 shadow-xl relative overflow-hidden"
        style={{ backgroundColor: cardBackground }}
      >
        {/* Success animation background */}
        {isSuccess && !loading && (
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0 animate-pulse"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.3) 0%, transparent 70%)",
              }}
            />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center text-center gap-6">
          {/* Success Icon with Animation */}
          {isSuccess && !loading && (
            <div className="relative">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)",
                  border: "3px solid rgba(34, 197, 94, 0.5)",
                }}
              >
                <svg
                  className="w-12 h-12"
                  style={{ color: "#22c55e" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              {/* Animated rings */}
              <div
                className="absolute inset-0 rounded-full border-2 animate-ping"
                style={{
                  borderColor: "rgba(34, 197, 94, 0.3)",
                }}
              />
            </div>
          )}

          {/* Loading Spinner */}
          {loading && (
            <div
              className="w-16 h-16 border-4 border-t-transparent rounded-full mx-auto mb-4 animate-spin"
              style={{ borderColor: buttonBg }}
            />
          )}

          {/* Error Icon */}
          {interpretedStatus === "failed" && !loading && (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)",
                border: "3px solid rgba(239, 68, 68, 0.5)",
              }}
            >
              <svg
                className="w-12 h-12"
                style={{ color: "#ef4444" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}

          <div className="space-y-2">
            <h1 className="text-3xl font-bold" style={{ color: textColor }}>
              {isSuccess && !loading
                ? "Payment Successful! 🎉"
                : interpretedStatus === "failed"
                ? "Payment Failed"
                : loading
                ? "Processing Payment..."
                : "Payment Status"}
            </h1>
            <p className="text-base font-medium" style={{ color: hintColor }}>
              {loading
                ? "Please wait while we confirm your payment..."
                : isSuccess
                ? "Your subscription has been activated successfully!"
                : interpretedStatus === "failed"
                ? "We could not confirm your payment. If you were charged, please contact support with your transaction reference."
                : "We are still waiting for confirmation from the provider. This usually takes a few seconds."}
            </p>
            {isSuccess && !loading && (
              <p className="text-sm mt-4" style={{ color: hintColor }}>
                Redirecting you back to the mini-app in a few seconds...
              </p>
            )}
          </div>
          {checkoutStatus?.provider && (
            <div
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: hintColor }}
            >
              Provider: {checkoutStatus.provider}
            </div>
          )}
          {checkoutStatus?.payment?.providerReference && (
            <div
              className="rounded-xl px-4 py-2 text-xs"
              style={{
                backgroundColor: `${hintColor}1a`,
                color: hintColor,
              }}
            >
              Reference: {checkoutStatus.payment.providerReference}
            </div>
          )}
          {error && (
            <div
              className="w-full rounded-2xl px-4 py-3 text-sm"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#fecaca",
              }}
            >
              {error}
            </div>
          )}
          {txRef && (
            <div className="text-xs" style={{ color: hintColor }}>
              Transaction Reference: {txRef}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={null}>
      <PaymentReturnPageInner />
    </Suspense>
  );
}
