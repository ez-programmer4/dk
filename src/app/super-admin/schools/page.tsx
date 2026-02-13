"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Users,
  User,
  BookOpen,
  Shield,
  Calendar,
  Banknote,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calculator,
  Crown,
  Key,
  Trash2,
  FileText,
  Palette,
  Globe,
  DollarSign,
  Save,
  Loader2,
  AlertCircle,
  EyeOff,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Settings,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import SchoolCreationPanel from "@/components/super-admin/SchoolCreationPanel";
import PremiumFeaturesPanel from "@/components/super-admin/PremiumFeaturesPanel";
import PaymentCalculator from "@/components/super-admin/PaymentCalculator";
import SchoolDetailsPanel from "@/components/super-admin/SchoolDetailsPanel";
import SchoolEditPanel from "@/components/super-admin/SchoolEditPanel";
import Link from "next/link";

interface School {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  status: string;
  statusReason?: string;
  statusChangedAt: string;
  timezone: string;
  defaultCurrency: string;
  createdAt: string;
  isSelfRegistered?: boolean;
  registrationStatus?: string;
  _count: {
    students: number;
    teachers: number;
    admins: number;
  };
  pricingTier?: {
    id: string;
    name: string;
    monthlyFee: number;
    currency: string;
  };
  subscription?: {
    status: string;
    currentStudents: number;
    trialEndsAt?: string;
    subscribedAt?: string;
  };
}

const statusColors = {
  trial: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  suspended: "bg-red-100 text-red-800",
  expired: "bg-orange-100 text-orange-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const statusIcons = {
  trial: Clock,
  active: CheckCircle,
  inactive: Ban,
  suspended: AlertTriangle,
  expired: AlertTriangle,
  cancelled: Ban,
};

