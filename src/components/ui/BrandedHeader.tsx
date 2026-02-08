"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Building2, Shield, GraduationCap, Loader2 } from "lucide-react";
import { useBranding } from "@/lib/branding-context";

interface SchoolBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface BrandedHeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  variant?: "default" | "admin" | "teacher" | "controller";
}

export const BrandedHeader = React.memo(function BrandedHeader({
  title,
  subtitle,
  showLogo = true,
  variant = "default",
}: BrandedHeaderProps) {
  const params = useParams();
  const schoolSlug = params?.slug as string | undefined;

  // Use the branding context if available, otherwise use defaults
  // This allows the component to work on pages without BrandingProvider
  let branding = null;
  let loading = false;

  try {
    const brandingContext = useBranding();
    branding = brandingContext.branding;
    loading = brandingContext.loading;
  } catch (error) {
    // BrandingProvider not available, use defaults
    branding = null;
    loading = false;
  }

  const variantConfig = {
    default: {
      icon: GraduationCap,
      gradient: "from-indigo-600 to-purple-600",
      bgGradient: "from-indigo-50 to-purple-50",
    },
    admin: {
      icon: Shield,
      gradient: "from-blue-600 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
    },
    teacher: {
      icon: GraduationCap,
      gradient: "from-purple-600 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50",
    },
    controller: {
      icon: Building2,
      gradient: "from-indigo-600 to-blue-600",
      bgGradient: "from-indigo-50 to-blue-50",
    },
  };

  // Use custom branding if available, otherwise fall back to variant defaults
  const primaryColor = branding?.primaryColor || "#4F46E5";
  const secondaryColor = branding?.secondaryColor || "#7C3AED";
  const accentColor = branding?.accentColor;
  const logoUrl = branding?.logoUrl;

  console.log('🎨 BrandedHeader: Using colors:', { primaryColor, secondaryColor, accentColor, logoUrl });

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <header
      className="border-b border-gray-200/50 backdrop-blur-sm sticky top-0 z-40 shadow-sm"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}10 100%)`,
      }}
    >
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="flex items-center space-x-4">
            {showLogo && (
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-lg bg-white/80 p-1.5 shadow-sm group-hover:shadow-md transition-shadow">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="School Logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  ) : loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <Image
                      src="https://darelkubra.com/wp-content/uploads/2024/06/cropped-ዳሩል-ሎጎ-150x150.png"
                      alt="Darulkubra Logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  )}
                </div>
                <div className="hidden sm:block">
                  <h1
                    className="text-lg lg:text-xl font-bold bg-clip-text text-transparent"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }}
                  >
                    {title || "School Management"}
                  </h1>
                  {subtitle && (
                    <p className="text-xs text-gray-600">{subtitle}</p>
                  )}
                </div>
              </Link>
            )}
            {!showLogo && (
              <div className="flex items-center space-x-3">
                <div
                  className="p-2 rounded-lg text-white shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
                </div>
                <div>
                  <h1
                    className="text-lg lg:text-xl font-bold bg-clip-text text-transparent"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }}
                  >
                    {title || "Dashboard"}
                  </h1>
                  {subtitle && (
                    <p className="text-xs text-gray-600">{subtitle}</p>
                  )}
                </div>
              </div>
            )}
            {schoolSlug && (
              <span
                className="hidden sm:inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shadow-sm"
                style={{
                  backgroundColor: `${primaryColor}20`,
                  borderColor: `${primaryColor}40`,
                  color: primaryColor,
                }}
              >
                {schoolSlug}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});
