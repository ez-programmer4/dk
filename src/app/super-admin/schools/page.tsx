"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SchoolsFilters } from "./components/SchoolsFilters";
import { SchoolsTable } from "./components/SchoolsTable";
import { SchoolCreationModal } from "./components/SchoolCreationModal";
import { PlanChangeModal } from "./components/PlanChangeModal";

interface School {
  id: string;
  name: string;
  slug: string;
  email: string;
  status: "active" | "inactive" | "suspended";
  subscriptionTier: string;
  maxStudents: number;
  currentStudentCount: number;
  createdAt: string;
  planId?: string;
  _count: {
    admins: number;
    teachers: number;
    students: number;
  };
  revenue: number;
  primaryColor?: string;
  secondaryColor?: string;
}

interface Plan {
  id: string;
  name: string;
  basePrice: number;
  currency: string;
  perStudentPrice: number;
  isActive: boolean;
  features?: string[];
  maxStudents?: number;
  description?: string;
}

export default function SuperAdminSchools() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Enhanced form state for new school with step-by-step wizard
  const [currentStep, setCurrentStep] = useState(1);
  const [newSchool, setNewSchool] = useState({
    // School Basic Info
    name: "",
    email: "",
    phone: "",
    address: "",
    slug: "",
    timezone: "Africa/Addis_Ababa",
    defaultCurrency: "ETB",
    defaultLanguage: "en",
    // Branding
    logoUrl: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#1F2937",
    // Subscription & Limits
    subscriptionTier: "trial",
    maxStudents: "50",
    planId: "",
    billingCycle: "monthly",
    trialDays: "30",
    // Feature Flags
    features: {
      analytics: true,
      reports: true,
      notifications: true,
      integrations: false,
      apiAccess: false,
      customDomain: false,
    },
    // Integrations
    telegramBotToken: "",
    // Admin details
    adminName: "",
    adminUsername: "",
    adminPassword: "",
    adminConfirmPassword: "",
    adminEmail: "",
    adminPhone: "",
  });

  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  // Plan change modal
  const [planChangeModal, setPlanChangeModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);

  // Fetch available plans
  const [plans, setPlans] = useState<any[]>([]);

  // Additional state for enhanced features
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetch("/api/super-admin/plans")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPlans(data.plans);
        }
      })
      .catch((err) => console.error("Failed to fetch plans:", err));
  }, []);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setNewSchool({ ...newSchool, name, slug });
    checkSlugAvailability(slug);
  };

  // Check slug availability
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }
    setSlugChecking(true);
    try {
      const response = await fetch(
        `/api/super-admin/schools/check-slug?slug=${slug}`
      );
      const data = await response.json();
      setSlugAvailable(data.available);
    } catch (error) {
      console.error("Failed to check slug:", error);
      setSlugAvailable(null);
    } finally {
      setSlugChecking(false);
    }
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    const errors: { [key: string]: string } = {};
    if (step === 1) {
      if (!newSchool.name.trim()) {
        errors.name = "School name is required";
      } else if (newSchool.name.trim().length < 2) {
        errors.name = "School name must be at least 2 characters";
      }
      if (!newSchool.slug.trim()) {
        errors.slug = "School slug is required";
      } else if (!/^[a-z0-9-]+$/.test(newSchool.slug)) {
        errors.slug =
          "Slug can only contain lowercase letters, numbers, and hyphens";
      } else if (slugAvailable === false) {
        errors.slug = "This slug is already taken";
      }
      if (!newSchool.email.trim()) {
        errors.email = "Email address is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newSchool.email)) {
        errors.email = "Please enter a valid email address";
      }
    } else if (step === 2) {
      if (!newSchool.adminName.trim()) {
        errors.adminName = "Admin name is required";
      } else if (newSchool.adminName.trim().length < 2) {
        errors.adminName = "Admin name must be at least 2 characters";
      }
      if (!newSchool.adminUsername.trim()) {
        errors.adminUsername = "Admin username is required";
      } else if (newSchool.adminUsername.trim().length < 3) {
        errors.adminUsername = "Admin username must be at least 3 characters";
      }
      if (!newSchool.adminPassword) {
        errors.adminPassword = "Password is required";
      } else if (newSchool.adminPassword.length < 8) {
        errors.adminPassword = "Password must be at least 8 characters";
      } else if (
        !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newSchool.adminPassword)
      ) {
        errors.adminPassword =
          "Password must contain uppercase, lowercase, and number";
      }
      if (newSchool.adminPassword !== newSchool.adminConfirmPassword) {
        errors.adminConfirmPassword = "Passwords do not match";
      }
      if (
        newSchool.adminEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newSchool.adminEmail)
      ) {
        errors.adminEmail = "Please enter a valid email address";
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle step navigation
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    return score;
  };

  const passwordStrengthText = (score: number) => {
    const texts = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const colors = [
      "text-red-500",
      "text-orange-500",
      "text-yellow-500",
      "text-blue-500",
      "text-green-500",
    ];
    return {
      text: texts[score - 1] || "Very Weak",
      color: colors[score - 1] || "text-red-500",
    };
  };

  // Handle school creation
  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) {
      setErrorMessage("Please fix all validation errors before proceeding");
      setTimeout(() => setErrorMessage(""), 5000);
      return;
    }

    setCreating(true);
    setErrorMessage("");

    try {
      const schoolData = {
        name: newSchool.name,
        slug: newSchool.slug,
        email: newSchool.email,
        phone: newSchool.phone,
        address: newSchool.address,
        adminName: newSchool.adminName,
        adminUsername: newSchool.adminUsername,
        adminPassword: newSchool.adminPassword,
        adminEmail: newSchool.adminEmail,
        adminPhone: newSchool.adminPhone,
        planId: newSchool.planId,
        telegramBotToken: newSchool.telegramBotToken,
        timezone: newSchool.timezone,
        defaultCurrency: newSchool.defaultCurrency,
        defaultLanguage: newSchool.defaultLanguage,
        logoUrl: newSchool.logoUrl,
        primaryColor: newSchool.primaryColor,
        secondaryColor: newSchool.secondaryColor,
        maxStudents: parseInt(newSchool.maxStudents) || 50,
        billingCycle: newSchool.billingCycle,
        features: newSchool.features,
      };

      const response = await fetch("/api/super-admin/schools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(schoolData),
      });

      if (response.ok) {
        setShowSuccessAnimation(true);
        setSuccessMessage(`School "${newSchool.name}" created successfully!`);
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setCurrentStep(1);
          setNewSchool({
            name: "",
            email: "",
            phone: "",
            address: "",
            slug: "",
            planId: "",
            telegramBotToken: "",
            adminName: "",
            adminUsername: "",
            adminPassword: "",
            adminConfirmPassword: "",
            adminEmail: "",
            adminPhone: "",
            timezone: "Africa/Addis_Ababa",
            defaultCurrency: "ETB",
            defaultLanguage: "en",
            logoUrl: "",
            primaryColor: "#3B82F6",
            secondaryColor: "#1F2937",
            subscriptionTier: "trial",
            maxStudents: "50",
            billingCycle: "monthly",
            trialDays: "30",
            features: {
              analytics: true,
              reports: true,
              notifications: true,
              integrations: false,
              apiAccess: false,
              customDomain: false,
            },
          });
          setValidationErrors({});
          setShowSuccessAnimation(false);
          setSuccessMessage("");
          fetchSchools();
        }, 2000);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to create school");
        setTimeout(() => setErrorMessage(""), 5000);
      }
    } catch (error) {
      console.error("Failed to create school:", error);
      setErrorMessage("Failed to create school. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setCreating(false);
    }
  };

  // Fetch schools
  const fetchSchools = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/super-admin/schools?page=${currentPage}&search=${searchTerm}&status=${statusFilter}`
      );
      const data = await response.json();
      if (data.success) {
        setSchools(data.schools);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch schools:", error);
    } finally {
      setLoading(false);
    }
  };

  // Export schools
  const exportSchools = () => {
    // Implementation for CSV export
    console.log("Exporting schools...");
  };

  // Handle school actions
  const handleViewSchool = (school: School) => {
    router.push(`/super-admin/schools/${school.id}`);
  };

  const handleEditSchool = (school: School) => {
    // Implementation for editing school
    console.log("Editing school:", school);
  };

  const handleDeleteSchool = (school: School) => {
    // Implementation for deleting school
    console.log("Deleting school:", school);
  };

  const handleChangePlan = (school: School) => {
    setSelectedSchool(school);
    setPlanChangeModal(true);
  };

  // Filtered schools
  const filteredSchools = schools.filter(
    (school) =>
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchSchools();
  }, [currentPage, searchTerm, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-r from-white via-slate-50/95 to-gray-50/90 backdrop-blur-xl shadow-xl border-b border-white/30">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center space-x-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-30" />
                <div className="relative p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                  School Management
                </h1>
                <p className="text-gray-600 mt-3 text-xl font-medium">
                  Create and manage schools on your multi-tenant platform
                </p>
              </div>
            </motion.div>

            <SchoolCreationModal
              isOpen={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
              onSuccess={fetchSchools}
              plans={plans}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 backdrop-blur-sm border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-600 group-hover:text-indigo-600 transition-colors">
                <span>Total Schools</span>
                <Crown className="w-5 h-5 text-indigo-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-gray-900 group-hover:text-indigo-700 transition-colors">
                {schools.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Active institutions</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-600 group-hover:text-purple-600 transition-colors">
                <span>Total Students</span>
                <Users className="w-5 h-5 text-purple-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-gray-900 group-hover:text-purple-700 transition-colors">
                {schools.reduce(
                  (acc, school) => acc + school._count.students,
                  0
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Across all schools</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-600 group-hover:text-emerald-600 transition-colors">
                <span>Total Revenue</span>
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-gray-900 group-hover:text-emerald-700 transition-colors">
                $
                {schools
                  .reduce((acc, school) => acc + school.revenue, 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Monthly recurring</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-600 group-hover:text-orange-600 transition-colors">
                <span>Growth Rate</span>
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-gray-900 group-hover:text-orange-700 transition-colors">
                +12%
              </div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SchoolsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() =>
            setShowAdvancedFilters(!showAdvancedFilters)
          }
          onExport={exportSchools}
          onRefresh={fetchSchools}
        />

        <SchoolsTable
          schools={filteredSchools}
          loading={loading}
          onViewSchool={handleViewSchool}
          onEditSchool={handleEditSchool}
          onDeleteSchool={handleDeleteSchool}
          onChangePlan={handleChangePlan}
        />

        <PlanChangeModal
          isOpen={planChangeModal}
          onOpenChange={setPlanChangeModal}
          school={selectedSchool}
          plans={plans}
          onSuccess={fetchSchools}
        />
      </div>
    </div>
  );
}