interface SchoolCreationFormData {
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

export default function SchoolsManagementPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreationPanelOpen, setIsCreationPanelOpen] = useState(false);
  const [isPremiumPanelOpen, setIsPremiumPanelOpen] = useState(false);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [isPaymentCalculatorOpen, setIsPaymentCalculatorOpen] = useState(false);
  const [selectedSchoolForDetails, setSelectedSchoolForDetails] = useState<string | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [selectedSchoolForEdit, setSelectedSchoolForEdit] = useState<string | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // School Creation Form State
  const [creationFormData, setCreationFormData] = useState<SchoolCreationFormData>({
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
  const [creationCurrentStep, setCreationCurrentStep] = useState(1);
  const [creationLoading, setCreationLoading] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState(false);
  const [showCreationPassword, setShowCreationPassword] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, [searchTerm, statusFilter]);

  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) return;

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/super-admin/schools?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools);
      }
    } catch (error) {
      console.error("Failed to fetch schools:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const StatusIcon = statusIcons[status as keyof typeof statusIcons] || Clock;
    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors]} flex items-center gap-1`}>
        <StatusIcon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSubscriptionStatus = (subscription?: School["subscription"]) => {
    if (!subscription) return "No Subscription";

    const now = new Date();
    const trialEnds = subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : null;

    if (subscription.status === "trial" && trialEnds && trialEnds > now) {
      const daysLeft = Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `Trial (${daysLeft} days left)`;
    }

    if (subscription.status === "active") {
      return "Active";
    }

    return subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1);
  };

  const getRegistrationBadge = (school: School) => {
    if (school.isSelfRegistered) {
      const status = school.registrationStatus || "pending";
      const colors = {
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        pending: "bg-yellow-100 text-yellow-800",
      };

      return (
        <Badge className={`${colors[status as keyof typeof colors] || colors.pending} flex items-center gap-1 text-xs`}>
          <FileText className="w-3 h-3" />
          Self-Registered ({status})
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1 text-xs">
          <Crown className="w-3 h-3" />
          Super Admin
        </Badge>
      );
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "ETB" ? "ETB" : currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // School Creation Form Functions
  const handleCreationInputChange = (field: keyof SchoolCreationFormData, value: string) => {
    setCreationFormData(prev => ({ ...prev, [field]: value }));
    if (creationError) setCreationError(null);
  };

  const validateCreationStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!creationFormData.name.trim()) {
          setCreationError("School name is required");
          return false;
        }
        if (creationFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(creationFormData.email)) {
          setCreationError("Invalid email address");
          return false;
        }
        return true;

      case 2:
        if (!creationFormData.adminName.trim()) {
          setCreationError("Admin name is required");
          return false;
        }
        if (!creationFormData.adminUsername.trim()) {
          setCreationError("Admin username is required");
          return false;
        }
        if (creationFormData.adminPassword.length < 6) {
          setCreationError("Admin password must be at least 6 characters");
          return false;
        }
        if (creationFormData.adminPassword !== creationFormData.adminConfirmPassword) {
          setCreationError("Passwords do not match");
          return false;
        }
        return true;

      case 3:
        return true;

      default:
        return false;
    }
  };

  const handleCreationNext = () => {
    if (validateCreationStep(creationCurrentStep) && creationCurrentStep < 3) {
      setCreationCurrentStep(prev => prev + 1);
    }
  };

  const handleCreationBack = () => {
    if (creationCurrentStep > 1) {
      setCreationCurrentStep(prev => prev - 1);
    }
  };

  const handleCreationSubmit = async () => {
    if (!validateCreationStep(creationCurrentStep)) return;

    setCreationLoading(true);
    setCreationError(null);

    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const submitData = {
        name: creationFormData.name,
        email: creationFormData.email || undefined,
        phone: creationFormData.phone || undefined,
        address: creationFormData.address || undefined,
        primaryColor: creationFormData.primaryColor,
        secondaryColor: creationFormData.secondaryColor,
        timezone: creationFormData.timezone,
        defaultCurrency: creationFormData.defaultCurrency,
        defaultLanguage: creationFormData.defaultLanguage,
        adminName: creationFormData.adminName,
        adminUsername: creationFormData.adminUsername,
        adminPassword: creationFormData.adminPassword,
        adminPhone: creationFormData.adminPhone || undefined,
        pricingTierId: creationFormData.pricingTierId || undefined,
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

      setCreationSuccess(true);
      setTimeout(() => {
        fetchSchools();
        setIsCreationPanelOpen(false);
        // Reset form
        setCreationFormData({
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
        setCreationCurrentStep(1);
        setCreationSuccess(false);
      }, 2000);

    } catch (err) {
      setCreationError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setCreationLoading(false);
    }
  };

  // Handle school status toggle (activate/deactivate)
  const handleStatusToggle = async (school: School) => {
    if (updatingStatus) return; // Prevent multiple simultaneous updates

    const newStatus = school.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';

    // Show confirmation dialog
    if (!confirm(`Are you sure you want to ${action} the school "${school.name}"?`)) {
      return;
    }

    setUpdatingStatus(school.id);

    try {
      const response = await fetch('/api/super-admin/schools', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolId: school.id,
          status: newStatus,
          statusReason: `School ${action}d by super admin`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the school in the local state
        setSchools(prevSchools =>
          prevSchools.map(s =>
            s.id === school.id
              ? { ...s, status: newStatus, statusChangedAt: new Date().toISOString() }
              : s
          )
        );

        // Show success message
        alert(`School "${school.name}" has been ${action}d successfully.`);
      } else {
        throw new Error(data.error || `Failed to ${action} school`);
      }
    } catch (error) {
      console.error(`Error ${action}ing school:`, error);
      alert(`Failed to ${action} school: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const renderCreationStepContent = () => {
    switch (creationCurrentStep) {
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
                <Label htmlFor="creation-name" className="text-sm font-semibold text-gray-800 flex items-center">
                  School Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="creation-name"
                  placeholder="e.g., Darul Hikmah Islamic School"
                  value={creationFormData.name}
                  onChange={(e) => handleCreationInputChange("name", e.target.value)}
                  className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">This will be displayed publicly</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="creation-email" className="text-sm font-semibold text-gray-800">
                    Contact Email
                  </Label>
                  <Input
                    id="creation-email"
                    type="email"
                    placeholder="info@school.edu"
                    value={creationFormData.email}
                    onChange={(e) => handleCreationInputChange("email", e.target.value)}
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">For official communications</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creation-phone" className="text-sm font-semibold text-gray-800">
                    Contact Phone
                  </Label>
                  <Input
                    id="creation-phone"
                    placeholder="+251 XXX XXX XXX"
                    value={creationFormData.phone}
                    onChange={(e) => handleCreationInputChange("phone", e.target.value)}
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">Primary contact number</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="creation-address" className="text-sm font-semibold text-gray-800">
                  Physical Address
                </Label>
                <Textarea
                  id="creation-address"
                  placeholder="Street address, city, region, postal code"
                  value={creationFormData.address}
                  onChange={(e) => handleCreationInputChange("address", e.target.value)}
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
                        {creationFormData.name || "School Name"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {creationFormData.email || "contact@school.edu"}
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
                <Label htmlFor="creation-adminName" className="text-sm font-semibold text-gray-800 flex items-center">
                  Full Name <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="creation-adminName"
                  placeholder="e.g., Ahmed Mohammed"
                  value={creationFormData.adminName}
                  onChange={(e) => handleCreationInputChange("adminName", e.target.value)}
                  className="h-12 text-base border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500">Administrator's full legal name</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="creation-adminUsername" className="text-sm font-semibold text-gray-800">
                    Username <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="creation-adminUsername"
                    placeholder="unique_username"
                    value={creationFormData.adminUsername}
                    onChange={(e) => handleCreationInputChange("adminUsername", e.target.value)}
                    className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500">Must be unique across all schools</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creation-adminPhone" className="text-sm font-semibold text-gray-800">
                    Contact Phone
                  </Label>
                  <Input
                    id="creation-adminPhone"
                    placeholder="+251 XXX XXX XXX"
                    value={creationFormData.adminPhone}
                    onChange={(e) => handleCreationInputChange("adminPhone", e.target.value)}
                    className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500">For account recovery</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="creation-adminPassword" className="text-sm font-semibold text-gray-800">
                    Password <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="creation-adminPassword"
                      type={showCreationPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={creationFormData.adminPassword}
                      onChange={(e) => handleCreationInputChange("adminPassword", e.target.value)}
                      className="h-12 pr-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreationPassword(!showCreationPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCreationPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <div className={`w-2 h-2 rounded-full ${creationFormData.adminPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>At least 8 characters</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creation-adminConfirmPassword" className="text-sm font-semibold text-gray-800">
                    Confirm Password <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="creation-adminConfirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={creationFormData.adminConfirmPassword}
                    onChange={(e) => handleCreationInputChange("adminConfirmPassword", e.target.value)}
                    className={`h-12 border-gray-300 focus:ring-green-500 ${
                      creationFormData.adminConfirmPassword &&
                      creationFormData.adminPassword !== creationFormData.adminConfirmPassword
                        ? 'border-red-300 focus:border-red-500'
                        : 'focus:border-green-500'
                    }`}
                  />
                  {creationFormData.adminConfirmPassword && creationFormData.adminPassword !== creationFormData.adminConfirmPassword && (
                    <p className="text-xs text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Passwords do not match
                    </p>
                  )}
                  {creationFormData.adminConfirmPassword && creationFormData.adminPassword === creationFormData.adminConfirmPassword && creationFormData.adminPassword && (
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
                        {creationFormData.adminName || "Administrator Name"}
                      </div>
                      <div className="text-sm text-gray-600">
                        @{creationFormData.adminUsername || "username"}
                      </div>
                      <div className="flex items-center mt-1 space-x-2">
                        <Badge variant="outline" className="text-xs">
                          School Admin
                        </Badge>
                        {creationFormData.adminPassword && (
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
                          setCreationFormData(prev => ({
                            ...prev,
                            primaryColor: palette.primary,
                            secondaryColor: palette.secondary,
                          }));
                        }}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          creationFormData.primaryColor === palette.primary
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
                          if (creationFormData.primaryColor === color) {
                            setCreationFormData(prev => ({
                              ...prev,
                              secondaryColor: color,
                            }));
                          } else {
                            setCreationFormData(prev => ({
                              ...prev,
                              primaryColor: color,
                            }));
                          }
                        }}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          creationFormData.primaryColor === color || creationFormData.secondaryColor === color
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
                      <Label htmlFor="creation-primaryColor" className="text-sm font-medium text-gray-700">
                        Primary Color
                      </Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-gray-200 shadow-sm"
                          style={{ backgroundColor: creationFormData.primaryColor }}
                        />
                        <Input
                          id="creation-primaryColor"
                          type="color"
                          value={creationFormData.primaryColor}
                          onChange={(e) => handleCreationInputChange("primaryColor", e.target.value)}
                          className="flex-1 h-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="creation-secondaryColor" className="text-sm font-medium text-gray-700">
                        Secondary Color
                      </Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-gray-200 shadow-sm"
                          style={{ backgroundColor: creationFormData.secondaryColor }}
                        />
                        <Input
                          id="creation-secondaryColor"
                          type="color"
                          value={creationFormData.secondaryColor}
                          onChange={(e) => handleCreationInputChange("secondaryColor", e.target.value)}
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
                        style={{ backgroundColor: creationFormData.primaryColor }}
                      >
                        S
                      </div>

                      {/* Text Preview */}
                      <div className="flex-1">
                        <div
                          className="text-lg font-semibold"
                          style={{ color: creationFormData.primaryColor }}
                        >
                          Sample School Name
                        </div>
                        <div
                          className="text-sm"
                          style={{ color: creationFormData.secondaryColor }}
                        >
                          Professional Learning Platform
                        </div>
                      </div>

                      {/* Button Preview */}
                      <Button
                        size="sm"
                        style={{
                          backgroundColor: creationFormData.primaryColor,
                          borderColor: creationFormData.secondaryColor
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
                      <Label htmlFor="creation-timezone" className="text-sm font-semibold text-gray-800 flex items-center">
                        <Globe className="w-4 h-4 mr-2 text-blue-600" />
                        Timezone
                      </Label>
                      <Select
                        value={creationFormData.timezone}
                        onValueChange={(value) => handleCreationInputChange("timezone", value)}
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
                      <Label htmlFor="creation-currency" className="text-sm font-semibold text-gray-800 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                        Default Currency
                      </Label>
                      <Select
                        value={creationFormData.defaultCurrency}
                        onValueChange={(value) => handleCreationInputChange("defaultCurrency", value)}
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
                      <Label htmlFor="creation-language" className="text-sm font-semibold text-gray-800">
                        Default Language
                      </Label>
                      <Select
                        value={creationFormData.defaultLanguage}
                        onValueChange={(value) => handleCreationInputChange("defaultLanguage", value)}
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
                        <p className="text-sm text-gray-900">{creationFormData.name || "Not set"}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Administrator:</span>
                        <p className="text-sm text-gray-900">{creationFormData.adminName || "Not set"}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Contact:</span>
                        <p className="text-sm text-gray-900">{creationFormData.email || "Not set"}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Theme:</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: creationFormData.primaryColor }}
                          />
                          <span className="text-sm text-gray-900">Primary</span>
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: creationFormData.secondaryColor }}
                          />
                          <span className="text-sm text-gray-900">Secondary</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Region:</span>
                        <p className="text-sm text-gray-900">
                          {timezones.find(tz => tz.value === creationFormData.timezone)?.label || "Not set"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Currency:</span>
                        <p className="text-sm text-gray-900">
                          {currencies.find(curr => curr.value === creationFormData.defaultCurrency)?.label || "Not set"}
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      {/* Header */}
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 p-8 text-white"
      >
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
            >
              School Management
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-gray-300 text-lg"
            >
              Monitor and manage all schools in the platform
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-wrap gap-3"
          >
            <Link href="/super-admin/payments">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm">
                <Banknote className="w-4 h-4 mr-2" />
                View All Payments
              </Button>
            </Link>
            <Button
              onClick={() => setIsPaymentCalculatorOpen(true)}
              variant="outline"
              disabled={selectedSchools.length === 0}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Payments ({selectedSchools.length})
            </Button>
            <Button
              onClick={() => setIsPremiumPanelOpen(true)}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm"
            >
              <Crown className="w-4 h-4 mr-2" />
              Premium Features
            </Button>
            <Button
              onClick={() => setIsCreationPanelOpen(true)}
              className="bg-gradient-to-r from-white to-gray-200 text-gray-900 hover:from-gray-100 hover:to-gray-300 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create School
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-blue-900">Total Schools</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 mb-1">{schools.length}</div>
              <p className="text-xs text-blue-700 font-medium">Registered schools</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-100">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-green-900">Active Schools</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 mb-1">
                {schools.filter(s => s.status === "active").length}
              </div>
              <p className="text-xs text-green-700 font-medium">Currently active</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-orange-100">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-amber-900">Trial Schools</CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900 mb-1">
                {schools.filter(s => s.status === "trial").length}
              </div>
              <p className="text-xs text-amber-700 font-medium">On trial period</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-violet-100">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-purple-900">Total Students</CardTitle>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 mb-1">
                {schools.reduce((acc, school) => acc + school._count.students, 0)}
              </div>
              <p className="text-xs text-purple-700 font-medium">Across all schools</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
              <Building2 className="w-6 h-6 mr-3 text-gray-600" />
              Schools Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="flex flex-col lg:flex-row gap-4 mb-8"
            >
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search schools by name, email, or slug..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-2 border-gray-200 focus:border-gray-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-300"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-56 h-12 border-2 border-gray-200 focus:border-gray-400 rounded-xl bg-white/50 backdrop-blur-sm">
                  <Filter className="w-5 h-5 mr-2 text-gray-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-gray-200 rounded-xl bg-white/95 backdrop-blur-sm">
                  <SelectItem value="all" className="hover:bg-gray-50">All Status</SelectItem>
                  <SelectItem value="trial" className="hover:bg-gray-50">Trial</SelectItem>
                  <SelectItem value="active" className="hover:bg-gray-50">Active</SelectItem>
                  <SelectItem value="inactive" className="hover:bg-gray-50">Inactive</SelectItem>
                  <SelectItem value="suspended" className="hover:bg-gray-50">Suspended</SelectItem>
                  <SelectItem value="expired" className="hover:bg-gray-50">Expired</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Schools Grid */}
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    className="animate-pulse"
                  >
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center space-y-2">
                            <div className="h-8 bg-gray-200 rounded mx-auto w-8"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                          </div>
                          <div className="text-center space-y-2">
                            <div className="h-8 bg-gray-200 rounded mx-auto w-8"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                          </div>
                          <div className="text-center space-y-2">
                            <div className="h-8 bg-gray-200 rounded mx-auto w-8"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : schools.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16"
              >
                <div className="relative mx-auto w-24 h-24 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full opacity-20"></div>
                  <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-full border-2 border-gray-300">
                    <Building2 className="w-12 h-12 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No schools found</h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search criteria or filters to find schools"
                    : "Get started by creating your first school in the platform"
                  }
                </p>
                {(!searchTerm && statusFilter === "all") && (
                  <Button
                    onClick={() => setIsCreationPanelOpen(true)}
                    className="mt-6 bg-gradient-to-r from-gray-800 to-gray-600 hover:from-gray-900 hover:to-gray-700 text-white"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First School
                  </Button>
                )}
              </motion.div>
            ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {schools.map((school, index) => (
                <motion.div
                  key={school.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  whileHover={{
                    y: -8,
                    scale: 1.02,
                    transition: { type: "spring", stiffness: 300, damping: 20 }
                  }}
                >
                  <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
                    {/* Gradient overlay for hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <CardHeader className="pb-4 relative">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Checkbox
                              checked={selectedSchools.includes(school.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSchools(prev => [...prev, school.id]);
                                } else {
                                  setSelectedSchools(prev => prev.filter(id => id !== school.id));
                                }
                              }}
                              className="border-2 border-gray-300 data-[state=checked]:bg-gray-800 data-[state=checked]:border-gray-800"
                            />
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="relative"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-600 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                            <Avatar className="w-12 h-12 relative border-2 border-white shadow-lg">
                              <AvatarFallback className="bg-gradient-to-br from-gray-800 to-gray-600 text-white font-bold text-lg">
                                {school.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </motion.div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-xl font-bold text-gray-900 truncate group-hover:text-gray-700 transition-colors duration-300">
                              {school.name}
                            </CardTitle>
                            <p className="text-sm text-gray-500 truncate font-medium">@{school.slug}</p>
                          </div>
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-gray-100 rounded-full w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                              >
                                <MoreHorizontal className="w-4 h-4 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSchoolForDetails(school.id);
                                setIsDetailsPanelOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                console.log("Edit clicked for school:", school.id, school.name);
                                console.log("Setting edit panel state...");
                                setSelectedSchoolForEdit(school.id);
                                setIsEditPanelOpen(true);
                                console.log("Edit panel should now be open");
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit School
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSchoolForDetails(school.id);
                                setIsDetailsPanelOpen(true);
                                // TODO: Focus on admin reset password section
                              }}
                            >
                              <Key className="w-4 h-4 mr-2" />
                              Reset Admin Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {school.status === "active" ? (
                              <DropdownMenuItem
                                className="text-orange-600"
                                onClick={() => {
                                  setSelectedSchoolForDetails(school.id);
                                  setIsDetailsPanelOpen(true);
                                  // TODO: Focus on suspend action
                                }}
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Suspend School
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => {
                                  setSelectedSchoolForDetails(school.id);
                                  setIsDetailsPanelOpen(true);
                                  // TODO: Focus on activate action
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Activate School
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedSchoolForDetails(school.id);
                                setIsDetailsPanelOpen(true);
                                // TODO: Focus on delete action
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete School
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </motion.div>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="flex items-center justify-between mt-4"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(school.status)}
                            {getRegistrationBadge(school)}
                          </div>

                          {/* Status Toggle Button */}
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              onClick={() => handleStatusToggle(school)}
                              disabled={updatingStatus === school.id}
                              size="sm"
                              variant={school.status === 'active' ? 'destructive' : 'default'}
                              className={`text-xs px-3 py-1 h-7 ${
                                school.status === 'active'
                                  ? 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300'
                                  : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300'
                              }`}
                            >
                              {updatingStatus === school.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                school.status === 'active' ? 'Deactivate' : 'Activate'
                              )}
                            </Button>
                          </motion.div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500 font-medium">
                            Created {new Date(school.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    </CardHeader>

                    <CardContent className="space-y-6 relative">
                      {/* Contact Info */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        className="space-y-2 text-sm"
                      >
                        {school.email && (
                          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-700 truncate font-medium">{school.email}</span>
                          </div>
                        )}
                        {school.phone && (
                          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-700 font-medium">{school.phone}</span>
                          </div>
                        )}
                      </motion.div>

                      {/* Stats */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                        className="grid grid-cols-3 gap-4"
                      >
                        <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200/50">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="flex items-center justify-center mb-2"
                          >
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                          </motion.div>
                          <div className="text-xl font-bold text-blue-900 mb-1">
                            {school._count.students}
                          </div>
                          <div className="text-xs text-blue-700 font-medium">Students</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200/50">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="flex items-center justify-center mb-2"
                          >
                            <div className="p-2 bg-green-500/10 rounded-lg">
                              <BookOpen className="w-5 h-5 text-green-600" />
                            </div>
                          </motion.div>
                          <div className="text-xl font-bold text-green-900 mb-1">
                            {school._count.teachers}
                          </div>
                          <div className="text-xs text-green-700 font-medium">Teachers</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200/50">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="flex items-center justify-center mb-2"
                          >
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                              <Shield className="w-5 h-5 text-purple-600" />
                            </div>
                          </motion.div>
                          <div className="text-xl font-bold text-purple-900 mb-1">
                            {school._count.admins}
                          </div>
                          <div className="text-xs text-purple-700 font-medium">Admins</div>
                        </div>
                      </motion.div>

                      {/* Subscription & Pricing */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                        className="pt-4 border-t border-gray-200/50 space-y-3"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 font-medium">Subscription:</span>
                          <Badge variant="outline" className="text-xs font-semibold border-gray-300 text-gray-700">
                            {getSubscriptionStatus(school.subscription)}
                          </Badge>
                        </div>
                        {school.pricingTier && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6, duration: 0.3 }}
                            className="flex items-center justify-between text-sm p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200/50"
                          >
                            <span className="text-gray-700 font-medium">Plan:</span>
                            <div className="text-right">
                              <div className="font-bold text-gray-900 text-base">{school.pricingTier.name}</div>
                              <div className="text-xs text-gray-600 font-medium">
                                {formatCurrency(school.pricingTier.monthlyFee, school.pricingTier.currency)}/month
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* School Creation Modal */}
      <AnimatePresence>
        {isCreationPanelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setIsCreationPanelOpen(false)}
          >
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-4 left-4 right-4 bottom-4 bg-white rounded-lg shadow-xl z-50 overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
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
                <Button variant="ghost" size="sm" onClick={() => {
                  setIsCreationPanelOpen(false);
                  // Reset form when closing
                  setCreationFormData({
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
                  setCreationCurrentStep(1);
                  setCreationError(null);
                  setCreationSuccess(false);
                  setShowCreationPassword(false);
                }}>
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
                          animate={{
                            backgroundColor: step <= creationCurrentStep ? "#3B82F6" : "#E5E7EB",
                            color: step <= creationCurrentStep ? "#FFFFFF" : "#6B7280",
                          }}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm"
                        >
                          {step <= creationCurrentStep ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            step
                          )}
                        </motion.div>
                        {step < 3 && (
                          <motion.div
                            animate={{
                              backgroundColor: step < creationCurrentStep ? "#3B82F6" : "#E5E7EB",
                            }}
                            className="flex-1 h-1 mx-4 rounded-full"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-xs font-medium text-gray-600">
                    <div className={`text-center ${creationCurrentStep === 1 ? "text-blue-600" : ""}`}>
                      <div>School Details</div>
                      <div className="text-xs text-gray-500 mt-1">Basic information</div>
                    </div>
                    <div className={`text-center ${creationCurrentStep === 2 ? "text-blue-600" : ""}`}>
                      <div>Admin Account</div>
                      <div className="text-xs text-gray-500 mt-1">Access credentials</div>
                    </div>
                    <div className={`text-center ${creationCurrentStep === 3 ? "text-blue-600" : ""}`}>
                      <div>Configuration</div>
                      <div className="text-xs text-gray-500 mt-1">Branding & settings</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {creationSuccess ? (
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
                    {renderCreationStepContent()}

                    {/* Error Alert */}
                    <AnimatePresence>
                      {creationError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-6"
                        >
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{creationError}</AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>

              {/* Footer */}
              {!creationSuccess && (
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-6">
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={creationCurrentStep === 1 ? () => {
                        setIsCreationPanelOpen(false);
                        // Reset form when canceling
                        setCreationFormData({
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
                        setCreationCurrentStep(1);
                        setCreationError(null);
                        setCreationSuccess(false);
                        setShowCreationPassword(false);
                      } : handleCreationBack}
                      disabled={creationLoading}
                      className="flex items-center space-x-2 px-6 py-3"
                    >
                      {creationCurrentStep === 1 ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <ChevronLeft className="w-4 h-4" />
                      )}
                      <span>{creationCurrentStep === 1 ? "Cancel" : "Back"}</span>
                    </Button>

                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        Step {creationCurrentStep} of 3
                      </div>

                      {creationCurrentStep < 3 ? (
                        <Button
                          onClick={handleCreationNext}
                          disabled={creationLoading}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2 px-6 py-3"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleCreationSubmit}
                          disabled={creationLoading}
                          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 flex items-center space-x-2 px-8 py-3 text-lg"
                        >
                          {creationLoading ? (
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Features Panel */}
      <PremiumFeaturesPanel
        isOpen={isPremiumPanelOpen}
        onClose={() => setIsPremiumPanelOpen(false)}
      />

      {/* Payment Calculator */}
      {isPaymentCalculatorOpen && (
        <PaymentCalculator
          selectedSchoolIds={selectedSchools}
          onClose={() => setIsPaymentCalculatorOpen(false)}
        />
      )}

      {/* School Details Panel */}
      <SchoolDetailsPanel
        isOpen={isDetailsPanelOpen}
        onClose={() => {
          setIsDetailsPanelOpen(false);
          setSelectedSchoolForDetails(null);
        }}
        schoolId={selectedSchoolForDetails}
        onSchoolUpdated={() => {
          fetchSchools(); // Refresh the schools list
        }}
      />

      {/* School Edit Panel */}
      <SchoolEditPanel
        isOpen={isEditPanelOpen}
        onClose={() => {
          setIsEditPanelOpen(false);
          setSelectedSchoolForEdit(null);
        }}
        schoolId={selectedSchoolForEdit}
        onSchoolUpdated={() => {
          fetchSchools(); // Refresh the schools list
        }}
      />

      {/* School Creation Side Panel */}
      <SchoolCreationPanel
        isOpen={isCreationPanelOpen}
        onClose={() => setIsCreationPanelOpen(false)}
        onSuccess={() => {
          fetchSchools();
          setIsCreationPanelOpen(false);
        }}
      />
    </motion.div>
  );
}
