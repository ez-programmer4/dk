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

interface SchoolCreationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface NewSchool {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  pricingPlanId: string;
  enabledFeatures: Record<string, boolean>;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  timezone: string;
  defaultCurrency: string;
  defaultLanguage: string;
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
  adminName: string;
  adminUsername: string;
  adminPhone: string;
  adminPassword: string;
  adminConfirmPassword: string;
}

const initialSchoolState: NewSchool = {
  name: "",
  slug: "",
  email: "",
  phone: "",
  address: "",
  pricingPlanId: "",
  enabledFeatures: {},
  logoUrl: "",
  primaryColor: "#3B82F6",
  secondaryColor: "#1F2937",
  timezone: "Africa/Addis_Ababa",
  defaultCurrency: "ETB",
  defaultLanguage: "en",
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
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await fetch("/api/super-admin/pricing/plans");
      const data = await response.json();
      if (data.success) {
        setPricingPlans(data.plans);
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

  const handlePlanSelection = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setNewSchool(prev => ({
      ...prev,
      pricingPlanId: plan.id,
      enabledFeatures: {},
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
        return !!newSchool.pricingPlanId;
      case "branding":
        return true;
      case "configuration":
        return true;
      case "features":
        return true;
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Create New School</h2>
                    <p className="text-sm text-gray-600">Set up a complete school environment</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 p-6">
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
                        value="branding"
                        className={`flex items-center space-x-2 ${isTabValid("branding") ? "text-green-600" : ""}`}
                      >
                        <Palette className="w-4 h-4" />
                        <span className="hidden sm:inline">Branding</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="pricing"
                        className={`flex items-center space-x-2 ${isTabValid("pricing") ? "text-green-600" : ""}`}
                      >
                        <Receipt className="w-4 h-4" />
                        <span className="hidden sm:inline">Pricing</span>
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
                                placeholder="+251..."
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

                    <TabsContent value="branding" className="space-y-6 mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Palette className="w-5 h-5 text-purple-600" />
                            <span>School Branding</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-2">
                            <Label htmlFor="logoUrl">Logo URL</Label>
                            <Input
                              id="logoUrl"
                              value={newSchool.logoUrl}
                              onChange={(e) => setNewSchool({ ...newSchool, logoUrl: e.target.value })}
                              placeholder="https://example.com/logo.png"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <Label>Primary Color</Label>
                              <div className="flex items-center space-x-4">
                                <input
                                  type="color"
                                  value={newSchool.primaryColor}
                                  onChange={(e) => setNewSchool({ ...newSchool, primaryColor: e.target.value })}
                                  className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                                />
                                <div className="flex-1">
                                  <Input
                                    value={newSchool.primaryColor}
                                    onChange={(e) => setNewSchool({ ...newSchool, primaryColor: e.target.value })}
                                    placeholder="#3B82F6"
                                    className="font-mono"
                                  />
                                </div>
                              </div>
                              <div
                                className="h-8 rounded-md border"
                                style={{ backgroundColor: newSchool.primaryColor }}
                              />
                            </div>

                            <div className="space-y-4">
                              <Label>Secondary Color</Label>
                              <div className="flex items-center space-x-4">
                                <input
                                  type="color"
                                  value={newSchool.secondaryColor}
                                  onChange={(e) => setNewSchool({ ...newSchool, secondaryColor: e.target.value })}
                                  className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                                />
                                <div className="flex-1">
                                  <Input
                                    value={newSchool.secondaryColor}
                                    onChange={(e) => setNewSchool({ ...newSchool, secondaryColor: e.target.value })}
                                    placeholder="#1F2937"
                                    className="font-mono"
                                  />
                                </div>
                              </div>
                              <div
                                className="h-8 rounded-md border"
                                style={{ backgroundColor: newSchool.secondaryColor }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="pricing" className="space-y-6 mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Receipt className="w-5 h-5 text-green-600" />
                            <span>Pricing Plan Selection</span>
                          </CardTitle>
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

                    <TabsContent value="configuration" className="space-y-6 mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Settings className="w-5 h-5 text-blue-600" />
                            <span>System Configuration</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="timezone">Timezone</Label>
                              <Select
                                value={newSchool.timezone}
                                onValueChange={(value) => setNewSchool({ ...newSchool, timezone: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timezones.map((tz) => (
                                    <SelectItem key={tz.value} value={tz.value}>
                                      {tz.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="defaultCurrency">Default Currency</Label>
                              <Select
                                value={newSchool.defaultCurrency}
                                onValueChange={(value) => setNewSchool({ ...newSchool, defaultCurrency: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                  {currencies.map((curr) => (
                                    <SelectItem key={curr.value} value={curr.value}>
                                      {curr.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="defaultLanguage">Default Language</Label>
                            <Select
                              value={newSchool.defaultLanguage}
                              onValueChange={(value) => setNewSchool({ ...newSchool, defaultLanguage: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                              <SelectContent>
                                {languages.map((lang) => (
                                  <SelectItem key={lang.value} value={lang.value}>
                                    {lang.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="features" className="space-y-6 mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Zap className="w-5 h-5 text-yellow-600" />
                            <span>Feature Configuration</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(newSchool.features).map(([feature, enabled]) => (
                              <div key={feature} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                  <Label className="text-sm font-medium capitalize">
                                    {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                  </Label>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {getFeatureDescription(feature)}
                                  </p>
                                </div>
                                <Switch
                                  checked={enabled}
                                  onCheckedChange={(checked) => 
                                    setNewSchool({
                                      ...newSchool,
                                      features: { ...newSchool.features, [feature]: checked }
                                    })
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="admin" className="space-y-6 mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Shield className="w-5 h-5 text-green-600" />
                            <span>Administrator Account</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="adminName">Full Name *</Label>
                              <Input
                                id="adminName"
                                value={newSchool.adminName}
                                onChange={(e) => setNewSchool({ ...newSchool, adminName: e.target.value })}
                                placeholder="John Doe"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="adminUsername">Username *</Label>
                              <Input
                                id="adminUsername"
                                value={newSchool.adminUsername}
                                onChange={(e) => setNewSchool({ ...newSchool, adminUsername: e.target.value })}
                                placeholder="admin_username"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="adminPhone">Phone Number</Label>
                            <Input
                              id="adminPhone"
                              value={newSchool.adminPhone}
                              onChange={(e) => setNewSchool({ ...newSchool, adminPhone: e.target.value })}
                              placeholder="+251..."
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="adminPassword">Password *</Label>
                              <div className="relative">
                                <Input
                                  id="adminPassword"
                                  type={showPassword ? "text" : "password"}
                                  value={newSchool.adminPassword}
                                  onChange={(e) => setNewSchool({ ...newSchool, adminPassword: e.target.value })}
                                  placeholder="••••••••"
                                  required
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="adminConfirmPassword">Confirm Password *</Label>
                              <Input
                                id="adminConfirmPassword"
                                type="password"
                                value={newSchool.adminConfirmPassword}
                                onChange={(e) => setNewSchool({ ...newSchool, adminConfirmPassword: e.target.value })}
                                placeholder="••••••••"
                                required
                              />
                              {newSchool.adminPassword && newSchool.adminConfirmPassword &&
                               newSchool.adminPassword !== newSchool.adminConfirmPassword && (
                                <p className="text-sm text-red-500">Passwords do not match</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>

                  {error && (
                    <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                </form>
              </div>

              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !validateCurrentTab(activeTab)}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
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
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    zoom: "Enable Zoom meeting integration and links",
    analytics: "Access to school analytics and reports",
    reports: "Generate detailed performance reports",
    notifications: "Email and in-app notifications",
    integrations: "Third-party service integrations",
    apiAccess: "REST API access for external systems",
    customDomain: "Custom domain support",
    telegramBot: "Telegram bot integration",
    mobileApp: "Mobile app access",
    multiLanguage: "Multi-language support",
  };
  return descriptions[feature] || "Feature description";
}