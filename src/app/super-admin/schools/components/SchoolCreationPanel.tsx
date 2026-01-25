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
  adminEmail: string;
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
  adminEmail: "",
  adminPhone: "",
  adminPassword: "",
  adminConfirmPassword: "",
};

const timezones = [
  { value: "Africa/Addis_Ababa", label: "East Africa Time (UTC+3)" },
  { value: "Africa/Cairo", label: "Egypt Standard Time (UTC+2)" },
  { value: "Africa/Lagos", label: "West Africa Time (UTC+1)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC+0)" },
  { value: "Europe/London", label: "Greenwich Mean Time (UTC+0/+1)" },
  { value: "America/New_York", label: "Eastern Time (UTC-5/-4)" },
  { value: "America/Los_Angeles", label: "Pacific Time (UTC-8/-7)" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (UTC+4)" },
  { value: "Asia/Kolkata", label: "India Standard Time (UTC+5:30)" },
  { value: "Asia/Shanghai", label: "China Standard Time (UTC+8)" },
];

const currencies = [
  { value: "ETB", label: "Ethiopian Birr (ETB)" },
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "AED", label: "UAE Dirham (AED)" },
  { value: "SAR", label: "Saudi Riyal (SAR)" },
  { value: "INR", label: "Indian Rupee (INR)" },
  { value: "CNY", label: "Chinese Yuan (CNY)" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "am", label: "አማርኛ (Amharic)" },
  { value: "ar", label: "العربية (Arabic)" },
  { value: "ti", label: "ትግርኛ (Tigrinya)" },
  { value: "om", label: "Oromo" },
  { value: "so", label: "Somali" },
  { value: "fr", label: "Français (French)" },
  { value: "es", label: "Español (Spanish)" },
  { value: "de", label: "Deutsch (German)" },
];

export function SchoolCreationPanel({
  isOpen,
  onClose,
  onSuccess,
}: SchoolCreationPanelProps) {
  const [newSchool, setNewSchool] = useState<NewSchool>(initialSchoolState);
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
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

  const handleFeatureToggle = (feature: keyof NewSchool['features'], value: boolean) => {
    setNewSchool({
      ...newSchool,
      features: {
        ...newSchool.features,
        [feature]: value,
      },
    });
  };

  const validateCurrentTab = (tab: string): boolean => {
    switch (tab) {
      case "basic":
        return !!(newSchool.name && newSchool.slug && newSchool.email && slugAvailable !== false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all tabs
    const tabs = ["basic", "branding", "configuration", "features", "admin"];
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

  const isTabValid = (tab: string) => validateCurrentTab(tab);

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

          {/* Side Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
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

              {/* Content */}
              <div className="flex-1 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
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

                    {/* Branding Tab */}
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

                    {/* Configuration Tab */}
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

                    {/* Features Tab */}
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
                                  onCheckedChange={(checked) => handleFeatureToggle(feature as keyof NewSchool['features'], checked)}
                                />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Admin Tab */}
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
                              <Label htmlFor="adminEmail">Email Address</Label>
                              <Input
                                id="adminEmail"
                                type="email"
                                value={newSchool.adminEmail}
                                onChange={(e) => setNewSchool({ ...newSchool, adminEmail: e.target.value })}
                                placeholder="admin@school.com"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div className="space-y-2">
                              <Label htmlFor="adminPhone">Phone Number</Label>
                              <Input
                                id="adminPhone"
                                value={newSchool.adminPhone}
                                onChange={(e) => setNewSchool({ ...newSchool, adminPhone: e.target.value })}
                                placeholder="+251..."
                              />
                            </div>
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

              {/* Footer */}
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
