"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  GraduationCap,
  FileText,
  Settings,
  Eye,
  Lock,
  Star,
  CheckCircle,
  XCircle,
  Crown,
  Zap
} from "lucide-react";

// Mock school data for demonstration
const mockSchools = {
  trial: {
    id: "trial-school",
    name: "Trial School",
    plan: { tier: "trial", name: "Trial Plan", price: 0 }
  },
  basic: {
    id: "basic-school",
    name: "Basic School",
    plan: { tier: "basic", name: "Basic Plan", price: 29 }
  },
  professional: {
    id: "pro-school",
    name: "Professional School",
    plan: { tier: "professional", name: "Professional Plan", price: 99 }
  },
  enterprise: {
    id: "enterprise-school",
    name: "Enterprise School",
    plan: { tier: "enterprise", name: "Enterprise Plan", price: 299 }
  }
};

const allFeatures = {
  student_management: {
    name: "Student Management",
    description: "Basic student CRUD operations",
    icon: Users,
    category: "core"
  },
  teacher_management: {
    name: "Teacher Management",
    description: "Basic teacher profiles and assignments",
    icon: GraduationCap,
    category: "core"
  },
  basic_reporting: {
    name: "Basic Reporting",
    description: "Simple reports and statistics",
    icon: FileText,
    category: "core"
  },
  school_settings: {
    name: "School Settings",
    description: "Basic school configuration",
    icon: Settings,
    category: "core"
  },
  dashboard_basic: {
    name: "Basic Dashboard",
    description: "Overview and key metrics",
    icon: Eye,
    category: "core"
  },
  teacher_payment: {
    name: "Teacher Payment Management",
    description: "Automated salary calculations",
    icon: Crown,
    category: "premium"
  },
  student_mini_app: {
    name: "Student Mini App Features",
    description: "Interactive student engagement",
    icon: Zap,
    category: "premium"
  },
  advanced_analytics: {
    name: "Advanced Analytics",
    description: "Comprehensive analytics dashboard",
    icon: FileText,
    category: "premium"
  }
};

export function FeatureGatingDemo() {
  const [currentSchool, setCurrentSchool] = useState("trial");
  const [premiumFeatures, setPremiumFeatures] = useState<string[]>([
    "teacher_payment", // Default premium features
    "student_mini_app"
  ]);

  const school = mockSchools[currentSchool as keyof typeof mockSchools];

  const getFeatureAccess = (featureCode: string) => {
    const isPremium = premiumFeatures.includes(featureCode);
    const schoolTier = school.plan.tier;

    if (!isPremium) {
      // Core feature - always available
      return { access: true, type: "core", reason: "Always available" };
    }

    // Premium feature - check subscription
    if (schoolTier === "trial" || schoolTier === "basic") {
      return {
        access: false,
        type: "premium",
        reason: `Requires ${schoolTier === "trial" ? "Professional" : "Enterprise"} plan`
      };
    }

    if (featureCode === "advanced_analytics" && schoolTier !== "enterprise") {
      return { access: false, type: "premium", reason: "Requires Enterprise plan" };
    }

    return { access: true, type: "premium", reason: "Included in plan" };
  };

  const togglePremiumFeature = (featureCode: string, isPremium: boolean) => {
    if (isPremium) {
      setPremiumFeatures(prev => [...prev, featureCode]);
    } else {
      setPremiumFeatures(prev => prev.filter(code => code !== featureCode));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto p-6 space-y-8"
    >
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Dynamic Feature Gating Demo
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Everything starts as <strong className="text-green-600">CORE</strong> (free to all).
          Admins dynamically select which features become <strong className="text-purple-600">PREMIUM</strong>.
        </p>
      </div>

      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="demo">Live Demo</TabsTrigger>
          <TabsTrigger value="admin">Admin Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-6">
          {/* School Selector */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Current School: {school.name}</h3>
                <p className="text-sm text-gray-600">
                  Plan: <Badge variant="outline" className="ml-1">
                    {school.plan.name} (${school.plan.price}/mo)
                  </Badge>
                </p>
              </div>
              <div className="flex space-x-2">
                {Object.entries(mockSchools).map(([key, schoolData]) => (
                  <Button
                    key={key}
                    variant={currentSchool === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentSchool(key)}
                  >
                    {schoolData.plan.name}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(allFeatures).map(([code, feature]) => {
              const access = getFeatureAccess(code);
              const Icon = feature.icon;

              return (
                <motion.div
                  key={code}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`relative overflow-hidden transition-all duration-300 ${
                    access.access
                      ? 'border-green-200 bg-green-50/50'
                      : 'border-red-200 bg-red-50/50'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-6 h-6 ${
                            access.access ? 'text-green-600' : 'text-red-600'
                          }`} />
                          <CardTitle className="text-lg">{feature.name}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          {premiumFeatures.includes(code) && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                          {access.access ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{feature.description}</p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Status:</span>
                          <Badge
                            variant={access.access ? "default" : "secondary"}
                            className={access.access ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {access.access ? "Available" : "Locked"}
                          </Badge>
                        </div>

                        {!access.access && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            {access.reason}
                          </div>
                        )}

                        {access.access && (
                          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                            {access.reason}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Premium Feature Management</span>
              </CardTitle>
              <CardDescription>
                Toggle which features require premium subscriptions. Everything starts as CORE by default.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {Object.entries(allFeatures).map(([code, feature]) => {
                const Icon = feature.icon;
                const isPremium = premiumFeatures.includes(code);

                return (
                  <div
                    key={code}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                      isPremium ? 'border-purple-200 bg-purple-50/50' : 'border-green-200 bg-green-50/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${
                        isPremium ? 'text-purple-600' : 'text-green-600'
                      }`} />
                      <div>
                        <h4 className="font-medium">{feature.name}</h4>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Badge
                        variant={isPremium ? "secondary" : "outline"}
                        className={isPremium ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"}
                      >
                        {isPremium ? "Premium" : "Core"}
                      </Badge>
                      <Switch
                        checked={isPremium}
                        onCheckedChange={(checked) => togglePremiumFeature(code, checked)}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-700">🟢 Core Features (Always Free)</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Available to ALL schools by default</li>
                    <li>• No subscription required</li>
                    <li>• Basic functionality everyone needs</li>
                    <li>• Cannot be made premium</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-purple-700">💎 Premium Features (Gated)</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Selected by admin from available features</li>
                    <li>• Require Professional+ subscription</li>
                    <li>• Can be toggled on/off dynamically</li>
                    <li>• Can become core again later</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

