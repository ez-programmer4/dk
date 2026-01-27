"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { UpgradePrompt } from "@/components/features";
import { HybridFeatureGate } from "@/lib/features/hybrid-feature-gate";

interface StudentsPageClientProps {
  schoolSlug: string;
}

export default function StudentsPageClient({ schoolSlug }: StudentsPageClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loadingAccess, setLoadingAccess] = useState(true);

  // Check feature access when session is loaded
  useEffect(() => {
    if (status === 'loading') return;

    let isMounted = true;

    const checkAccess = async () => {
      try {
        if (session?.user?.id) {
          const access = await HybridFeatureGate.evaluateFeatureAccess("student_management", {
            schoolId: schoolSlug,
            userId: session.user.id,
            userRole: "admin"
          });
          if (isMounted) {
            setHasAccess(access.access);
          }
        } else {
          if (isMounted) {
            setHasAccess(false);
          }
        }
      } catch (error) {
        console.error("Error checking access:", error);
        if (isMounted) {
          setHasAccess(false);
        }
      }
      if (isMounted) {
        setLoadingAccess(false);
      }
    };

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, [session, status, schoolSlug]);

  if (loadingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: `linear-gradient(135deg, #4F46E5 08 0%, #7C3AED 05 50%, #ffffff 100%)`,
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500 mx-auto mb-6"></div>
          <p className="text-gray-900 font-medium text-lg">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: `linear-gradient(135deg, #4F46E5 08 0%, #7C3AED 05 50%, #ffffff 100%)`,
      }}>
        <div className="max-w-md mx-auto">
          <UpgradePrompt feature="student_management" />
        </div>
      </div>
    );
  }

  // Import and render the main component only after access is confirmed
  const StudentsPageMain = React.lazy(() => import('./StudentsPageMain'));

  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    }>
      <StudentsPageMain schoolSlug={schoolSlug} />
    </React.Suspense>
  );
}