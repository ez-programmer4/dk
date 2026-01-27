"use client";

import { useState } from 'react';
import { ALL_FEATURES, type FeatureCode } from '@/lib/features/feature-registry';
import { HybridFeatureGate } from '@/lib/features/hybrid-feature-gate';

type PlanType = 'trial' | 'basic' | 'professional' | 'enterprise';

export default function DemoFeaturesPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('trial');
  const [featureResults, setFeatureResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const mockSchools = {
    trial: { id: 'trial-school', plan: 'trial' },
    basic: { id: 'basic-school', plan: 'basic' },
    professional: { id: 'pro-school', plan: 'professional' },
    enterprise: { id: 'enterprise-school', plan: 'enterprise' }
  };

  const testFeatures = async (plan: PlanType) => {
    setLoading(true);
    const school = mockSchools[plan];
    const results: Record<string, any> = {};

    // Override the getSchoolSubscription method for demo
    HybridFeatureGate.getSchoolSubscription = async () => ({
      plan: { tier: plan, name: `${plan} Plan` },
      status: 'active'
    });

    // Test all features (all start as core, some can be premium)
    for (const feature of Object.keys(ALL_FEATURES) as FeatureCode[]) {
      try {
        const result = await HybridFeatureGate.evaluateFeatureAccess(feature, { schoolId: school.id });
        results[feature] = result;
      } catch (error) {
        results[feature] = { access: 'error', error: error.message };
      }
    }

    setFeatureResults(results);
    setLoading(false);
  };

  const handlePlanChange = (plan: PlanType) => {
    setSelectedPlan(plan);
    testFeatures(plan);
  };

  const getStatusColor = (access: string) => {
    switch (access) {
      case 'granted': return 'text-green-600 bg-green-50 border-green-200';
      case 'denied': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (access: string) => {
    switch (access) {
      case 'granted': return '✅';
      case 'denied': return '🔒';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Hybrid Feature Gating Demo
          </h1>
          <p className="text-gray-600 mb-6">
            Test the feature gating system. Core features are always available, premium features require subscriptions.
          </p>

          {/* Plan Selector */}
          <div className="flex items-center space-x-4 mb-6">
            <label className="text-sm font-medium text-gray-700">
              Select School Plan:
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => handlePlanChange(e.target.value as PlanType)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="trial">Trial (Free)</option>
              <option value="basic">Basic ($29/mo)</option>
              <option value="professional">Professional ($99/mo)</option>
              <option value="enterprise">Enterprise ($299/mo)</option>
            </select>

            <div className="text-sm text-gray-600">
              Current Plan: <strong className="capitalize">{selectedPlan}</strong>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Testing feature access...</p>
            </div>
          )}

          {!loading && Object.keys(featureResults).length > 0 && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              ✅ Feature gating test completed for {selectedPlan} plan
            </div>
          )}
        </div>

        {/* Results Grid */}
        {Object.keys(featureResults).length > 0 && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Core Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-green-700 mb-4 flex items-center">
                <span className="mr-2">🌟</span>
                Core Features (Always Available)
              </h2>
              <div className="space-y-3">
                {Object.entries(ALL_FEATURES).map(([feature, info]) => {
                  const result = featureResults[feature as FeatureCode];
                  const featureInfo = info;

                  return (
                    <div key={feature} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-green-900">{featureInfo?.name}</div>
                        <div className="text-sm text-green-700">{featureInfo?.description}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getStatusIcon(result?.access)}</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {result?.access === 'granted' ? 'Available' : 'Error'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Premium Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center">
                <span className="mr-2">🔒</span>
                Premium Features (Plan Required)
              </h2>
              <div className="space-y-3">
                {Object.entries(ALL_FEATURES).filter(([feature]) => {
                  const result = featureResults[feature as FeatureCode];
                  return result?.type === 'premium';
                }).map(([feature, info]) => {
                  const result = featureResults[feature as FeatureCode];
                  const featureInfo = info;

                  return (
                    <div key={feature} className={`p-3 border-2 rounded-lg ${
                      result?.access === 'granted'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{featureInfo?.name}</div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getStatusIcon(result?.access)}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            result?.access === 'granted'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {result?.access === 'granted' ? 'Available' : 'Locked'}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 mb-2">
                        {featureInfo?.description}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          Requires: {config.required_plans.join(' or ')}
                        </span>
                        {result?.access === 'denied' && result?.upgradeOptions && (
                          <span className="text-blue-600 font-medium">
                            Upgrade needed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Feature Registry Overview */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Feature Registry Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {Object.values(featureResults).filter(r => r?.type === 'core').length}
              </div>
              <div className="text-sm text-green-700">Core Features</div>
              <div className="text-xs text-green-600 mt-1">Always available</div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {Object.values(featureResults).filter(r => r?.type === 'premium').length}
              </div>
              <div className="text-sm text-blue-700">Premium Features</div>
              <div className="text-xs text-blue-600 mt-1">Dynamically gated</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {Object.keys(ALL_FEATURES).length}
              </div>
              <div className="text-sm text-purple-700">Total Features</div>
              <div className="text-xs text-purple-600 mt-1">In system</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureAccessDemo() {
  const featuresToCheck: FeatureCode[] = [
    'student_management',
    'teacher_management',
    'basic_reporting',
    'teacher_payment',
    'student_mini_app',
    'advanced_analytics'
  ];

  const featureStates = useFeatures(featuresToCheck);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feature Access Demonstration</CardTitle>
          <p className="text-sm text-gray-600">
            This shows how features are conditionally available based on subscription plans.
            Core features are always available, premium features require appropriate plans.
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Features - Always Available */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Core Features</span>
              <Badge className="bg-green-100 text-green-800">Always Available</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {['student_management', 'teacher_management', 'basic_reporting'].map(feature => {
              const state = featureStates[feature];
              const featureInfo = ALL_FEATURES[feature as FeatureCode];

              return (
                <div key={feature} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium text-green-900">{featureInfo.name}</div>
                    <div className="text-sm text-green-700">{featureInfo.description}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">✅ Available</Badge>
                    <FeatureBadge feature={feature} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Premium Features - Conditionally Available */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Premium Features</span>
              <Badge className="bg-blue-100 text-blue-800">Plan Required</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {['teacher_payment', 'student_mini_app', 'advanced_analytics'].map(feature => {
              const state = featureStates[feature];
              const featureInfo = ALL_FEATURES[feature as FeatureCode];

              return (
                <div key={feature} className={`p-3 rounded-lg border-2 ${
                  state.access === 'granted'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{featureInfo.name}</div>
                    <div className="flex items-center space-x-2">
                      <Badge className={
                        state.access === 'granted'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }>
                        {state.access === 'granted' ? '✅ Available' : '🔒 Locked'}
                      </Badge>
                      <FeatureBadge feature={feature} />
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-3">
                    {featureInfo.description}
                  </div>

                  {state.access === 'denied' && state.upgradeOptions && (
                    <div className="text-xs text-gray-500">
                      Requires: {state.upgradeOptions.map(opt => opt.plan).join(' or ')}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Feature Gate Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Live Feature Gate Examples</CardTitle>
          <p className="text-sm text-gray-600">
            These components conditionally render based on feature access.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teacher Payment Feature */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Teacher Payment Feature</h4>
              <FeatureGate
                feature="teacher_payment"
                fallback={<div className="text-gray-500 italic">Feature not available</div>}
              >
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-800 font-medium">Teacher Payment System Active</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Full access to salary management, bonuses, and payment processing.
                  </p>
                </div>
              </FeatureGate>
            </div>

            {/* Student Mini App Feature */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Student Mini App Feature</h4>
              <FeatureGate
                feature="student_mini_app"
                fallback="upgrade"
              >
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-800 font-medium">Mini App Features Enabled</span>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    Interactive quizzes, progress tracking, and engagement tools.
                  </p>
                </div>
              </FeatureGate>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureRegistryDemo() {
  const allFeatures = Object.entries(ALL_FEATURES);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Complete Feature Registry</CardTitle>
          <p className="text-sm text-gray-600">
            All features defined in the system with their metadata and requirements.
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allFeatures.map(([code, feature]) => (
          <Card key={code} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{feature.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <FeatureBadge feature={code as FeatureCode} />
                  {feature.is_core && (
                    <Badge className="bg-green-100 text-green-800">Core</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">{feature.description}</p>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <div className="text-gray-600 capitalize">{feature.category}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Business Value:</span>
                  <div className="text-gray-600 capitalize">{feature.business_value}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Development:</span>
                  <div className="text-gray-600 capitalize">{feature.development_cost}</div>
                </div>
                {!feature.is_core && (
                  <div>
                    <span className="font-medium text-gray-700">Required Plans:</span>
                    <div className="text-gray-600">{feature.required_plans?.join(', ') || 'None'}</div>
                  </div>
                )}
              </div>

              {feature.ui_components && feature.ui_components.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700 text-xs">UI Components:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {feature.ui_components.map(comp => (
                      <Badge key={comp} variant="outline" className="text-xs">
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FeatureAnalyticsDemo() {
  const { features: availableFeatures, loading: availableLoading } = useAvailableFeatures();
  const { features: upgradeFeatures, loading: upgradeLoading } = useUpgradeRequiredFeatures();

  if (availableLoading || upgradeLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feature Access Analytics</CardTitle>
          <p className="text-sm text-gray-600">
            Real-time analysis of feature availability for the current school.
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {availableFeatures.length}
            </div>
            <div className="text-sm text-gray-600">Available Features</div>
            <div className="text-xs text-gray-500 mt-1">
              Features you can currently access
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {upgradeFeatures.length}
            </div>
            <div className="text-sm text-gray-600">Premium Features</div>
            <div className="text-xs text-gray-500 mt-1">
              Features requiring upgrade
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {Math.round((availableFeatures.length / Object.keys(ALL_FEATURES).length) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Feature Access Rate</div>
            <div className="text-xs text-gray-500 mt-1">
              Percentage of total features available
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">✅ Available Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableFeatures.map(feature => {
                const info = ALL_FEATURES[feature as FeatureCode];
                return (
                  <div key={feature} className="flex items-center justify-between py-2 px-3 bg-green-50 rounded">
                    <span className="text-sm font-medium text-green-900">{info.name}</span>
                    <FeatureBadge feature={feature} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-orange-700">🔒 Requires Upgrade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upgradeFeatures.map(feature => {
                const info = ALL_FEATURES[feature as FeatureCode];
                return (
                  <div key={feature} className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded">
                    <span className="text-sm font-medium text-orange-900">{info.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {info.required_plans?.join(' or ')}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
