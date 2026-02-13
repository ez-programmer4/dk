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
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Settings,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  MessageSquare,
  Crown,
  Clock,
  XCircle,
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

interface SchoolRegistration {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  registrationStatus: string;
  isSelfRegistered: boolean;
  createdAt: string;
  registrationData?: {
    adminName: string;
    adminEmail: string;
    adminPhone?: string;
    expectedStudents?: number;
    schoolType?: string;
    additionalNotes?: string;
    submittedAt: string;
  };
  _count?: {
    students: number;
    teachers: number;
    admins: number;
  };
}

interface SchoolCreationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  registration?: SchoolRegistration | null; // For viewing existing registration details
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
  registration,
}: SchoolCreationPanelProps) {
  const isViewMode = !!registration;
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

  const getStatusBadge = (status: string, registrationStatus: string) => {
    if (registrationStatus === "pending") {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
    } else if (registrationStatus === "approved") {
      return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    } else if (registrationStatus === "rejected") {
      return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

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

                {/* Enhanced Color Palette Selector */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium text-gray-700">
                      Brand Colors
                    </Label>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200"
                          style={{ backgroundColor: formData.primaryColor }}
                        />
                        <span className="text-xs text-gray-500">Primary</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200"
                          style={{ backgroundColor: formData.secondaryColor }}
                        />
                        <span className="text-xs text-gray-500">Secondary</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {colorPalettes.map((palette, index) => (
                      <motion.button
                        key={palette.name}
                        type="button"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            primaryColor: palette.primary,
                            secondaryColor: palette.secondary,
                          }));
                        }}
                        className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                          formData.primaryColor === palette.primary
                            ? "border-gray-800 shadow-xl ring-2 ring-gray-300 bg-gray-50"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-lg bg-white"
                        }`}
                      >
                        {/* Selected indicator */}
                        {formData.primaryColor === palette.primary && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}

                        {/* Color gradient background */}
                        <div
                          className="absolute inset-0 opacity-10 rounded-2xl"
                          style={{
                            background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`
                          }}
                        />

                        {/* Color circles */}
                        <div className="relative flex items-center justify-center space-x-1 mb-3">
                          <motion.div
                            className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: palette.primary }}
                            whileHover={{ scale: 1.1 }}
                          />
                          <motion.div
                            className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: palette.secondary }}
                            whileHover={{ scale: 1.1 }}
                          />
                          <motion.div
                            className="w-4 h-4 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: palette.accent }}
                            whileHover={{ scale: 1.1 }}
                          />
                        </div>

                        <span className={`text-sm font-semibold relative z-10 ${
                          formData.primaryColor === palette.primary ? "text-gray-900" : "text-gray-700"
                        }`}>
                          {palette.name}
                        </span>

                        {/* Hover effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Enhanced Custom Color Picker */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">
                      Custom Color Picker
                    </Label>
                    <div className="flex items-center space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            primaryColor: "#3B82F6",
                            secondaryColor: "#1D4ED8",
                          }));
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        Reset to default
                      </motion.button>
                    </div>
                  </div>

                  {/* Quick Color Palette */}
                  <div>
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3 block">
                      Quick Colors
                    </Label>
                    <div className="grid grid-cols-8 gap-2 mb-4">
                      {predefinedColors.slice(0, 16).map((color, index) => (
                        <motion.button
                          key={color}
                          type="button"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.02 }}
                          whileHover={{ scale: 1.2, z: 10 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            // Toggle between primary and secondary
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
                          className={`relative w-8 h-8 rounded-xl border-2 transition-all duration-200 shadow-sm ${
                            formData.primaryColor === color
                              ? "border-gray-900 shadow-lg ring-2 ring-gray-300"
                              : formData.secondaryColor === color
                              ? "border-gray-600 shadow-md ring-1 ring-gray-200"
                              : "border-white hover:border-gray-300 hover:shadow-md"
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {/* Selection indicators */}
                          {formData.primaryColor === color && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-3 h-3 bg-gray-900 rounded-full flex items-center justify-center"
                            >
                              <span className="text-xs text-white font-bold">P</span>
                            </motion.div>
                          )}
                          {formData.secondaryColor === color && formData.primaryColor !== color && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-3 h-3 bg-gray-600 rounded-full flex items-center justify-center"
                            >
                              <span className="text-xs text-white font-bold">S</span>
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Color Controls */}
                  <div className="border-t border-gray-200 pt-6">
                    <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-4 block">
                      Advanced Controls
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Primary Color */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-3"
                      >
                        <Label className="text-sm font-medium text-gray-700 flex items-center">
                          <div
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm mr-2"
                            style={{ backgroundColor: formData.primaryColor }}
                          />
                          Primary Color
                        </Label>
                        <div className="flex items-center space-x-3">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="relative"
                          >
                            <Input
                              type="color"
                              value={formData.primaryColor}
                              onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                              className="w-12 h-10 rounded-lg border-2 border-gray-200 cursor-pointer"
                            />
                          </motion.div>
                          <Input
                            type="text"
                            value={formData.primaryColor}
                            onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                            placeholder="#000000"
                            className="flex-1 h-10 font-mono text-sm"
                          />
                        </div>
                      </motion.div>

                      {/* Secondary Color */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-3"
                      >
                        <Label className="text-sm font-medium text-gray-700 flex items-center">
                          <div
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm mr-2"
                            style={{ backgroundColor: formData.secondaryColor }}
                          />
                          Secondary Color
                        </Label>
                        <div className="flex items-center space-x-3">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="relative"
                          >
                            <Input
                              type="color"
                              value={formData.secondaryColor}
                              onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                              className="w-12 h-10 rounded-lg border-2 border-gray-200 cursor-pointer"
                            />
                          </motion.div>
                          <Input
                            type="text"
                            value={formData.secondaryColor}
                            onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                            placeholder="#000000"
                            className="flex-1 h-10 font-mono text-sm"
                          />
                        </div>
                      </motion.div>
                    </div>

                    {/* Color Harmony Preview */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                    >
                      <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3 block">
                        Color Harmony Preview
                      </Label>
                      <div className="flex items-center space-x-4">
                        <motion.div
                          className="flex-1 h-16 rounded-lg shadow-sm border-2 border-white"
                          style={{
                            background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`
                          }}
                          whileHover={{ scale: 1.02 }}
                        />
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: formData.primaryColor }}
                            />
                            <span>{formData.primaryColor}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: formData.secondaryColor }}
                            />
                            <span>{formData.secondaryColor}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
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

  const renderViewMode = () => {
    if (!registration) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Registration Status Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
        >
          <div className="flex items-center justify-center space-x-4 mb-4">
            {getStatusBadge(registration.status, registration.registrationStatus)}
            <Badge variant="outline" className="border-gray-300 text-gray-700">
              {registration.isSelfRegistered ? "Self-Registered" : "Super Admin Created"}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            Submitted {new Date(registration.registrationData?.submittedAt || registration.createdAt).toLocaleDateString()}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8">
          {/* School Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  School Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                    <label className="text-sm font-semibold text-blue-900 uppercase tracking-wide">School Name</label>
                    <p className="text-gray-900 font-medium mt-1">{registration.name}</p>
                  </div>

                  <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                    <label className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Slug</label>
                    <p className="text-gray-900 font-mono text-sm mt-1 font-medium">{registration.slug}</p>
                  </div>

                  <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                    <label className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Email</label>
                    <p className="text-gray-900 flex items-center mt-1 font-medium">
                      <Mail className="w-4 h-4 mr-3 text-blue-500" />
                      {registration.email}
                    </p>
                  </div>

                  {registration.phone && (
                    <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                      <label className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Phone</label>
                      <p className="text-gray-900 flex items-center mt-1 font-medium">
                        <Phone className="w-4 h-4 mr-3 text-blue-500" />
                        {registration.phone}
                      </p>
                    </div>
                  )}

                  {registration.address && (
                    <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                      <label className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Address</label>
                      <p className="text-gray-900 flex items-center mt-1 font-medium">
                        <MapPin className="w-4 h-4 mr-3 text-blue-500" />
                        {registration.address}
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                    <label className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Registration Date</label>
                    <p className="text-gray-900 flex items-center mt-1 font-medium">
                      <Calendar className="w-4 h-4 mr-3 text-blue-500" />
                      {new Date(registration.createdAt).toLocaleDateString()} at {new Date(registration.createdAt).toLocaleTimeString()}
                    </p>
                  </div>

                  {registration.registrationData?.schoolType && (
                    <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                      <label className="text-sm font-semibold text-blue-900 uppercase tracking-wide">School Type</label>
                      <p className="text-gray-900 font-medium mt-1">{registration.registrationData.schoolType}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Admin Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Administrator Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {registration.registrationData ? (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                      <label className="text-sm font-semibold text-green-900 uppercase tracking-wide">Admin Name</label>
                      <p className="text-gray-900 font-medium mt-1">{registration.registrationData.adminName}</p>
                    </div>

                    <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                      <label className="text-sm font-semibold text-green-900 uppercase tracking-wide">Admin Email</label>
                      <p className="text-gray-900 flex items-center mt-1 font-medium">
                        <Mail className="w-4 h-4 mr-3 text-green-500" />
                        {registration.registrationData.adminEmail}
                      </p>
                    </div>

                    {registration.registrationData.adminPhone && (
                      <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                        <label className="text-sm font-semibold text-green-900 uppercase tracking-wide">Admin Phone</label>
                        <p className="text-gray-900 flex items-center mt-1 font-medium">
                          <Phone className="w-4 h-4 mr-3 text-green-500" />
                          {registration.registrationData.adminPhone}
                        </p>
                      </div>
                    )}

                    {registration.registrationData.expectedStudents && (
                      <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                        <label className="text-sm font-semibold text-green-900 uppercase tracking-wide">Expected Students</label>
                        <p className="text-gray-900 flex items-center mt-1 font-medium">
                          <Users className="w-4 h-4 mr-3 text-green-500" />
                          {registration.registrationData.expectedStudents}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No admin information available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Additional Notes */}
          {registration.registrationData?.additionalNotes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Additional Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {registration.registrationData.additionalNotes}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

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
              className="sticky top-0 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-xl border-b border-gray-200/50 px-6 py-6 flex items-center justify-between shadow-sm"
            >
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center space-x-4"
              >
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <Building2 className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold text-gray-900 tracking-tight"
                  >
                    {isViewMode ? "School Registration Details" : "Create New School"}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-gray-600 mt-1"
                  >
                    {isViewMode ? "View school registration information" : "Set up a new school with admin account"}
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
              className="px-6 py-8 bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm border-b border-gray-200/50"
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
                    <div className="text-sm">Admin Account</div>
                    <div className="text-xs text-gray-500 mt-1">Access credentials</div>
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
              className="flex-1 px-8 py-8 space-y-6"
            >
              {isViewMode ? (
                renderViewMode()
              ) : success ? (
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
            </motion.div>

            {/* Enhanced Footer */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="sticky bottom-0"
            >
              {isViewMode ? (
                <motion.div
                  className="bg-gradient-to-r from-white/95 to-gray-50/95 backdrop-blur-xl border-t border-gray-200/50 px-8 py-6"
                >
                  <div className="flex justify-end">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={onClose}
                        className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        Close
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              ) : !success && (
                <motion.div
                  className="bg-gradient-to-r from-white/95 to-gray-50/95 backdrop-blur-xl border-t border-gray-200/50 px-8 py-6 shadow-lg mb-4"
                >
                  <div className="flex justify-between items-center">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        onClick={currentStep === 1 ? onClose : handleBack}
                        disabled={loading}
                        className="flex items-center space-x-2 px-6 py-3 rounded-xl border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                      >
                        {currentStep === 1 ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <ChevronLeft className="w-4 h-4" />
                        )}
                        <span className="font-medium">{currentStep === 1 ? "Cancel" : "Back"}</span>
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

                      {currentStep < totalSteps ? (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            onClick={handleNext}
                            disabled={loading}
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
                            disabled={loading}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white flex items-center space-x-3 px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="font-medium">Creating...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-5 h-5" />
                                <span className="font-medium">Create School</span>
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
