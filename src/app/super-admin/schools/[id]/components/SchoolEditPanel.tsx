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
  Save,
  Eye,
  EyeOff,
  Receipt,
  Calculator,
  Plus,
  Trash2,
  History,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusHistory } from "../../components/StatusHistory";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SchoolEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  school: any;
  onSuccess: () => void;
}

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

interface EditSchool {
  // Basic Information
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;

  // Pricing Plan
  enabledFeatures: Record<string, boolean>;

  // Configuration
  timezone: string;
  defaultCurrency: string;
  defaultLanguage: string;

  // Branding
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

export function SchoolEditPanel({ isOpen, onClose, school, onSuccess }: SchoolEditPanelProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editData, setEditData] = useState<EditSchool>({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
    enabledFeatures: {},
    timezone: "Africa/Addis_Ababa",
    defaultCurrency: "ETB",
    defaultLanguage: "en",
    logoUrl: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#1F2937",
  });

  // Pricing state
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [showStatusHistory, setShowStatusHistory] = useState(false);

  // Fetch pricing data on mount
  useEffect(() => {
    fetchPricingPlans();
    fetchFeatures();
  }, []);

  // Set selected plan when school data is available
  useEffect(() => {
    if (school?.subscription?.plan) {
      const currentPlan = school.subscription.plan;
      setSelectedPlan({
        id: currentPlan.id,
        name: currentPlan.name,
        description: currentPlan.description,
        baseSalaryPerStudent: currentPlan.baseSalaryPerStudent,
        currency: currentPlan.currency,
        planFeatures: currentPlan.planFeatures.map(pf => ({
          id: pf.id,
          price: pf.price,
          isEnabled: pf.isEnabled,
          feature: {
            id: pf.feature.id,
            name: pf.feature.name,
            code: pf.feature.code,
            description: pf.feature.description,
            isCore: pf.feature.isCore,
          },
        })),
      });
    }
  }, [school]);

  const fetchPricingPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await fetch("/api/super-admin/pricing/plans");
      const data = await response.json();
      if (data.success) {
        setPricingPlans(data.plans);
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

  // Initialize form data when school changes
  useEffect(() => {
    if (school) {
      setEditData({
        name: school.name || "",
        email: school.email || "",
        phone: school.phone || "",
        address: school.address || "",
        status: school.status || "active",
        enabledFeatures: school.subscription?.enabledFeatures || {},
        timezone: school.timezone || "Africa/Addis_Ababa",
        defaultCurrency: school.defaultCurrency || "ETB",
        defaultLanguage: school.defaultLanguage || "en",
        logoUrl: school.logoUrl || "",
        primaryColor: school.primaryColor || "#3B82F6",
        secondaryColor: school.secondaryColor || "#1F2937",
      });

      // Set selected plan if school has a subscription
      if (school.subscription?.plan) {
        setSelectedPlan(school.subscription.plan);
      }
    }
  }, [school]);

  const steps = [
    { id: "basic", title: "Basic Info", icon: Building2 },
    { id: "pricing", title: "Pricing", icon: Receipt },
    { id: "config", title: "Configuration", icon: Settings },
    { id: "branding", title: "Branding", icon: Palette },
  ];

  const handleUpdate = async () => {
    setUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/schools/${school.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update school");
      }
    } catch (error) {
      console.error("Failed to update school:", error);
      setError("Failed to update school");
    } finally {
      setUpdating(false);
    }
  };

