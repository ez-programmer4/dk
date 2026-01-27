"use client";

import { ReactNode } from 'react';
import { FEATURE_REGISTRY, type PremiumFeature } from '@/lib/features/feature-registry';
import { useFeatureGate } from '@/lib/features/use-features';
import { AlertTriangle, BarChart3, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LimitedFeatureProps {
  feature: PremiumFeature;
  children: ReactNode;
  limitedFeatures?: string[];
  showUpgrade?: boolean;
  className?: string;
}

/**
 * Shows feature with limited functionality and upgrade prompt
 */
export function LimitedFeature({
  feature,
  children,
  limitedFeatures,
  showUpgrade = true,
  className = ''
}: LimitedFeatureProps) {

  const { upgradeOptions } = useFeatureGate(feature);
  const featureInfo = FEATURE_REGISTRY[feature];

  const recommendedPlan = upgradeOptions?.find(opt => opt.recommended) || upgradeOptions?.[0];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Limited functionality notice */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>

            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900">
                Limited {featureInfo?.name || 'Feature'} Access
              </h4>

              <p className="text-sm text-amber-800 mt-1">
                You're viewing a limited version. Upgrade to access full functionality.
              </p>

              {limitedFeatures && limitedFeatures.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-amber-700 font-medium">Limited features:</p>
                  <ul className="text-xs text-amber-700 mt-1 space-y-1">
                    {limitedFeatures.map((limited, index) => (
                      <li key={index} className="flex items-center space-x-1">
                        <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                        <span>{limited}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {showUpgrade && recommendedPlan && (
                <Button
                  size="sm"
                  onClick={() => console.log(`Upgrade to ${recommendedPlan.plan}`)}
                  className="mt-3 bg-amber-600 hover:bg-amber-700"
                >
                  Upgrade to {recommendedPlan.plan}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limited feature content */}
      <div className="relative">
        {children}

        {/* Watermark overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="transform rotate-12 opacity-10">
            <Badge variant="outline" className="text-lg px-4 py-2 border-2">
              LIMITED VERSION
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LimitedAnalyticsProps {
  className?: string;
}

/**
 * Example: Limited analytics showing only basic metrics
 */
export function LimitedAnalytics({ className = '' }: LimitedAnalyticsProps) {
  return (
    <LimitedFeature
      feature="advanced_analytics"
      limitedFeatures={[
        'Basic metrics only',
        'Last 30 days only',
        'No custom reports',
        'No export functionality'
      ]}
      className={className}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Students</span>
            </div>
            <div className="text-2xl font-bold mt-2">1,234</div>
            <p className="text-xs text-gray-500 mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Attendance</span>
            </div>
            <div className="text-2xl font-bold mt-2">87%</div>
            <p className="text-xs text-gray-500 mt-1">+2% from last month</p>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2"></div>
              <p className="text-xs">Advanced metrics</p>
              <p className="text-xs">available in premium</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </LimitedFeature>
  );
}

