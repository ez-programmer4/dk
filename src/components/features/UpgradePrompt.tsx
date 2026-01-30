"use client";

import { useFeatureGate } from '@/lib/features/use-features';
import { FEATURE_REGISTRY, type PremiumFeature } from '@/lib/features/feature-registry';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Crown, ArrowRight } from 'lucide-react';

interface UpgradePromptProps {
  feature: PremiumFeature | string;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
  reason?: string;
  upgradeOptions?: string[];
}

/**
 * Upgrade prompt component for premium features
 */
export function UpgradePrompt({
  feature,
  size = 'md',
  showDescription = true,
  className = '',
  reason,
  upgradeOptions
}: UpgradePromptProps) {

  const featureInfo = FEATURE_REGISTRY[feature as PremiumFeature];

  if (!featureInfo || featureInfo.is_core) {
    return null;
  }

  const recommendedPlan = upgradeOptions?.length ? { plan: upgradeOptions[0] } : null;

  const handleUpgrade = (plan: string) => {
    // Navigate to upgrade page or open upgrade modal
    console.log(`Upgrade to ${plan} plan`);
    // TODO: Implement upgrade navigation
  };

  if (size === 'sm') {
    return (
      <div className={`flex items-center space-x-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg ${className}`}>
        <Zap className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-blue-800 font-medium">
            Upgrade to unlock {featureInfo.name}
          </p>
          {upgradeOptions && upgradeOptions.length > 0 && (
            <Button
              size="sm"
              onClick={() => handleUpgrade(upgradeOptions[0])}
              className="mt-2 bg-blue-600 hover:bg-blue-700"
            >
              Upgrade to Enable Feature
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <Card className={`border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 ${className}`}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Crown className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl text-blue-900">
            Unlock {featureInfo.name}
          </CardTitle>
          {showDescription && (
            <p className="text-blue-700 mt-2">
              {featureInfo.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendedPlan && (
            <div className="text-center">
              {upgradeOptions && upgradeOptions.length > 0 && (
                <>
                  <Badge variant="outline" className="mb-4 text-blue-600 border-blue-300">
                    Premium Feature Required
                  </Badge>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Upgrade Options:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {upgradeOptions.map((option, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>{option}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={() => handleUpgrade(upgradeOptions[0])}
                    className="mt-6 w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    Enable Feature
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              )}
            </div>
          )}

          {upgradeOptions && upgradeOptions.length > 1 && (
            <div className="pt-4 border-t border-blue-200">
              <p className="text-sm text-blue-600 text-center">
                Other options: {upgradeOptions.slice(1).join(', ')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default medium size
  return (
    <div className={`p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900">
            Unlock {featureInfo.name}
          </h3>

          {showDescription && (
            <p className="text-blue-700 mt-1">
              {featureInfo.description}
            </p>
          )}

          {upgradeOptions && upgradeOptions.length > 0 && (
            <div className="mt-4 flex items-center space-x-3">
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                Premium Feature
              </Badge>

              <Button
                onClick={() => handleUpgrade(upgradeOptions[0])}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Enable Feature
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}





