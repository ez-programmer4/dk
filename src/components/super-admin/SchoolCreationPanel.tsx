"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  User,
  Palette,
  Globe,
  DollarSign,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Settings,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface SchoolCreationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  // School Details
  name: string;
  email: string;
  phone: string;
  address: string;

  // Branding
  primaryColor: string;
  secondaryColor: string;

  // Configuration
  timezone: string;
  defaultCurrency: string;
  defaultLanguage: string;

  // Admin Details
  adminName: string;
  adminUsername: string;
  adminPassword: string;
  adminConfirmPassword: string;
  adminPhone: string;

  // Pricing
  pricingTierId: string;
}

const timezones = [
  { value: "Africa/Addis_Ababa", label: "East Africa Time (EAT)" },
  { value: "Africa/Cairo", label: "Eastern European Time (EET)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "America/New_York", label: "Eastern Standard Time (EST)" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST)" },
  { value: "Asia/Riyadh", label: "Arabia Standard Time (AST)" },
];

const currencies = [
  { value: "ETB", label: "Ethiopian Birr (ETB)" },
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "SAR", label: "Saudi Riyal (SAR)" },
  { value: "AED", label: "UAE Dirham (AED)" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "ar", label: "العربية (Arabic)" },
  { value: "am", label: "አማርኛ (Amharic)" },
];

const colorPalettes = [
  // Professional palettes
  { name: "Ocean Blue", primary: "#1E40AF", secondary: "#1E3A8A", accent: "#3B82F6" },
  { name: "Forest Green", primary: "#059669", secondary: "#047857", accent: "#10B981" },
  { name: "Royal Purple", primary: "#7C3AED", secondary: "#6D28D9", accent: "#8B5CF6" },
  { name: "Sunset Orange", primary: "#EA580C", secondary: "#C2410C", accent: "#F97316" },
  { name: "Rose Pink", primary: "#DB2777", secondary: "#BE185D", accent: "#EC4899" },
  { name: "Teal Waves", primary: "#0F766E", secondary: "#115E59", accent: "#14B8A6" },
  { name: "Indigo Night", primary: "#312E81", secondary: "#1E1B4B", accent: "#4338CA" },
  { name: "Emerald City", primary: "#065F46", secondary: "#064E3B", accent: "#047857" },
  { name: "Crimson Red", primary: "#DC2626", secondary: "#B91C1C", accent: "#EF4444" },
  { name: "Amber Gold", primary: "#D97706", secondary: "#B45309", accent: "#F59E0B" },
  { name: "Slate Gray", primary: "#374151", secondary: "#1F2937", accent: "#4B5563" },
  { name: "Mint Fresh", primary: "#0D9488", secondary: "#0F766E", accent: "#14B8A6" },
];

const predefinedColors = [
  "#1E40AF", "#059669", "#7C3AED", "#EA580C", "#DB2777", "#0F766E",
  "#312E81", "#065F46", "#DC2626", "#D97706", "#374151", "#0D9488",
  "#2563EB", "#16A34A", "#9333EA", "#EA580C", "#EC4899", "#0891B2",
  "#4F46E5", "#15803D", "#C026D3", "#C2410C", "#BE185D", "#0E7490",
];

