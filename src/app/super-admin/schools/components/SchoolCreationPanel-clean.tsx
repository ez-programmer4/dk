"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Palette,
  Settings,
  Shield,
  Globe,
  Zap,
  Save,
  Eye,
  EyeOff,
  Receipt,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  slug: string;
  baseSalaryPerStudent: number;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  planFeatures: Array<{
    id: string;
    price: number;
    isEnabled: boolean;
    feature: {
      id: string;
      name: string;
      description?: string;
      code: string;
      isCore: boolean;
    };
  }>;
}

interface Feature {
  id: string;
  name: string;
  description?: string;
  code: string;
  isCore: boolean;
  isActive: boolean;
}

interface SchoolCreationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface NewSchool {
  // Basic Information
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;

  // Pricing Plan
  pricingPlanId: string;
  enabledFeatures: Record<string, boolean>;

  // Branding
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;

  // Configuration
  timezone: string;
  defaultCurrency: string;
  defaultLanguage: string;

  // Features
  features: {
    zoom: boolean;
    analytics: boolean;
    reports: boolean;
    notifications: boolean;
    integrations: boolean;
    apiAccess: boolean;
    customDomain: boolean;
    telegramBot: boolean;
    mobileApp: boolean;
    multiLanguage: boolean;
  };

  // Admin Details
  adminName: string;
  adminUsername: string;
  adminPhone: string;
  adminPassword: string;
  adminConfirmPassword: string;
}

const initialSchoolState: NewSchool = {
  // Basic Information
  name: "",
  slug: "",
  email: "",
  phone: "",
  address: "",

  // Pricing Plan
  pricingPlanId: "",
  enabledFeatures: {},

  // Branding
  logoUrl: "",
  primaryColor: "#3B82F6",
  secondaryColor: "#1F2937",

  // Configuration
  timezone: "Africa/Addis_Ababa",
  defaultCurrency: "ETB",
  defaultLanguage: "en",

  // Features
  features: {
    zoom: true,
    analytics: true,
    reports: true,
    notifications: true,
    integrations: false,
    apiAccess: false,
    customDomain: false,
    telegramBot: true,
    mobileApp: false,
    multiLanguage: false,
  },

  // Admin Details
  adminName: "",
  adminUsername: "",
  adminPhone: "",
  adminPassword: "",
  adminConfirmPassword: "",
};