  const validateStep = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Basic Info
        return editData.name.trim() && editData.email.trim();
      case 1: // Configuration
        return true; // Optional fields
      case 2: // Branding
        return true; // Optional fields
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
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
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Edit School</h2>
                <p className="text-slate-600 mt-1">Update school information and settings</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress Indicator */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center space-x-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index <= currentStep
                          ? "bg-slate-900 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {index < currentStep ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-12 h-0.5 mx-2 ${
                          index < currentStep ? "bg-slate-900" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {steps.map((step, index) => (
                  <span
                    key={step.id}
                    className={`text-xs font-medium ${
                      index <= currentStep ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {step.title}
                  </span>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Step 1: Basic Information */}
              {currentStep === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>
                      <p className="text-sm text-slate-600">Update the core school details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name" className="text-sm font-medium text-slate-700">
                        School Name *
                      </Label>
                      <Input
                        id="edit-name"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="rounded-lg border-slate-200 focus:border-slate-400"
                        placeholder="Enter school name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-email" className="text-sm font-medium text-slate-700">
                        Email Address *
                      </Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="rounded-lg border-slate-200 focus:border-slate-400"
                        placeholder="school@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-phone" className="text-sm font-medium text-slate-700">
                        Phone Number
                      </Label>
                      <Input
                        id="edit-phone"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="rounded-lg border-slate-200 focus:border-slate-400"
                        placeholder="+251 XXX XXX XXX"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-address" className="text-sm font-medium text-slate-700">
                        Address
                      </Label>
                      <Textarea
                        id="edit-address"
                        value={editData.address}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        rows={3}
                        className="rounded-lg border-slate-200 focus:border-slate-400"
                        placeholder="Enter school address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-status" className="text-sm font-medium text-slate-700">
                        Status
                      </Label>
                      <Select
                        value={editData.status}
                        onValueChange={(value) => setEditData({ ...editData, status: value })}
                      >
                        <SelectTrigger className="rounded-lg border-slate-200 focus:border-slate-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                              Active
                            </div>
                          </SelectItem>
                          <SelectItem value="inactive">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-amber-500 rounded-full mr-2" />
                              Inactive
                            </div>
                          </SelectItem>
                          <SelectItem value="suspended">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                              Suspended
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Pricing Plan */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Receipt className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Pricing Plan Management</h3>
                        <p className="text-sm text-slate-600">Manage the school's subscription and feature access</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowStatusHistory(true)}
                      className="flex items-center space-x-2"
                    >
                      <History className="w-4 h-4" />
                      <span>View History</span>
                    </Button>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Current Plan</CardTitle>
                      <CardDescription>
                        {selectedPlan ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{selectedPlan.name}</span>
                              <Badge variant="outline">
                                {selectedPlan.currency} {selectedPlan.baseSalaryPerStudent}/student
                              </Badge>
                            </div>
                            {selectedPlan.description && (
                              <p className="text-sm text-gray-600">{selectedPlan.description}</p>
                            )}
                          </div>
                        ) : (
                          "No pricing plan assigned"
                        )}
                      </CardDescription>
                    </CardHeader>
                    {selectedPlan && (
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">Feature Configuration:</h4>
                          {selectedPlan.planFeatures.map((planFeature) => (
                            <div
                              key={planFeature.id}
                              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="text-sm font-medium">
                                  {planFeature.feature.name}
                                </div>
                                {planFeature.feature.description && (
                                  <div className="text-xs text-gray-600">
                                    {planFeature.feature.description}
                                  </div>
                                )}
                                {!planFeature.feature.isCore && planFeature.price > 0 && (
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
                                    editData.enabledFeatures[planFeature.feature.code] !== undefined
                                      ? editData.enabledFeatures[planFeature.feature.code]
                                      : planFeature.isEnabled
                                  }
                                  onCheckedChange={(checked) =>
                                    setEditData(prev => ({
                                      ...prev,
                                      enabledFeatures: {
                                        ...prev.enabledFeatures,
                                        [planFeature.feature.code]: checked,
                                      },
                                    }))
                                  }
                                  disabled={planFeature.feature.isCore}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-800">
                            <strong>Note:</strong> Changes to feature configuration will be applied immediately when you save.
                            The school's billing will be recalculated based on the active student count and enabled features.
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              )}

              {/* Step 2: Configuration */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Settings className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Configuration</h3>
                      <p className="text-sm text-slate-600">Set regional and system preferences</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-timezone" className="text-sm font-medium text-slate-700">
                        Timezone
                      </Label>
                      <Select
                        value={editData.timezone}
                        onValueChange={(value) => setEditData({ ...editData, timezone: value })}
                      >
                        <SelectTrigger className="rounded-lg border-slate-200 focus:border-slate-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Addis_Ababa">East Africa Time (EAT)</SelectItem>
                          <SelectItem value="Africa/Nairobi">East Africa Time (EAT)</SelectItem>
                          <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="Asia/Dubai">Gulf Standard Time (GST)</SelectItem>
                          <SelectItem value="Asia/Riyadh">Arabia Standard Time (AST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-currency" className="text-sm font-medium text-slate-700">
                        Default Currency
                      </Label>
                      <Select
                        value={editData.defaultCurrency}
                        onValueChange={(value) => setEditData({ ...editData, defaultCurrency: value })}
                      >
                        <SelectTrigger className="rounded-lg border-slate-200 focus:border-slate-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ETB">Ethiopian Birr (ETB)</SelectItem>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                          <SelectItem value="AED">UAE Dirham (AED)</SelectItem>
                          <SelectItem value="SAR">Saudi Riyal (SAR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-language" className="text-sm font-medium text-slate-700">
                        Default Language
                      </Label>
                      <Select
                        value={editData.defaultLanguage}
                        onValueChange={(value) => setEditData({ ...editData, defaultLanguage: value })}
                      >
                        <SelectTrigger className="rounded-lg border-slate-200 focus:border-slate-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="am">አማርኛ (Amharic)</SelectItem>
                          <SelectItem value="ar">العربية (Arabic)</SelectItem>
                          <SelectItem value="fr">Français (French)</SelectItem>
                          <SelectItem value="es">Español (Spanish)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Branding */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Palette className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Branding & Colors</h3>
                      <p className="text-sm text-slate-600">Customize the school's visual identity</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-logo" className="text-sm font-medium text-slate-700">
                        Logo URL
                      </Label>
                      <Input
                        id="edit-logo"
                        value={editData.logoUrl}
                        onChange={(e) => setEditData({ ...editData, logoUrl: e.target.value })}
                        className="rounded-lg border-slate-200 focus:border-slate-400"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Primary Color</Label>
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-12 h-12 rounded-lg border-2 border-white shadow-sm"
                            style={{ backgroundColor: editData.primaryColor }}
                          />
                          <Input
                            type="color"
                            value={editData.primaryColor}
                            onChange={(e) => setEditData({ ...editData, primaryColor: e.target.value })}
                            className="w-16 h-12 rounded border-slate-200"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Secondary Color</Label>
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-12 h-12 rounded-lg border-2 border-white shadow-sm"
                            style={{ backgroundColor: editData.secondaryColor }}
                          />
                          <Input
                            type="color"
                            value={editData.secondaryColor}
                            onChange={(e) => setEditData({ ...editData, secondaryColor: e.target.value })}
                            className="w-16 h-12 rounded border-slate-200"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Color Preview */}
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="text-sm font-medium text-slate-900 mb-3">Preview</h4>
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: editData.primaryColor }}
                        >
                          S
                        </div>
                        <div className="flex-1">
                          <div
                            className="h-2 rounded-full"
                            style={{ backgroundColor: editData.secondaryColor }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex space-x-3">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      className="rounded-lg border-slate-200 hover:bg-slate-50"
                    >
                      Previous
                    </Button>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="rounded-lg border-slate-200 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>

                  {currentStep < steps.length - 1 ? (
                    <Button
                      onClick={nextStep}
                      disabled={!validateStep(currentStep)}
                      className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button
                      onClick={handleUpdate}
                      disabled={updating}
                      className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Status History Panel */}
      <StatusHistory
        schoolId={school?.id || ''}
        isOpen={showStatusHistory}
        onClose={() => setShowStatusHistory(false)}
      />
    </AnimatePresence>
  );
}