export default function SchoolCreationPanel({
  isOpen,
  onClose,
  onSuccess,
}: SchoolCreationPanelProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#1D4ED8",
    timezone: "Africa/Addis_Ababa",
    defaultCurrency: "ETB",
    defaultLanguage: "en",
    adminName: "",
    adminUsername: "",
    adminPassword: "",
    adminConfirmPassword: "",
    adminPhone: "",
    pricingTierId: "",
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const totalSteps = 3;

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          setError("School name is required");
          return false;
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError("Invalid email address");
          return false;
        }
        return true;

      case 2:
        if (!formData.adminName.trim()) {
          setError("Admin name is required");
          return false;
        }
        if (!formData.adminUsername.trim()) {
          setError("Admin username is required");
          return false;
        }
        if (formData.adminPassword.length < 6) {
          setError("Admin password must be at least 6 characters");
          return false;
        }
        if (formData.adminPassword !== formData.adminConfirmPassword) {
          setError("Passwords do not match");
          return false;
        }
        return true;

      case 3:
        return true;

      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const submitData = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        timezone: formData.timezone,
        defaultCurrency: formData.defaultCurrency,
        defaultLanguage: formData.defaultLanguage,
        adminName: formData.adminName,
        adminUsername: formData.adminUsername,
        adminPassword: formData.adminPassword,
        adminPhone: formData.adminPhone || undefined,
        pricingTierId: formData.pricingTierId || undefined,
      };

      const response = await fetch("/api/super-admin/schools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create school");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          primaryColor: "#3B82F6",
          secondaryColor: "#1D4ED8",
          timezone: "Africa/Addis_Ababa",
          defaultCurrency: "ETB",
          defaultLanguage: "en",
          adminName: "",
          adminUsername: "",
          adminPassword: "",
          adminConfirmPassword: "",
          adminPhone: "",
          pricingTierId: "",
        });
        setCurrentStep(1);
        setSuccess(false);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: {
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">School Information</h3>
              <p className="text-gray-600">
                Enter the basic details for your new school
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-800 flex items-center">
                  School Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Darul Hikmah Islamic School"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">This will be displayed publicly</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-800">
                    Contact Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="info@school.edu"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">For official communications</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-800">
                    Contact Phone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+251 XXX XXX XXX"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">Primary contact number</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-semibold text-gray-800">
                  Physical Address
                </Label>
                <Textarea
                  id="address"
                  placeholder="Street address, city, region, postal code"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="min-h-20 border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500">Complete address for records and logistics</p>
              </div>

              {/* Preview Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {formData.name || "School Name"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formData.email || "contact@school.edu"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }

      case 2: {
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Administrator Account</h3>
              <p className="text-gray-600">
                Create secure credentials for the school administrator
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div className="space-y-2">
                <Label htmlFor="adminName" className="text-sm font-semibold text-gray-800 flex items-center">
                  Full Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="adminName"
                  placeholder="e.g., Ahmed Mohammed"
                  value={formData.adminName}
                  onChange={(e) => handleInputChange("adminName", e.target.value)}
                  className="h-12 text-base border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500">Administrator's full legal name</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="adminUsername" className="text-sm font-semibold text-gray-800">
                    Username <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="adminUsername"
                    placeholder="unique_username"
                    value={formData.adminUsername}
                    onChange={(e) => handleInputChange("adminUsername", e.target.value)}
                    className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500">Must be unique across all schools</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPhone" className="text-sm font-semibold text-gray-800">
                    Contact Phone
                  </Label>
                  <Input
                    id="adminPhone"
                    placeholder="+251 XXX XXX XXX"
                    value={formData.adminPhone}
                    onChange={(e) => handleInputChange("adminPhone", e.target.value)}
                    className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500">For account recovery</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminPassword" className="text-sm font-semibold text-gray-800">
                    Password <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="adminPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={formData.adminPassword}
                      onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                      className="h-12 pr-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <div className={`w-2 h-2 rounded-full ${formData.adminPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>At least 8 characters</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminConfirmPassword" className="text-sm font-semibold text-gray-800">
                    Confirm Password <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="adminConfirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.adminConfirmPassword}
                    onChange={(e) => handleInputChange("adminConfirmPassword", e.target.value)}
                    className={`h-12 border-gray-300 focus:ring-green-500 ${
                      formData.adminConfirmPassword &&
                      formData.adminPassword !== formData.adminConfirmPassword
                        ? 'border-red-300 focus:border-red-500'
                        : 'focus:border-green-500'
                    }`}
                  />
                  {formData.adminConfirmPassword && formData.adminPassword !== formData.adminConfirmPassword && (
                    <p className="text-xs text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Passwords do not match
                    </p>
                  )}
                  {formData.adminConfirmPassword && formData.adminPassword === formData.adminConfirmPassword && formData.adminPassword && (
                    <p className="text-xs text-green-600 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Passwords match
                    </p>
                  )}
                </div>
              </div>

              {/* Account Preview */}
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {formData.adminName || "Administrator Name"}
                      </div>
                      <div className="text-sm text-gray-600">
                        @{formData.adminUsername || "username"}
                      </div>
                      <div className="flex items-center mt-1 space-x-2">
                        <Badge variant="outline" className="text-xs">
                          School Admin
                        </Badge>
                        {formData.adminPassword && (
                          <Badge variant="secondary" className="text-xs text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Password Set
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }

      case 3: {
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Configuration & Branding</h3>
              <p className="text-gray-600">
                Customize your school's appearance and regional settings
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
              {/* Branding Section */}
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-900">
                    <Palette className="w-5 h-5 mr-2" />
                    Brand Identity
                  </CardTitle>
                  <p className="text-sm text-purple-700">
                    Choose colors that represent your school's brand and personality
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">

                {/* Color Palette Selector */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Professional Color Palettes
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {colorPalettes.map((palette) => (
                      <motion.button
                        key={palette.name}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            primaryColor: palette.primary,
                            secondaryColor: palette.secondary,
                          }));
                        }}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          formData.primaryColor === palette.primary
                            ? "border-purple-500 shadow-lg ring-2 ring-purple-200"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div
                            className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: palette.primary }}
                          />
                          <div
                            className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: palette.secondary }}
                          />
                          <div
                            className="w-3 h-3 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: palette.accent }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{palette.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Picker */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Custom Colors
                  </Label>
                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {predefinedColors.map((color) => (
                      <motion.button
                        key={color}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          if (formData.primaryColor === color) {
                            setFormData(prev => ({
                              ...prev,
                              secondaryColor: color,
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              primaryColor: color,
                            }));
                          }
                        }}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          formData.primaryColor === color || formData.secondaryColor === color
                            ? "border-gray-900 shadow-lg"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {/* Manual Color Input */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primaryColor" className="text-sm font-medium text-gray-700">
                        Primary Color
                      </Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-gray-200 shadow-sm"
                          style={{ backgroundColor: formData.primaryColor }}
                        />
                        <Input
                          id="primaryColor"
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                          className="flex-1 h-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondaryColor" className="text-sm font-medium text-gray-700">
                        Secondary Color
                      </Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-gray-200 shadow-sm"
                          style={{ backgroundColor: formData.secondaryColor }}
                        />
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                          className="flex-1 h-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Live Preview
                  </Label>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center space-x-4">
                      {/* Logo Preview */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                        style={{ backgroundColor: formData.primaryColor }}
                      >
                        S
                      </div>

                      {/* Text Preview */}
                      <div className="flex-1">
                        <div
                          className="text-lg font-semibold"
                          style={{ color: formData.primaryColor }}
                        >
                          Sample School Name
                        </div>
                        <div
                          className="text-sm"
                          style={{ color: formData.secondaryColor }}
                        >
                          Professional Learning Platform
                        </div>
                      </div>

                      {/* Button Preview */}
                      <Button
                        size="sm"
                        style={{
                          backgroundColor: formData.primaryColor,
                          borderColor: formData.secondaryColor
                        }}
                        className="text-white hover:opacity-90"
                      >
                        Get Started
                      </Button>
                    </div>
                  </div>
                </div>
                </CardContent>
              </Card>

              {/* Configuration Section */}
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-900">
                    <Settings className="w-5 h-5 mr-2" />
                    Regional & System Settings
                  </CardTitle>
                  <p className="text-sm text-blue-700">
                    Configure timezone, currency, and language preferences
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="timezone" className="text-sm font-semibold text-gray-800 flex items-center">
                        <Globe className="w-4 h-4 mr-2 text-blue-600" />
                        Timezone
                      </Label>
                      <Select
                        value={formData.timezone}
                        onValueChange={(value) => handleInputChange("timezone", value)}
                      >
                        <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                      <p className="text-xs text-gray-500">Affects all time-based features</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency" className="text-sm font-semibold text-gray-800 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                        Default Currency
                      </Label>
                      <Select
                        value={formData.defaultCurrency}
                        onValueChange={(value) => handleInputChange("defaultCurrency", value)}
                      >
                        <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                      <p className="text-xs text-gray-500">For payments and pricing</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-sm font-semibold text-gray-800">
                        Default Language
                      </Label>
                      <Select
                        value={formData.defaultLanguage}
                        onValueChange={(value) => handleInputChange("defaultLanguage", value)}
                      >
                        <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                      <p className="text-xs text-gray-500">Interface language</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Preview */}
              <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">School Setup Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">School:</span>
                        <p className="text-sm text-gray-900">{formData.name || "Not set"}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Administrator:</span>
                        <p className="text-sm text-gray-900">{formData.adminName || "Not set"}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Contact:</span>
                        <p className="text-sm text-gray-900">{formData.email || "Not set"}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Theme:</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: formData.primaryColor }}
                          />
                          <span className="text-sm text-gray-900">Primary</span>
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: formData.secondaryColor }}
                          />
                          <span className="text-sm text-gray-900">Secondary</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Region:</span>
                        <p className="text-sm text-gray-900">
                          {timezones.find(tz => tz.value === formData.timezone)?.label || "Not set"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Currency:</span>
                        <p className="text-sm text-gray-900">
                          {currencies.find(curr => curr.value === formData.defaultCurrency)?.label || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }

      default:
        return null;
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-full max-w-4xl bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create New School</h2>
                  <p className="text-sm text-gray-600">Set up a new school with admin account</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress */}
            <div className="px-6 py-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between mb-4">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center flex-1">
                      <motion.div
                        initial={false}
                        animate={{
                          backgroundColor: step <= currentStep ? "#3B82F6" : "#E5E7EB",
                          color: step <= currentStep ? "#FFFFFF" : "#6B7280",
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm"
                      >
                        {step <= currentStep ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          step
                        )}
                      </motion.div>
                      {step < 3 && (
                        <motion.div
                          initial={false}
                          animate={{
                            backgroundColor: step < currentStep ? "#3B82F6" : "#E5E7EB",
                          }}
                          className="flex-1 h-1 mx-4 rounded-full"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-xs font-medium text-gray-600">
                  <div className={`text-center ${currentStep === 1 ? "text-blue-600" : ""}`}>
                    <div>School Details</div>
                    <div className="text-xs text-gray-500 mt-1">Basic information</div>
                  </div>
                  <div className={`text-center ${currentStep === 2 ? "text-blue-600" : ""}`}>
                    <div>Admin Account</div>
                    <div className="text-xs text-gray-500 mt-1">Access credentials</div>
                  </div>
                  <div className={`text-center ${currentStep === 3 ? "text-blue-600" : ""}`}>
                    <div>Configuration</div>
                    <div className="text-xs text-gray-500 mt-1">Branding & settings</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    School Created Successfully!
                  </h3>
                  <p className="text-gray-600">
                    The school and admin account have been created.
                  </p>
                </motion.div>
              ) : (
                <>
                  {renderStepContent()}

                  {/* Error Alert */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-6"
                      >
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Footer */}
            {!success && (
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-6">
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={currentStep === 1 ? onClose : handleBack}
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-3"
                  >
                    {currentStep === 1 ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <ChevronLeft className="w-4 h-4" />
                    )}
                    <span>{currentStep === 1 ? "Cancel" : "Back"}</span>
                  </Button>

                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      Step {currentStep} of {totalSteps}
                    </div>

                    {currentStep < totalSteps ? (
                      <Button
                        onClick={handleNext}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2 px-6 py-3"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 flex items-center space-x-2 px-8 py-3 text-lg"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Creating...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            <span>Create School</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
