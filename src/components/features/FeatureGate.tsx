"use client";

import { ReactNode } from 'react';
import { useFeatureGate } from '@/lib/features/use-features';
import { FeatureCode } from '@/lib/features/hybrid-feature-gate';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UpgradePrompt } from './UpgradePrompt';
import { DisabledFeature } from './DisabledFeature';
import { LimitedFeature } from './LimitedFeature';

/**
 * Generic Feature Gate - Works with any feature code (dynamic)
 *
 * USAGE:
 * 1. Import: import { GenericFeatureGate } from '@/components/features';
 * 2. Wrap: <GenericFeatureGate feature="your_feature_code">content</GenericFeatureGate>
 * 3. Feature must exist in database via /super-admin/dynamic-features
 *
 * EXAMPLES:
 *
 * // Basic usage
 * <GenericFeatureGate feature="ai_assistant">
 *   <AIAssistantComponent />
 * </GenericFeatureGate>
 *
 * // Hide when no access
 * <GenericFeatureGate feature="advanced_reports" fallback="hide">
 *   <ReportsButton />
 * </GenericFeatureGate>
 *
 * // Custom fallback component
 * <GenericFeatureGate feature="custom_dashboard" fallback={<CustomUpgrade />}>
 *   <Dashboard />
 * </GenericFeatureGate>
 */
export function GenericFeatureGate({
  feature,
  children,
  fallback = 'upgrade',
}: {
  feature: string;
  children: ReactNode;
  fallback?: 'hide' | 'disabled' | 'limited' | 'upgrade' | ReactNode;
}) {
  const { canAccess, isLoading } = useFeatureGate(feature as FeatureCode);

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner size="sm" />;
  }

  // Feature is accessible
  if (canAccess) {
    return <>{children}</>;
  }

  // Feature not accessible - handle fallback
  if (typeof fallback === 'string') {
    switch (fallback) {
      case 'hide':
        return null;

      case 'upgrade':
        return <UpgradePrompt feature={feature} />;

      case 'disabled':
        return <DisabledFeature feature={feature as FeatureCode}>{children}</DisabledFeature>;

      case 'limited':
        return <LimitedFeature feature={feature as FeatureCode}>{children}</LimitedFeature>;

      default:
        return <UpgradePrompt feature={feature} />;
    }
  }

  // Custom fallback component
  return <>{fallback}</>;
}

interface FeatureGateProps {
  feature: FeatureCode;
  children: ReactNode;
  fallback?: 'hide' | 'disabled' | 'limited' | 'upgrade' | ReactNode;
  loading?: ReactNode;
}

/**
 * FeatureGate component - Conditionally renders children based on feature access
 */
export function FeatureGate({
  feature,
  children,
  fallback = 'upgrade',
  loading
}: FeatureGateProps) {

  const { canAccess, isLoading, fallback: featureFallback } = useFeatureGate(feature);

  // Show loading state
  if (isLoading) {
    return loading || <LoadingSpinner size="sm" />;
  }

  // Feature is accessible
  if (canAccess) {
    return <>{children}</>;
  }

  // Feature not accessible - handle fallback
  if (typeof fallback === 'string') {
    switch (fallback) {
      case 'hide':
        return null;

      case 'upgrade':
        return <UpgradePrompt feature={feature} />;

      case 'disabled':
        return <DisabledFeature feature={feature}>{children}</DisabledFeature>;

      case 'limited':
        return <LimitedFeature feature={feature}>{children}</LimitedFeature>;

      default:
        return <UpgradePrompt feature={feature} />;
    }
  }

  // Custom fallback component
  return <>{fallback}</>;
}

interface PermissiveNavItemProps {
  feature: FeatureCode;
  to: string;
  label: string;
  fallback?: ReactNode;
  className?: string;
}

/**
 * Navigation item that conditionally renders based on feature access
 */
export function PermissiveNavItem({
  feature,
  to,
  label,
  fallback,
  className = ''
}: PermissiveNavItemProps) {

  const { canAccess } = useFeatureGate(feature);

  if (canAccess) {
    return (
      <a href={to} className={className}>
        {label}
      </a>
    );
  }

  return fallback || null;
}

interface FeatureBadgeProps {
  feature: FeatureCode;
  className?: string;
}

/**
 * Badge showing feature status (Core/Premium)
 */
export function FeatureBadge({ feature, className = '' }: FeatureBadgeProps) {
  const { isCore, isPremium } = useFeatureGate(feature);

  if (isCore) {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ${className}`}>
        Core
      </span>
    );
  }

  if (isPremium) {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${className}`}>
        Premium
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 ${className}`}>
      Upgrade Required
    </span>
  );
}





