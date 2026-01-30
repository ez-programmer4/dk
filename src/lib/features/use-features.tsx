"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { HybridFeatureGate, type FeatureCode, type FeatureAccessResult } from './hybrid-feature-gate';

// Context for school information
interface SchoolContextType {
  schoolId: string | null;
  subscription: {
    plan: { tier: string; name: string };
    status: string;
  } | null;
}

const SchoolContext = createContext<SchoolContextType>({
  schoolId: null,
  subscription: null
});

export function SchoolProvider({
  children,
  schoolId,
  subscription
}: {
  children: ReactNode;
  schoolId: string;
  subscription: any;
}) {
  return (
    <SchoolContext.Provider value={{ schoolId, subscription }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchoolContext(): SchoolContextType {
  const context = useContext(SchoolContext);
  if (!context.schoolId) {
    console.warn('useSchoolContext used outside SchoolProvider or without schoolId');
  }
  return context;
}

// Hook for checking single feature access
export function useFeature(featureCode: FeatureCode): FeatureAccessResult & { loading: boolean } {
  const { schoolId } = useSchoolContext();
  const [result, setResult] = useState<FeatureAccessResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    HybridFeatureGate.evaluateFeatureAccess(featureCode, { schoolId })
      .then(setResult)
      .catch(error => {
        console.error(`Error checking feature access for ${featureCode}:`, error);
        setResult({
          access: 'denied',
          type: 'core',
          reason: 'system_error'
        });
      })
      .finally(() => setLoading(false));
  }, [featureCode, schoolId]);

  return {
    loading,
    ...(result || {
      access: 'denied' as const,
      type: 'core' as const,
      reason: 'loading'
    })
  };
}

// Hook for checking multiple features
export function useFeatures(featureCodes: FeatureCode[]): Record<FeatureCode, FeatureAccessResult & { loading: boolean }> {
  const { schoolId } = useSchoolContext();
  const [results, setResults] = useState<Record<FeatureCode, FeatureAccessResult & { loading: boolean }>>({});

  useEffect(() => {
    if (!schoolId) return;

    const loadFeatures = async () => {
      const featureResults: Record<FeatureCode, FeatureAccessResult & { loading: boolean }> = {};

      await Promise.all(
        featureCodes.map(async (code) => {
          try {
            const result = await HybridFeatureGate.evaluateFeatureAccess(code, { schoolId });
            featureResults[code] = { ...result, loading: false };
          } catch (error) {
            console.error(`Error checking feature access for ${code}:`, error);
            featureResults[code] = {
              access: 'denied',
              type: 'core',
              reason: 'system_error',
              loading: false
            };
          }
        })
      );

      setResults(featureResults);
    };

    loadFeatures();
  }, [featureCodes, schoolId]);

  // Initialize with loading state
  const initialResults = featureCodes.reduce((acc, code) => {
    acc[code] = results[code] || { loading: true, access: 'denied' as const, type: 'core' as const, reason: 'loading' };
    return acc;
  }, {} as Record<FeatureCode, FeatureAccessResult & { loading: boolean }>);

  return { ...initialResults, ...results };
}

// Hook for getting all available features
export function useAvailableFeatures(): { features: FeatureCode[]; loading: boolean } {
  const { schoolId } = useSchoolContext();
  const [features, setFeatures] = useState<FeatureCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    HybridFeatureGate.getAvailableFeatures(schoolId)
      .then(setFeatures)
      .catch(error => {
        console.error('Error loading available features:', error);
        setFeatures([]);
      })
      .finally(() => setLoading(false));
  }, [schoolId]);

  return { features, loading };
}

// Hook for getting features that require upgrade
export function useUpgradeRequiredFeatures(): { features: FeatureCode[]; loading: boolean } {
  const { schoolId } = useSchoolContext();
  const [features, setFeatures] = useState<FeatureCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    HybridFeatureGate.getUpgradeRequiredFeatures(schoolId)
      .then(setFeatures)
      .catch(error => {
        console.error('Error loading upgrade required features:', error);
        setFeatures([]);
      })
      .finally(() => setLoading(false));
  }, [schoolId]);

  return { features, loading };
}

// Utility hook for conditional rendering
export function useFeatureGate(featureCode: FeatureCode) {
  const feature = useFeature(featureCode);

  return {
    canAccess: feature.access === 'granted',
    isLoading: feature.loading,
    isCore: feature.type === 'core',
    isPremium: feature.type === 'premium',
    fallback: feature.fallback,
    upgradeOptions: feature.upgradeOptions,
    reason: feature.reason,
    limits: feature.limits
  };
}





