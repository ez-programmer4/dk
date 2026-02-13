"use client";

import { useState, useEffect } from "react";
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
  Edit,
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
import { useToast } from "@/components/ui/use-toast";

interface SchoolEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string | null;
  onSchoolUpdated?: () => void;
}

interface SchoolData {
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

export default function SchoolEditPanel({
  isOpen,
  onClose,
  schoolId,
  onSchoolUpdated,
}: SchoolEditPanelProps) {
  console.log("SchoolEditPanel component called with:", { isOpen, schoolId });
  const [formData, setFormData] = useState<SchoolData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#1D4ED8",
    timezone: "Africa/Addis_Ababa",
    defaultCurrency: "ETB",
    defaultLanguage: "en",
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const totalSteps = 3;

  useEffect(() => {
    console.log("SchoolEditPanel useEffect:", { isOpen, schoolId });
    if (isOpen && schoolId) {
      fetchSchoolData();
    }
  }, [isOpen, schoolId]);

  const fetchSchoolData = async () => {
    if (!schoolId) {
      console.log("No schoolId provided for fetchSchoolData");
      return;
    }

    console.log("Fetching school data for ID:", schoolId);
    setLoading(true);

    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) {
        console.error("No authentication token found");
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }

      console.log("Making API request to:", `/api/super-admin/schools/${schoolId}`);
      const response = await fetch(`/api/super-admin/schools/${schoolId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("API Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("School data received:", data);
        const school = data.school;

        setFormData({
          name: school.name || "",
          email: school.email || "",
          phone: school.phone || "",
          address: school.address || "",
          primaryColor: school.primaryColor || "#3B82F6",
          secondaryColor: school.secondaryColor || "#1D4ED8",
          timezone: school.timezone || "Africa/Addis_Ababa",
          defaultCurrency: school.defaultCurrency || "ETB",
          defaultLanguage: school.defaultLanguage || "en",
        });

        console.log("Form data set successfully");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        toast({
          title: "Error",
          description: errorData.error || `Failed to load school data (${response.status})`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Network error:", error);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SchoolData, value: string) => {
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
    if (!validateStep(currentStep) || !schoolId) return;

    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) throw new Error("No authentication token");

      const updateData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        timezone: formData.timezone,
        defaultCurrency: formData.defaultCurrency,
        defaultLanguage: formData.defaultLanguage,
      };

      const response = await fetch(`/api/super-admin/schools/${schoolId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update school");
      }

      setSuccess(true);
      setTimeout(() => {
        onSchoolUpdated?.();
        onClose();
        setSuccess(false);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Edit className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Edit School Information</h3>
              <p className="text-gray-600">
                Update the basic details for this school
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
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Administrator Account</h3>
              <p className="text-gray-600">
                Update administrator account settings
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Administrator Account</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Administrator accounts can be managed separately from the school settings.
                      Use the actions in the school details panel to reset passwords or manage admin accounts.
                    </p>
                    <Button variant="outline" className="text-green-700 border-green-300 hover:bg-green-50">
                      Manage Administrators
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Configuration & Branding</h3>
              <p className="text-gray-600">
                Update branding and system settings
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
                    Update colors that represent your school's brand
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
                          <span className="text-sm font-medium">{palette.name}</span>
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
                            className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
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
                            className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
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
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                          style={{ backgroundColor: formData.primaryColor }}
                        >
                          S
                        </div>
                        <div>
                          <div
                            className="text-lg font-semibold"
                            style={{ color: formData.primaryColor }}
                          >
                            {formData.name || "School Name"}
                          </div>
                          <div
                            className="text-sm"
                            style={{ color: formData.secondaryColor }}
                          >
                            Professional Learning Platform
                          </div>
                        </div>
                        <Button
                          size="sm"
                          style={{
                            backgroundColor: formData.primaryColor,
                            borderColor: formData.secondaryColor
                          }}
                          className="text-white hover:opacity-90 ml-auto"
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
                    <Globe className="w-5 h-5 mr-2" />
                    Regional & System Settings
                  </CardTitle>
                  <p className="text-sm text-blue-700">
                    Update timezone, currency, and language preferences
                  </p>
                </CardHeader>
                <CardContent>
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
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  console.log("SchoolEditPanel rendering with isOpen:", isOpen, "schoolId:", schoolId);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Enhanced Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gradient-to-br from-black/60 via-gray-900/50 to-black/60 backdrop-blur-md z-40"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
            onClick={onClose}
          />

          {/* Enhanced Side Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.4
            }}
            className="fixed top-0 right-0 h-full w-full max-w-4xl bg-white shadow-2xl z-50 overflow-y-auto border-l border-gray-200"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            {/* Enhanced Header with Glassmorphism */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="sticky top-0 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-xl border-b border-gray-200/50 px-8 py-6 flex items-center justify-between shadow-sm"
            >
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center space-x-6"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <Edit className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-gray-900 tracking-tight"
                  >
                    Edit School
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-gray-600 mt-1"
                  >
                    Update school information and settings
                  </motion.p>
                </div>
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl hover:bg-gray-100 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Enhanced Progress Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="px-8 py-8 bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm border-b border-gray-200/50"
            >
              <div className="max-w-lg mx-auto">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between mb-6"
                >
                  {[1, 2, 3].map((step, index) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center flex-1"
                    >
                      <motion.div
                        initial={false}
                        animate={{
                          background: step <= currentStep
                            ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)"
                            : "#f3f4f6",
                          color: step <= currentStep ? "#FFFFFF" : "#6b7280",
                          boxShadow: step <= currentStep
                            ? "0 4px 14px 0 rgba(55, 65, 81, 0.3)"
                            : "0 2px 8px 0 rgba(0, 0, 0, 0.1)",
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold relative overflow-hidden"
                      >
                        <motion.div
                          initial={false}
                          animate={{
                            scale: step <= currentStep ? 0 : 1,
                            opacity: step <= currentStep ? 0 : 1,
                          }}
                          className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200"
                        />
                        <motion.div
                          initial={false}
                          animate={{
                            scale: step <= currentStep ? 1 : 0,
                            opacity: step <= currentStep ? 1 : 0,
                          }}
                          className="relative z-10"
                        >
                          {step <= currentStep ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            step
                          )}
                        </motion.div>
                      </motion.div>
                      {step < 3 && (
                        <motion.div
                          initial={false}
                          animate={{
                            background: step < currentStep
                              ? "linear-gradient(90deg, #374151 0%, #1f2937 100%)"
                              : "#e5e7eb",
                            boxShadow: step < currentStep
                              ? "0 2px 8px 0 rgba(55, 65, 81, 0.2)"
                              : "none",
                          }}
                          className="flex-1 h-1 mx-6 rounded-full relative overflow-hidden"
                        >
                          <motion.div
                            initial={false}
                            animate={{
                              x: step < currentStep ? "0%" : "-100%",
                            }}
                            transition={{ duration: 0.6, ease: "easeInOut" }}
                            className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full"
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex justify-between text-sm font-medium"
                >
                  <motion.div
                    animate={{
                      color: currentStep === 1 ? "#374151" : "#9ca3af",
                      fontWeight: currentStep === 1 ? "600" : "500",
                    }}
                    className="text-center flex-1"
                  >
                    <div className="text-sm">School Details</div>
                    <div className="text-xs text-gray-500 mt-1">Basic information</div>
                  </motion.div>
                  <motion.div
                    animate={{
                      color: currentStep === 2 ? "#374151" : "#9ca3af",
                      fontWeight: currentStep === 2 ? "600" : "500",
                    }}
                    className="text-center flex-1"
                  >
                    <div className="text-sm">Administration</div>
                    <div className="text-xs text-gray-500 mt-1">Account management</div>
                  </motion.div>
                  <motion.div
                    animate={{
                      color: currentStep === 3 ? "#374151" : "#9ca3af",
                      fontWeight: currentStep === 3 ? "600" : "500",
                    }}
                    className="text-center flex-1"
                  >
                    <div className="text-sm">Configuration</div>
                    <div className="text-xs text-gray-500 mt-1">Branding & settings</div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

            {/* Enhanced Content Area */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex-1 px-8 py-8 pb-12 space-y-6"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Loading school data...</p>
                </div>
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
            </motion.div>

            {/* Enhanced Footer */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="sticky bottom-0 mb-4"
            >
              {!loading && (
                <motion.div
                  className="bg-gradient-to-r from-white/95 to-gray-50/95 backdrop-blur-xl border-t border-gray-200/50 px-8 py-6 shadow-lg"
                >
                  <div className="flex justify-between items-center">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={saving}
                        className="flex items-center space-x-2 px-6 py-3 rounded-xl border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                      >
                        <X className="w-4 h-4" />
                        <span className="font-medium">Cancel</span>
                      </Button>
                    </motion.div>

                    <div className="flex items-center space-x-6">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full"
                      >
                        Step {currentStep} of {totalSteps}
                      </motion.div>

                      <div className="flex space-x-3">
                        {currentStep > 1 && (
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              variant="outline"
                              onClick={handleBack}
                              disabled={saving}
                              className="flex items-center space-x-2 px-6 py-3 rounded-xl border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span className="font-medium">Back</span>
                            </Button>
                          </motion.div>
                        )}

                        {currentStep < totalSteps ? (
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              onClick={handleNext}
                              disabled={saving}
                              className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white flex items-center space-x-2 px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <span className="font-medium">Next</span>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        ) : (
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              onClick={handleSubmit}
                              disabled={saving}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white flex items-center space-x-3 px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  <span className="font-medium">Updating...</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-5 h-5" />
                                  <span className="font-medium">Update School</span>
                                </>
                              )}
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence> )
}
