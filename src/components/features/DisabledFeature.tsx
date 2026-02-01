"use client";

import { ReactNode } from 'react';
import { FEATURE_REGISTRY, type PremiumFeature } from '@/lib/features/feature-registry';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DisabledFeatureProps {
  feature: PremiumFeature;
  children: ReactNode;
  showOverlay?: boolean;
  showMessage?: boolean;
  className?: string;
}

/**
 * Shows feature as disabled with overlay or visual indicators
 */
export function DisabledFeature({
  feature,
  children,
  showOverlay = true,
  showMessage = true,
  className = ''
}: DisabledFeatureProps) {

  const featureInfo = FEATURE_REGISTRY[feature];

  if (showOverlay) {
    return (
      <div className={`relative ${className}`}>
        {/* Disabled content with overlay */}
        <div className="relative opacity-50 pointer-events-none select-none">
          {children}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="text-center p-6 max-w-sm">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-gray-400" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {featureInfo?.name || 'Feature'} Unavailable
            </h3>

            {showMessage && featureInfo && (
              <p className="text-gray-600 text-sm mb-4">
                {featureInfo.description}
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              disabled
              className="opacity-50 cursor-not-allowed"
            >
              Upgrade Required
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Alternative: Show with visual indicators but allow interaction
  return (
    <div className={`relative ${className}`}>
      {children}

      {/* Corner badge */}
      <div className="absolute top-2 right-2 z-10">
        <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
          <Lock className="w-3 h-3" />
          <span>Locked</span>
        </div>
      </div>

      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-gray-900/5 pointer-events-none rounded-lg"></div>
    </div>
  );
}

interface FeatureTeaserProps {
  feature: PremiumFeature;
  teaserText?: string;
  className?: string;
}

/**
 * Shows a teaser/sneak peek of the feature
 */
export function FeatureTeaser({
  feature,
  teaserText,
  className = ''
}: FeatureTeaserProps) {

  const featureInfo = FEATURE_REGISTRY[feature];

  return (
    <div className={`p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
          <Eye className="w-4 h-4 text-gray-500" />
        </div>

        <div className="flex-1">
          <h4 className="font-medium text-gray-900">
            {featureInfo?.name || 'Premium Feature'}
          </h4>
          <p className="text-sm text-gray-600">
            {teaserText || featureInfo?.description || 'Unlock this feature with a premium plan'}
          </p>
        </div>

        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
          <EyeOff className="w-4 h-4 mr-1" />
          Preview
        </Button>
      </div>
    </div>
  );
}