const timezones = [
  { value: "Africa/Addis_Ababa", label: "East Africa Time (UTC+3)" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (UTC-5)" },
  { value: "Europe/London", label: "GMT (UTC+0)" },
  { value: "Asia/Dubai", label: "Gulf Time (UTC+4)" },
];

const currencies = [
  { value: "ETB", label: "ETB - Ethiopian Birr" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "am", label: "አማርኛ (Amharic)" },
  { value: "ar", label: "العربية (Arabic)" },
  { value: "ti", label: "ትግርኛ (Tigrinya)" },
];

export function SchoolCreationPanel({ isOpen, onClose, onSuccess }: SchoolCreationPanelProps) {
  const [newSchool, setNewSchool] = useState<NewSchool>(initialSchoolState);
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Pricing state
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);

  // Fetch pricing plans and features on mount
  useEffect(() => {
    fetchPricingPlans();
    fetchFeatures();
  }, []);

  const fetchPricingPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await fetch("/api/super-admin/pricing/plans");
      const data = await response.json();
      if (data.success) {
        setPricingPlans(data.plans);
        // Auto-select default plan if available
        const defaultPlan = data.plans.find((plan: PricingPlan) => plan.isDefault);
        if (defaultPlan) {
          handlePlanSelection(defaultPlan);
        }
      }
    } catch (error) {
      console.error("Failed to fetch pricing plans:", error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchFeatures = async () => {
    try {
      const response = await fetch("/api/super-admin/pricing/features");
      const data = await response.json();
      if (data.success) {
        setFeatures(data.features);
      }
    } catch (error) {
      console.error("Failed to fetch features:", error);
    }
  };

  const handlePlanSelection = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setNewSchool(prev => ({
      ...prev,
      pricingPlanId: plan.id,
      enabledFeatures: {}, // Reset feature overrides when changing plan
    }));
  };

  const handlePricingFeatureToggle = (featureCode: string, enabled: boolean) => {
    setNewSchool(prev => ({
      ...prev,
      enabledFeatures: {
        ...prev.enabledFeatures,
        [featureCode]: enabled,
      },
    }));
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setNewSchool({ ...newSchool, name, slug });
    checkSlugAvailability(slug);
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }
    setSlugChecking(true);
    try {
      const response = await fetch(`/api/super-admin/schools/check-slug?slug=${slug}`);
      const data = await response.json();
      setSlugAvailable(data.available);
    } catch (error) {
      setSlugAvailable(null);
    } finally {
      setSlugChecking(false);
    }
  };

  const validateCurrentTab = (tab: string): boolean => {
    switch (tab) {
      case "basic":
        return !!(newSchool.name && newSchool.slug && newSchool.email && slugAvailable !== false);
      case "pricing":
        return !!newSchool.pricingPlanId; // Must select an existing pricing plan
      case "branding":
        return true; // Optional fields
      case "configuration":
        return true; // Has defaults
      case "features":
        return true; // Has defaults
      case "admin":
        return !!(
          newSchool.adminName &&
          newSchool.adminUsername &&
          newSchool.adminPassword &&
          newSchool.adminPassword === newSchool.adminConfirmPassword
        );
      default:
        return false;
    }
  };

  const isTabValid = (tab: string) => validateCurrentTab(tab);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all tabs
    const tabs = ["basic", "pricing", "branding", "configuration", "features", "admin"];
    for (const tab of tabs) {
      if (!validateCurrentTab(tab)) {
        setActiveTab(tab);
        setError(`Please complete the ${tab} information`);
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/super-admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSchool),
      });

      if (response.ok) {
        setNewSchool(initialSchoolState);
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create school");
      }
    } catch (error) {
      setError("An error occurred while creating the school");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-gray-900">Create New School</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger
                      value="basic"
                      className={`flex items-center space-x-2 ${isTabValid("basic") ? "text-green-600" : ""}`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Basic</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="pricing"
                      className={`flex items-center space-x-2 ${isTabValid("pricing") ? "text-green-600" : ""}`}
                    >
                      <Receipt className="w-4 h-4" />
                      <span className="hidden sm:inline">Pricing</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="branding"
                      className={`flex items-center space-x-2 ${isTabValid("branding") ? "text-green-600" : ""}`}
                    >
                      <Palette className="w-4 h-4" />
                      <span className="hidden sm:inline">Branding</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="configuration"
                      className={`flex items-center space-x-2 ${isTabValid("configuration") ? "text-green-600" : ""}`}
                    >
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">Config</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="features"
                      className={`flex items-center space-x-2 ${isTabValid("features") ? "text-green-600" : ""}`}
                    >
                      <Zap className="w-4 h-4" />
                      <span className="hidden sm:inline">Features</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="admin"
                      className={`flex items-center space-x-2 ${isTabValid("admin") ? "text-green-600" : ""}`}
                    >
                      <Shield className="w-4 h-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Basic Information Tab */}
                  <TabsContent value="basic" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Building2 className="w-5 h-5 text-indigo-600" />
                          <span>Basic School Information</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">School Name *</Label>
                            <Input
                              id="name"
                              value={newSchool.name}
                              onChange={(e) => handleNameChange(e.target.value)}
                              placeholder="Enter school name"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="slug">School Slug *</Label>
                            <div className="relative">
                              <Input
                                id="slug"
                                value={newSchool.slug}
                                onChange={(e) => {
                                  const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                                  setNewSchool({ ...newSchool, slug });
                                  checkSlugAvailability(slug);
                                }}
                                placeholder="school-slug"
                                required
                              />
                              {slugChecking && (
                                <div className="absolute right-3 top-3">
                                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                </div>
                              )}
                              {slugAvailable !== null && !slugChecking && (
                                <div className="absolute right-3 top-3">
                                  {slugAvailable ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                              )}
                            </div>
                            {slugAvailable === false && (
                              <p className="text-sm text-red-500">This slug is already taken</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={newSchool.email}
                              onChange={(e) => setNewSchool({ ...newSchool, email: e.target.value })}
                              placeholder="school@example.com"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              value={newSchool.phone}
                              onChange={(e) => setNewSchool({ ...newSchool, phone: e.target.value })}
                              placeholder="+251911111111"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address">School Address</Label>
                          <Textarea
                            id="address"
                            value={newSchool.address}
                            onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                            placeholder="Complete school address"
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Pricing Tab */}
                  <TabsContent value="pricing" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Receipt className="w-5 h-5 text-green-600" />
                          <span>Pricing Plan Selection</span>
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          Choose a pricing plan for this school
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <Label>Select Pricing Plan</Label>
                          {loadingPlans ? (
                            <div className="text-center py-8">
                              <Calculator className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
                              <p className="text-gray-600">Loading pricing plans...</p>
                            </div>
                          ) : pricingPlans.length === 0 ? (
                            <div className="text-center py-8">
                              <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No Pricing Plans Available
                              </h3>
                              <p className="text-gray-600">
                                Please create pricing plans first in the Pricing management section.
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {pricingPlans
                                .filter(plan => plan.isActive)
                                .map((plan) => (
                                  <div
                                    key={plan.id}
                                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                      selectedPlan?.id === plan.id
                                        ? "border-green-500 bg-green-50"
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                                    onClick={() => handlePlanSelection(plan)}
                                  >
                                    {plan.isDefault && (
                                      <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-white">
                                        Default
                                      </Badge>
                                    )}
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-semibold text-lg">{plan.name}</h4>
                                      {selectedPlan?.id === plan.id && (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                      )}
                                    </div>
                                    {plan.description && (
                                      <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                                    )}
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Base Price:</span>
                                        <span className="font-semibold">
                                          {plan.currency} {plan.baseSalaryPerStudent} / student
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {plan.planFeatures.length} features included
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        {selectedPlan && (
                          <div className="space-y-4">
                            <Label>Plan Details & Feature Configuration</Label>
                            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                              <h4 className="font-medium mb-2">
                                {selectedPlan.name} Plan
                              </h4>
                              <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                  <span>Base Price per Student:</span>
                                  <span className="font-semibold">
                                    {selectedPlan.currency} {selectedPlan.baseSalaryPerStudent}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600">
                                  Total cost will be calculated based on active student count
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h5 className="text-sm font-medium">Features:</h5>
                                {selectedPlan.planFeatures.map((planFeature) => (
                                  <div
                                    key={planFeature.id}
                                    className="flex items-center justify-between py-2 px-3 bg-white rounded border"
                                  >
                                    <div>
                                      <div className="text-sm font-medium">
                                        {planFeature.feature.name}
                                      </div>
                                      {planFeature.feature.description && (
                                        <div className="text-xs text-gray-600">
                                          {planFeature.feature.description}
                                        </div>
                                      )}
                                      {planFeature.price > 0 && (
                                        <div className="text-xs text-green-600 font-medium">
                                          +{selectedPlan.currency} {planFeature.price}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {planFeature.feature.isCore && (
                                        <Badge variant="outline" className="text-xs">
                                          Core
                                        </Badge>
                                      )}
                                      <Switch
                                        checked={
                                          newSchool.enabledFeatures[planFeature.feature.code] !== undefined
                                            ? newSchool.enabledFeatures[planFeature.feature.code]
                                            : planFeature.isEnabled
                                        }
                                        onCheckedChange={(checked) =>
                                          handlePricingFeatureToggle(planFeature.feature.code, checked)
                                        }
                                        disabled={planFeature.feature.isCore}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Other tabs would go here - keeping it simple for now */}
                  <TabsContent value="branding" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Branding</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">Branding configuration will be implemented here.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="configuration" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">System configuration will be implemented here.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="features" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Features</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">Platform features will be implemented here.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="admin" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Administrator</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">Admin account creation will be implemented here.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating School...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create School
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

