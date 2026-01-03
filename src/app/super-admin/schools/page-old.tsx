"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, BarChart3, Users, DollarSign, TrendingUp, Activity } from "lucide-react";
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
  status: 'active' | 'inactive' | 'suspended';
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
  const [newPlanId, setNewPlanId] = useState("");

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
      "text-red-400",
      "text-yellow-500",
      "text-blue-500",
      "text-green-500",
    ];
    return {
      text: texts[score - 1] || "Very Weak",
      color: colors[score - 1] || "text-red-500",
    };
  };

  useEffect(() => {
    fetchSchools();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
      });
      const response = await fetch(`/api/super-admin/schools?${params}`);
      const data = await response.json();
      if (data.success) {
        setSchools(data.schools);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch schools:", error);
      setErrorMessage("Failed to fetch schools. Please refresh the page.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (schoolId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setSuccessMessage(`School status updated to ${newStatus}`);
        setTimeout(() => setSuccessMessage(""), 3000);
        fetchSchools();
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to update status");
        setTimeout(() => setErrorMessage(""), 5000);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      setErrorMessage("Failed to update school status");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const handleExportSchools = () => {
    const csvContent = [
      [
        "Name",
        "Slug",
        "Email",
        "Status",
        "Plan",
        "Students",
        "Teachers",
        "Admins",
        "Revenue",
        "Created",
      ],
      ...schools.map((school) => [
        school.name,
        school.slug,
        school.email,
        school.status,
        plans.find((p) => p.id === school.planId)?.name || "No Plan",
        school._count.students.toString(),
        school._count.teachers.toString(),
        school._count.admins.toString(),
        school.revenue.toString(),
        new Date(school.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schools-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setSuccessMessage("Schools exported successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    // Final validation
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
          fetchSchools(); // Refresh the list
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

  const handleDeleteSchool = async (schoolId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this school? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchSchools(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to delete school:", error);
    }
  };

  const handlePlanChange = async () => {
    if (!selectedSchool || !newPlanId) return;
    try {
      const response = await fetch(
        `/api/super-admin/schools/${selectedSchool.id}/plan`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ planId: newPlanId }),
        }
      );
      if (response.ok) {
        setPlanChangeModal(false);
        setSelectedSchool(null);
        setNewPlanId("");
        fetchSchools(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || "Failed to change plan");
      }
    } catch (error) {
      console.error("Failed to change plan:", error);
      alert("Failed to change plan");
    }
  };

  const openPlanChangeModal = (school: any) => {
    setSelectedSchool(school);
    setNewPlanId(school.planId || "");
    setPlanChangeModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Suspended
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Step 1: School Information */}
            <div className="space-y-5">
              <div className="space-y-3">
                <Label
                  htmlFor="name"
                  className="text-sm font-bold text-gray-800 flex items-center space-x-2"
                >
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <span>School Name *</span>
                </Label>
                <div className="relative group">
                  <Input
                    id="name"
                    value={newSchool.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter your school name"
                    className={`h-16 pl-5 pr-5 border-3 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl focus:shadow-2xl bg-white text-gray-900 font-semibold text-lg ${
                      validationErrors.name
                        ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                        : "border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 hover:border-indigo-400"
                    }`}
                  />
                  {newSchool.name && !validationErrors.name && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </motion.div>
                  )}
                </div>
                {validationErrors.name && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-700 font-medium">
                      {validationErrors.name}
                    </span>
                  </motion.div>
                )}
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="slug"
                  className="text-sm font-bold text-gray-800 flex items-center space-x-2"
                >
                  <div className="p-1.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <span>School Slug *</span>
                </Label>
                <div className="relative group">
                  <Input
                    id="slug"
                    value={newSchool.slug}
                    onChange={(e) => {
                      const slug = e.target.value;
                      setNewSchool({ ...newSchool, slug });
                      checkSlugAvailability(slug);
                    }}
                    placeholder="your-school-slug"
                    className={`h-16 pl-5 pr-14 border-3 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl focus:shadow-2xl bg-white text-gray-900 font-mono font-semibold text-lg ${
                      validationErrors.slug || slugAvailable === false
                        ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                        : slugAvailable === true
                        ? "border-green-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                        : "border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 hover:border-indigo-400"
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    {slugChecking ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <RefreshCw className="h-5 w-5 text-indigo-500" />
                      </motion.div>
                    ) : slugAvailable !== null ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        {slugAvailable ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </motion.div>
                    ) : null}
                  </div>
                </div>

                {/* Enhanced validation messages */}
                {validationErrors.slug && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-700 font-medium">
                      {validationErrors.slug}
                    </span>
                  </motion.div>
                )}

                {slugAvailable === true && !validationErrors.slug && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-xl"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-green-700 font-medium">
                      ✓ Slug is available
                    </span>
                  </motion.div>
                )}

                {slugAvailable === false && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-700 font-medium">
                      Slug is already taken
                    </span>
                  </motion.div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs text-blue-700 font-medium flex items-center space-x-2">
                    <Info className="w-3 h-3 flex-shrink-0" />
                    <span>
                      Auto-generated from school name, but can be edited
                    </span>
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="email"
                  className="text-sm font-bold text-gray-800 flex items-center space-x-2"
                >
                  <div className="p-1.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <span>Email Address *</span>
                </Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    value={newSchool.email}
                    onChange={(e) =>
                      setNewSchool({
                        ...newSchool,
                        email: e.target.value,
                      })
                    }
                    placeholder="admin@school.com"
                    className={`h-16 pl-5 pr-5 border-3 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl focus:shadow-2xl bg-white text-gray-900 font-semibold text-lg ${
                      validationErrors.email
                        ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                        : "border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 hover:border-indigo-400"
                    }`}
                  />
                  {newSchool.email &&
                    !validationErrors.email &&
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newSchool.email) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </motion.div>
                    )}
                </div>
                {validationErrors.email && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-700 font-medium">
                      {validationErrors.email}
                    </span>
                  </motion.div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="phone"
                    className="text-sm font-bold text-gray-800 flex items-center space-x-2"
                  >
                    <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <span>Phone Number</span>
                  </Label>
                  <Input
                    id="phone"
                    value={newSchool.phone}
                    onChange={(e) =>
                      setNewSchool({
                        ...newSchool,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+251911123456"
                    className="h-16 px-5 border-3 border-gray-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 hover:border-cyan-400 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl focus:shadow-2xl bg-white text-gray-900 font-semibold text-lg"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="timezone"
                    className="text-sm font-bold text-gray-800 flex items-center space-x-2"
                  >
                    <div className="p-1.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg">
                      <Globe className="w-4 h-4 text-white" />
                    </div>
                    <span>Timezone</span>
                  </Label>
                  <select
                    id="timezone"
                    value={newSchool.timezone}
                    onChange={(e) =>
                      setNewSchool({ ...newSchool, timezone: e.target.value })
                    }
                    className="w-full h-16 px-5 py-4 border-3 border-gray-300 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 hover:border-pink-400 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl focus:shadow-2xl bg-white text-gray-700 font-semibold text-lg"
                  >
                    <option value="Africa/Addis_Ababa">
                      🇪🇹 Africa/Addis_Ababa (EAT)
                    </option>
                    <option value="Africa/Cairo">🇪🇬 Africa/Cairo (EET)</option>
                    <option value="Africa/Johannesburg">
                      🇿🇦 Africa/Johannesburg (SAST)
                    </option>
                    <option value="Africa/Lagos">🇳🇬 Africa/Lagos (WAT)</option>
                    <option value="America/New_York">
                      🇺🇸 America/New_York (EST)
                    </option>
                    <option value="America/Los_Angeles">
                      🇺🇸 America/Los_Angeles (PST)
                    </option>
                    <option value="Europe/London">
                      🇬🇧 Europe/London (GMT)
                    </option>
                    <option value="Asia/Dubai">🇦🇪 Asia/Dubai (GST)</option>
                    <option value="Asia/Tokyo">🇯🇵 Asia/Tokyo (JST)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="defaultCurrency"
                    className="text-sm font-bold text-gray-800 flex items-center space-x-2"
                  >
                    <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                      <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <span>Default Currency</span>
                  </Label>
                  <select
                    id="defaultCurrency"
                    value={newSchool.defaultCurrency}
                    onChange={(e) =>
                      setNewSchool({
                        ...newSchool,
                        defaultCurrency: e.target.value,
                      })
                    }
                    className="w-full h-16 px-5 py-4 border-3 border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 hover:border-emerald-400 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl focus:shadow-2xl bg-white text-gray-700 font-semibold text-lg"
                  >
                    <option value="ETB">🇪🇹 ETB - Ethiopian Birr</option>
                    <option value="USD">🇺🇸 USD - US Dollar</option>
                    <option value="EUR">🇪🇺 EUR - Euro</option>
                    <option value="GBP">🇬🇧 GBP - British Pound</option>
                    <option value="KES">🇰🇪 KES - Kenyan Shilling</option>
                    <option value="NGN">🇳🇬 NGN - Nigerian Naira</option>
                    <option value="ZAR">🇿🇦 ZAR - South African Rand</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="defaultLanguage"
                    className="text-sm font-bold text-gray-800 flex items-center space-x-2"
                  >
                    <div className="p-1.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                      <Globe className="w-4 h-4 text-white" />
                    </div>
                    <span>Default Language</span>
                  </Label>
                  <select
                    id="defaultLanguage"
                    value={newSchool.defaultLanguage}
                    onChange={(e) =>
                      setNewSchool({
                        ...newSchool,
                        defaultLanguage: e.target.value,
                      })
                    }
                    className="w-full h-16 px-5 py-4 border-3 border-gray-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 hover:border-orange-400 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl focus:shadow-2xl bg-white text-gray-700 font-semibold text-lg"
                  >
                    <option value="en">🇺🇸 English</option>
                    <option value="am">🇪🇹 አማርኛ (Amharic)</option>
                    <option value="fr">🇫🇷 Français (French)</option>
                    <option value="ar">🇸🇦 العربية (Arabic)</option>
                    <option value="sw">🇰🇪 Kiswahili (Swahili)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="address"
                  className="text-sm font-bold text-gray-800 flex items-center space-x-2"
                >
                  <div className="p-1.5 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <span>Address</span>
                </Label>
                <Textarea
                  id="address"
                  value={newSchool.address}
                  onChange={(e) =>
                    setNewSchool({
                      ...newSchool,
                      address: e.target.value,
                    })
                  }
                  placeholder="Enter complete school address..."
                  rows={4}
                  className="px-5 py-4 border-3 border-gray-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 hover:border-yellow-400 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl focus:shadow-2xl bg-white text-gray-900 font-semibold text-lg resize-none"
                />
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Step 2: Branding & Admin Setup */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gray-200 rounded-xl shadow-lg">
                    <Sparkles className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Branding
                    </h3>
                    <p className="text-sm text-gray-600">
                      Customize your school's visual identity
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="logoUrl"
                      className="text-sm font-bold text-gray-800 flex items-center space-x-2"
                    >
                      <div className="p-1.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg">
                        <ImageIcon className="w-4 h-4 text-white" />
                      </div>
                      <span>Logo URL</span>
                    </Label>
                    <div className="relative group">
                      <Input
                        id="logoUrl"
                        value={newSchool.logoUrl}
                        onChange={(e) =>
                          setNewSchool({
                            ...newSchool,
                            logoUrl: e.target.value,
                          })
                        }
                        placeholder="https://example.com/logo.png"
                        className="h-14 pl-4 pr-12 border-2 border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 hover:border-pink-300 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg bg-white text-gray-900 font-medium"
                      />
                      {newSchool.logoUrl && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          <img
                            src={newSchool.logoUrl}
                            alt="Logo preview"
                            className="w-8 h-8 rounded-lg object-cover border-2 border-pink-200 shadow-md"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        </motion.div>
                      )}
                    </div>
                    {newSchool.logoUrl && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200"
                      >
                        <p className="text-sm text-pink-700 flex items-center space-x-2 font-medium">
                          <Info className="w-4 h-4 flex-shrink-0" />
                          <span>
                            Logo preview will appear in the school dashboard
                          </span>
                        </p>
                      </motion.div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="primaryColor"
                      className="text-sm font-bold text-gray-800 flex items-center space-x-2"
                    >
                      <div className="p-1.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                        <Palette className="w-4 h-4 text-white" />
                      </div>
                      <span>Primary Color</span>
                    </Label>
                    <div className="flex items-center space-x-4">
                      <div className="relative group">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={newSchool.primaryColor}
                          onChange={(e) =>
                            setNewSchool({
                              ...newSchool,
                              primaryColor: e.target.value,
                            })
                          }
                          className="w-16 h-14 p-1 border-2 border-gray-200 rounded-xl cursor-pointer shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                        />
                      </div>
                      <Input
                        type="text"
                        value={newSchool.primaryColor}
                        onChange={(e) =>
                          setNewSchool({
                            ...newSchool,
                            primaryColor: e.target.value,
                          })
                        }
                        placeholder="#RRGGBB"
                        className="flex-1 h-14 px-4 border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 hover:border-orange-300 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg bg-white text-gray-900 font-mono font-medium"
                      />
                      <motion.div
                        className="w-14 h-14 rounded-xl border-4 border-white shadow-lg ring-2 ring-gray-100"
                        style={{ backgroundColor: newSchool.primaryColor }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      />
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                      <p className="text-xs text-orange-700 font-medium flex items-center space-x-2">
                        <Info className="w-3 h-3 flex-shrink-0" />
                        <span>
                          This color will be used for primary buttons and
                          highlights
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <Label
                      htmlFor="secondaryColor"
                      className="text-sm font-bold text-gray-800 flex items-center space-x-2"
                    >
                      <div className="p-1.5 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg">
                        <Palette className="w-4 h-4 text-white" />
                      </div>
                      <span>Secondary Color</span>
                    </Label>
                    <div className="flex items-center space-x-4">
                      <div className="relative group">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={newSchool.secondaryColor}
                          onChange={(e) =>
                            setNewSchool({
                              ...newSchool,
                              secondaryColor: e.target.value,
                            })
                          }
                          className="w-16 h-14 p-1 border-2 border-gray-200 rounded-xl cursor-pointer shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300"
                        />
                      </div>
                      <Input
                        type="text"
                        value={newSchool.secondaryColor}
                        onChange={(e) =>
                          setNewSchool({
                            ...newSchool,
                            secondaryColor: e.target.value,
                          })
                        }
                        placeholder="#RRGGBB"
                        className="flex-1 h-14 px-4 border-2 border-gray-200 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 hover:border-yellow-300 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg bg-white text-gray-900 font-mono font-medium"
                      />
                      <motion.div
                        className="w-14 h-14 rounded-xl border-4 border-white shadow-lg ring-2 ring-gray-100"
                        style={{ backgroundColor: newSchool.secondaryColor }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      />
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                      <p className="text-xs text-yellow-700 font-medium flex items-center space-x-2">
                        <Info className="w-3 h-3 flex-shrink-0" />
                        <span>
                          This color will be used for secondary elements and
                          accents
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gray-200 rounded-xl shadow-lg">
                    <Crown className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Administrator Account
                    </h3>
                    <p className="text-sm text-gray-600">
                      Create the school's primary administrator
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="adminName"
                        className="text-sm font-bold text-white/90"
                      >
                        Admin Name *
                      </Label>
                      <Input
                        id="adminName"
                        value={newSchool.adminName}
                        onChange={(e) =>
                          setNewSchool({
                            ...newSchool,
                            adminName: e.target.value,
                          })
                        }
                        placeholder="Full name of school administrator"
                        className={`h-14 bg-white/10 border-2 backdrop-blur-sm text-white placeholder:text-white/40 transition-all duration-300 ${
                          validationErrors.adminName
                            ? "border-red-400/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
                            : "border-white/20 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/30"
                        } rounded-xl shadow-lg`}
                      />
                      {validationErrors.adminName && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-red-400 flex items-center space-x-2 font-medium"
                        >
                          <X className="w-4 h-4" />
                          <span>{validationErrors.adminName}</span>
                        </motion.p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="adminUsername"
                        className="text-sm font-bold text-white/90"
                      >
                        Admin Username *
                      </Label>
                      <Input
                        id="adminUsername"
                        value={newSchool.adminUsername}
                        onChange={(e) =>
                          setNewSchool({
                            ...newSchool,
                            adminUsername: e.target.value,
                          })
                        }
                        placeholder="admin_username"
                        className={`h-14 bg-white/10 border-2 backdrop-blur-sm text-white placeholder:text-white/40 font-mono transition-all duration-300 ${
                          validationErrors.adminUsername
                            ? "border-red-400/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
                            : "border-white/20 focus:border-pink-400/50 focus:ring-2 focus:ring-pink-400/30"
                        } rounded-xl shadow-lg`}
                      />
                      {validationErrors.adminUsername && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-red-400 flex items-center space-x-2 font-medium"
                        >
                          <X className="w-4 h-4" />
                          <span>{validationErrors.adminUsername}</span>
                        </motion.p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="adminPassword"
                      className="text-sm font-bold text-gray-800"
                    >
                      Admin Password *
                    </Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={newSchool.adminPassword}
                      onChange={(e) =>
                        setNewSchool({
                          ...newSchool,
                          adminPassword: e.target.value,
                        })
                      }
                      placeholder="Enter a strong password"
                      className={`h-14 px-4 border-2 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg bg-white text-gray-900 font-medium ${
                        validationErrors.adminPassword
                          ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                          : "border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 hover:border-indigo-300"
                      }`}
                    />
                    {newSchool.adminPassword && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                            <motion.div
                              className={`h-3 rounded-full transition-all duration-500 ${
                                getPasswordStrength(newSchool.adminPassword) <=
                                2
                                  ? "bg-gradient-to-r from-red-400 to-red-500"
                                  : getPasswordStrength(
                                      newSchool.adminPassword
                                    ) <= 3
                                  ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                                  : "bg-gradient-to-r from-emerald-400 to-emerald-500"
                              }`}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${
                                  (getPasswordStrength(
                                    newSchool.adminPassword
                                  ) /
                                    5) *
                                  100
                                }%`,
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <div
                            className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold ${
                              getPasswordStrength(newSchool.adminPassword) <= 2
                                ? "bg-red-100 text-red-700"
                                : getPasswordStrength(
                                    newSchool.adminPassword
                                  ) <= 3
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            <Shield className="w-3 h-3" />
                            <span>
                              {
                                passwordStrengthText(
                                  getPasswordStrength(newSchool.adminPassword)
                                ).text
                              }
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-5 gap-1 text-xs">
                          {[
                            {
                              label: "8+",
                              met: newSchool.adminPassword.length >= 8,
                            },
                            {
                              label: "a-z",
                              met: /[a-z]/.test(newSchool.adminPassword),
                            },
                            {
                              label: "A-Z",
                              met: /[A-Z]/.test(newSchool.adminPassword),
                            },
                            {
                              label: "0-9",
                              met: /\d/.test(newSchool.adminPassword),
                            },
                            {
                              label: "!@#",
                              met: /[^a-zA-Z\d]/.test(newSchool.adminPassword),
                            },
                          ].map((req, index) => (
                            <div
                              key={index}
                              className={`flex items-center space-x-1 p-1 rounded text-center justify-center transition-all ${
                                req.met
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              <CheckCircle
                                className={`w-3 h-3 ${
                                  req.met ? "text-green-600" : "text-gray-300"
                                }`}
                              />
                              <span className="font-medium">{req.label}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {validationErrors.adminPassword && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-xl"
                      >
                        <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="text-sm text-red-700 font-medium">
                          {validationErrors.adminPassword}
                        </span>
                      </motion.div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="adminConfirmPassword"
                      className="text-sm font-bold text-white/90"
                    >
                      Confirm Password *
                    </Label>
                    <Input
                      id="adminConfirmPassword"
                      type="password"
                      value={newSchool.adminConfirmPassword}
                      onChange={(e) =>
                        setNewSchool({
                          ...newSchool,
                          adminConfirmPassword: e.target.value,
                        })
                      }
                      placeholder="Confirm the password"
                      className={`h-14 bg-white/10 border-2 backdrop-blur-sm text-white placeholder:text-white/40 transition-all duration-300 ${
                        validationErrors.adminConfirmPassword
                          ? "border-red-400/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
                          : "border-white/20 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/30"
                      } rounded-xl shadow-lg`}
                    />
                    {validationErrors.adminConfirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-400 flex items-center space-x-2 font-medium"
                      >
                        <X className="w-4 h-4" />
                        <span>{validationErrors.adminConfirmPassword}</span>
                      </motion.p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="adminEmail"
                        className="text-sm font-bold text-white/90"
                      >
                        Admin Email
                      </Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={newSchool.adminEmail}
                        onChange={(e) =>
                          setNewSchool({
                            ...newSchool,
                            adminEmail: e.target.value,
                          })
                        }
                        placeholder="admin@school.com"
                        className={`h-14 bg-white/10 border-2 backdrop-blur-sm text-white placeholder:text-white/40 transition-all duration-300 ${
                          validationErrors.adminEmail
                            ? "border-red-400/50 focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
                            : "border-white/20 focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/30"
                        } rounded-xl shadow-lg`}
                      />
                      {validationErrors.adminEmail && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-red-400 flex items-center space-x-2 font-medium"
                        >
                          <X className="w-4 h-4" />
                          <span>{validationErrors.adminEmail}</span>
                        </motion.p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="adminPhone"
                        className="text-sm font-bold text-white/90"
                      >
                        Admin Phone
                      </Label>
                      <Input
                        id="adminPhone"
                        value={newSchool.adminPhone}
                        onChange={(e) =>
                          setNewSchool({
                            ...newSchool,
                            adminPhone: e.target.value,
                          })
                        }
                        placeholder="+251911123456"
                        className="h-14 bg-white/10 border-2 border-white/20 backdrop-blur-sm text-white placeholder:text-white/40 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/30 transition-all duration-300 rounded-xl shadow-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Step 3: Plan & Configuration */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 p-6 rounded-2xl border border-emerald-400/30 backdrop-blur-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      Subscription Plan
                    </h3>
                    <p className="text-sm text-white/70">
                      Choose a subscription plan for your school
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label
                    htmlFor="planId"
                    className="text-sm font-bold text-white/90 flex items-center space-x-2"
                  >
                    <Zap className="w-5 h-5 text-emerald-400" />
                    <span>Subscription Plan</span>
                  </Label>
                  <select
                    id="planId"
                    value={newSchool.planId}
                    onChange={(e) =>
                      setNewSchool({
                        ...newSchool,
                        planId: e.target.value,
                      })
                    }
                    className="w-full h-14 px-4 py-3 bg-white/10 border-2 border-white/20 backdrop-blur-sm rounded-xl focus:border-emerald-400/50 hover:border-emerald-400/30 focus:ring-2 focus:ring-emerald-400/30 transition-all duration-300 text-white font-medium shadow-lg"
                  >
                    <option value="" className="bg-slate-900 text-white">
                      Select a plan (trial will be used)
                    </option>
                    {plans
                      .filter((p) => p.isActive && p.isPublic)
                      .map((plan) => (
                        <option
                          key={plan.id}
                          value={plan.id}
                          className="bg-slate-900 text-white"
                        >
                          {plan.name} - {plan.basePrice} {plan.currency}
                          /mo + {plan.perStudentPrice} {plan.currency} per
                          student
                        </option>
                      ))}
                  </select>
                  {newSchool.planId && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-emerald-500/30 to-teal-500/30 p-5 rounded-xl border border-emerald-400/40 backdrop-blur-sm"
                    >
                      <div className="flex items-center space-x-2 mb-3">
                        <CheckCircle className="w-6 h-6 text-emerald-300" />
                        <span className="font-bold text-white text-lg">
                          Plan Selected ✓
                        </span>
                      </div>
                      {(() => {
                        const selectedPlan = plans.find(
                          (p) => p.id === newSchool.planId
                        );
                        return selectedPlan ? (
                          <div className="text-sm text-white/90">
                            <div className="font-bold text-lg mb-2">
                              {selectedPlan.name}
                            </div>
                            <div className="mt-2 text-white/80">
                              Base:{" "}
                              <span className="font-bold">
                                {selectedPlan.basePrice} {selectedPlan.currency}
                                /mo
                              </span>{" "}
                              | Per Student:{" "}
                              <span className="font-bold">
                                {selectedPlan.perStudentPrice}{" "}
                                {selectedPlan.currency}
                              </span>
                            </div>
                            {selectedPlan.description && (
                              <div className="mt-2 text-white/70 italic">
                                {selectedPlan.description}
                              </div>
                            )}
                          </div>
                        ) : null;
                      })()}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Subscription Limits & Settings */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gray-200 rounded-xl shadow-lg">
                    <Users className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Subscription Limits & Settings
                    </h3>
                    <p className="text-sm text-gray-600">
                      Configure student limits and billing preferences
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="maxStudents"
                      className="text-sm font-bold text-white/90 flex items-center space-x-2"
                    >
                      <Users className="w-4 h-4 text-purple-300" />
                      <span>Max Students</span>
                    </Label>
                    <Input
                      id="maxStudents"
                      type="number"
                      min="1"
                      value={newSchool.maxStudents}
                      onChange={(e) =>
                        setNewSchool({
                          ...newSchool,
                          maxStudents: e.target.value,
                        })
                      }
                      placeholder="50"
                      className="h-14 bg-white/10 border-2 border-white/20 backdrop-blur-sm text-white placeholder:text-white/40 focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/30 transition-all duration-300 rounded-xl shadow-lg"
                    />
                    <p className="text-xs text-white/60">
                      Maximum number of students allowed
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="billingCycle"
                      className="text-sm font-bold text-white/90 flex items-center space-x-2"
                    >
                      <CreditCard className="w-4 h-4 text-pink-300" />
                      <span>Billing Cycle</span>
                    </Label>
                    <select
                      id="billingCycle"
                      value={newSchool.billingCycle}
                      onChange={(e) =>
                        setNewSchool({
                          ...newSchool,
                          billingCycle: e.target.value,
                        })
                      }
                      className="w-full h-14 px-4 py-3 border border-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-200 transition-all duration-300 bg-white shadow-sm text-gray-900 font-medium rounded-lg"
                    >
                      <option
                        value="monthly"
                        className="bg-slate-900 text-white"
                      >
                        Monthly
                      </option>
                      <option
                        value="annual"
                        className="bg-slate-900 text-white"
                      >
                        Annual
                      </option>
                    </select>
                    <p className="text-xs text-white/60">Payment frequency</p>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="trialDays"
                      className="text-sm font-bold text-white/90 flex items-center space-x-2"
                    >
                      <Clock className="w-4 h-4 text-purple-300" />
                      <span>Trial Days</span>
                    </Label>
                    <Input
                      id="trialDays"
                      type="number"
                      min="0"
                      max="365"
                      value={newSchool.trialDays}
                      onChange={(e) =>
                        setNewSchool({
                          ...newSchool,
                          trialDays: e.target.value,
                        })
                      }
                      placeholder="30"
                      className="h-14 bg-white/10 border-2 border-white/20 backdrop-blur-sm text-white placeholder:text-white/40 focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/30 transition-all duration-300 rounded-xl shadow-lg"
                    />
                    <p className="text-xs text-white/60">
                      Trial period duration (days)
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Flags */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gray-200 rounded-xl shadow-lg">
                    <Zap className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Feature Flags
                    </h3>
                    <p className="text-sm text-gray-600">
                      Enable or disable platform features for this school
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      key: "analytics",
                      label: "Analytics & Reporting",
                      description:
                        "Enable advanced analytics and reporting features",
                      icon: BarChart3,
                    },
                    {
                      key: "reports",
                      label: "Custom Reports",
                      description: "Allow creation of custom reports",
                      icon: FileText,
                    },
                    {
                      key: "notifications",
                      label: "Notifications",
                      description: "Enable push and email notifications",
                      icon: Bell,
                    },
                    {
                      key: "integrations",
                      label: "Third-party Integrations",
                      description: "Allow external service integrations",
                      icon: Settings,
                    },
                    {
                      key: "apiAccess",
                      label: "API Access",
                      description: "Enable API access for developers",
                      icon: Key,
                    },
                    {
                      key: "customDomain",
                      label: "Custom Domain",
                      description: "Allow custom domain configuration",
                      icon: Globe,
                    },
                  ].map((feature) => {
                    const IconComponent = feature.icon;
                    return (
                      <div
                        key={feature.key}
                        className="flex items-start justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300"
                      >
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="p-2 bg-gray-200 rounded-lg mt-1">
                            <IconComponent className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <Label
                              htmlFor={`feature-${feature.key}`}
                              className="text-sm font-bold text-gray-900 cursor-pointer"
                            >
                              {feature.label}
                            </Label>
                            <p className="text-xs text-gray-600 mt-1">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          id={`feature-${feature.key}`}
                          checked={
                            newSchool.features[
                              feature.key as keyof typeof newSchool.features
                            ]
                          }
                          onCheckedChange={(checked: boolean) =>
                            setNewSchool({
                              ...newSchool,
                              features: {
                                ...newSchool.features,
                                [feature.key]: checked,
                              },
                            })
                          }
                          className="ml-4 data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-200"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-6 rounded-2xl border border-cyan-400/30 backdrop-blur-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      Integrations
                    </h3>
                    <p className="text-sm text-white/70">
                      Configure external service integrations
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="telegramBotToken"
                      className="text-sm font-bold text-white/90 flex items-center space-x-2"
                    >
                      <Key className="w-5 h-5 text-cyan-400" />
                      <span>Telegram Bot Token</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="telegramBotToken"
                        type="password"
                        value={newSchool.telegramBotToken}
                        onChange={(e) =>
                          setNewSchool({
                            ...newSchool,
                            telegramBotToken: e.target.value,
                          })
                        }
                        placeholder="Enter Telegram bot token (optional)"
                        className="h-14 bg-white/10 border-2 border-white/20 backdrop-blur-sm text-white placeholder:text-white/40 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/30 transition-all duration-300 rounded-xl shadow-lg pr-12"
                      />
                      {newSchool.telegramBotToken && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 flex items-start space-x-2 font-medium">
                        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>
                          Bot token for Telegram notifications. Get it from{" "}
                          <a
                            href="https://t.me/BotFather"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-bold text-gray-600 hover:text-gray-800"
                          >
                            @BotFather
                          </a>{" "}
                          on Telegram. This enables automated notifications for
                          the school.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Review Section */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gray-200 rounded-xl shadow-lg">
                    <CheckCircle className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Review & Confirm
                    </h3>
                    <p className="text-sm text-gray-600">
                      Please review your school configuration
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-600 font-medium">
                          School Name:
                        </span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {newSchool.name || "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <div className="flex items-center space-x-2">
                        <Settings className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-600 font-medium">
                          School Slug:
                        </span>
                      </div>
                      <span className="font-mono font-bold text-gray-900">
                        {newSchool.slug || "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-600 font-medium">
                          Email:
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {newSchool.email || "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <div className="flex items-center space-x-2">
                        <User className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-600 font-medium">
                          Admin Name:
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {newSchool.adminName || "Not set"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <div className="flex items-center space-x-2">
                        <Key className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-600 font-medium">
                          Admin Username:
                        </span>
                      </div>
                      <span className="font-mono font-bold text-gray-900">
                        {newSchool.adminUsername || "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <div className="flex items-center space-x-2">
                        <Crown className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-600 font-medium">Plan:</span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {plans.find((p) => p.id === newSchool.planId)?.name ||
                          "Trial"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <div className="flex items-center space-x-2">
                        <Globe className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-600 font-medium">
                          Timezone:
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {newSchool.timezone || "Default"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-600 font-medium">
                          Currency:
                        </span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {newSchool.defaultCurrency || "Default"}
                      </span>
                    </div>
                  </div>
                </div>
                {(newSchool.logoUrl ||
                  newSchool.primaryColor !== "#3B82F6" ||
                  newSchool.secondaryColor !== "#1F2937") && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-5 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-xl border border-pink-400/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center space-x-2 mb-4">
                      <Palette className="w-6 h-6 text-pink-400" />
                      <span className="font-bold text-white text-lg">
                        Branding Preview
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      {newSchool.logoUrl && (
                        <img
                          src={newSchool.logoUrl}
                          alt="Logo"
                          className="w-20 h-20 rounded-xl object-cover border-2 border-white/30 shadow-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      )}
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-16 h-16 rounded-xl border-2 border-white/30 shadow-lg"
                          style={{ backgroundColor: newSchool.primaryColor }}
                        />
                        <div
                          className="w-16 h-16 rounded-xl border-2 border-white/30 shadow-lg"
                          style={{ backgroundColor: newSchool.secondaryColor }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

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
                {schools.reduce((acc, school) => acc + school._count.students, 0)}
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
                ${schools.reduce((acc, school) => acc + school.revenue, 0).toLocaleString()}
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
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
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
                  setSlugAvailable(null);
                }
              }}
              aria-labelledby="create-school-title"
              aria-describedby="create-school-description"
            >
              <DialogTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl px-8 py-4 text-lg font-semibold group">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors duration-200">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span>Add New School</span>
                      <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
                    </div>
                  </Button>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-[1200px] max-h-[95vh] bg-transparent border-0 shadow-none p-0">
                {/* Ultra-Modern Glass Container */}
                <div className="relative w-full h-full bg-gradient-to-br from-white/95 via-slate-50/90 to-gray-50/85 backdrop-blur-3xl rounded-3xl border border-white/40 shadow-2xl overflow-hidden max-h-[95vh] ring-1 ring-white/20 flex flex-col">
                  {/* Enhanced Animated Background Pattern */}
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
                    <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-400/15 to-blue-500/15 rounded-full blur-3xl animate-pulse" />
                    <div
                      className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-400/15 to-pink-500/15 rounded-full blur-3xl animate-pulse"
                      style={{ animationDelay: "2s" }}
                    />
                    <div
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-emerald-400/10 to-teal-500/10 rounded-full blur-3xl animate-pulse"
                      style={{ animationDelay: "4s" }}
                    />
                  </div>

                  {/* Subtle Grid Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div
                      className="w-full h-full bg-gradient-to-br from-transparent via-indigo-500/5 to-transparent"
                      style={{
                        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 2px, transparent 2px),
                                       radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.1) 2px, transparent 2px)`,
                        backgroundSize: "60px 60px",
                      }}
                    />
                  </div>

                  {/* Content Container with Fixed Header and Footer */}
                  <div className="relative z-10 flex flex-col h-full min-h-[600px]">

                    {/* Fixed Header */}
                    <div className="flex-shrink-0 p-8 pb-6">
                    {/* Success Animation Overlay */}
                    <AnimatePresence>
                      {showSuccessAnimation && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center z-50 bg-gray-900/60 backdrop-blur-md rounded-3xl"
                        >
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 200,
                              damping: 15,
                            }}
                            className="bg-white rounded-3xl p-10 shadow-2xl border-4 border-white/50"
                          >
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: [0, 1.3, 1] }}
                              transition={{ delay: 0.2, type: "spring" }}
                              className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-gray-200 shadow-lg"
                            >
                              <CheckCircle2 className="w-14 h-14 text-black" />
                            </motion.div>
                            <motion.h3
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className="text-3xl font-bold text-black text-center mb-3"
                            >
                              🎉 Success!
                            </motion.h3>
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.4 }}
                              className="text-black/90 text-center text-lg"
                            >
                              {newSchool.name} is ready to go!
                            </motion.p>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Toast Notifications */}
                    <AnimatePresence>
                      {errorMessage && (
                        <motion.div
                          initial={{ opacity: 0, x: 300 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 300 }}
                          className="fixed top-6 right-6 z-50 bg-black text-white rounded-2xl p-4 shadow-2xl border border-white/20 max-w-md backdrop-blur-sm"
                        >
                          <div className="flex items-center space-x-3">
                            <AlertCircle className="w-6 h-6 flex-shrink-0" />
                            <p className="font-semibold flex-1">
                              {errorMessage}
                            </p>
                            <button
                              onClick={() => setErrorMessage("")}
                              className="hover:bg-white/20 rounded-lg p-1 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                      {successMessage && !showSuccessAnimation && (
                        <motion.div
                          initial={{ opacity: 0, x: 300 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 300 }}
                          className="fixed top-6 right-6 z-50 bg-white text-black rounded-2xl p-4 shadow-2xl border border-black/20 max-w-md backdrop-blur-sm"
                        >
                          <div className="flex items-center space-x-3">
                            <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                            <p className="font-semibold flex-1">
                              {successMessage}
                            </p>
                            <button
                              onClick={() => setSuccessMessage("")}
                              className="hover:bg-white/20 rounded-lg p-1 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Header Section */}
                    <div className="pb-6 relative">
                      <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, type: "spring" }}
                        className="text-center"
                      >
                        {/* Ultra-Modern Icon with Enhanced Glow Effect */}
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            delay: 0.2,
                            type: "spring",
                            stiffness: 200,
                          }}
                          className="inline-flex items-center justify-center mb-8"
                        >
                          <div className="relative">
                            {/* Outer glow rings */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/30 to-purple-500/30 rounded-3xl blur-2xl animate-pulse" />
                            <div
                              className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-3xl blur-xl animate-pulse"
                              style={{ animationDelay: "1s" }}
                            />
                            <div
                              className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-rose-500/20 rounded-3xl blur-lg animate-pulse"
                              style={{ animationDelay: "2s" }}
                            />

                            {/* Main container */}
                            <div className="relative bg-gradient-to-br from-white via-slate-50 to-gray-50 p-6 rounded-3xl shadow-2xl border border-white/50 backdrop-blur-sm">
                              <Sparkles className="w-12 h-12 text-indigo-600" />
                            </div>

                            {/* Floating particles effect */}
                            <div
                              className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.5s" }}
                            />
                            <div
                              className="absolute -bottom-1 -left-1 w-3 h-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full animate-bounce"
                              style={{ animationDelay: "1.5s" }}
                            />
                            <div
                              className="absolute top-1/2 -right-3 w-2 h-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full animate-bounce"
                              style={{ animationDelay: "2.5s" }}
                            />
                          </div>
                        </motion.div>

                        <DialogTitle
                          id="create-school-title"
                          className="text-5xl font-black bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-4 tracking-tight"
                        >
                          Create New School
                        </DialogTitle>
                        <p
                          id="create-school-description"
                          className="text-gray-600 text-xl font-medium leading-relaxed"
                        >
                          Build your school platform in 3 simple steps with our
                          guided setup
                        </p>
                      </motion.div>

                      {/* Ultra-Modern Step Indicator */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="mt-16"
                      >
                        <div className="flex items-center justify-center space-x-6 mb-12">
                          {[
                            {
                              step: 1,
                              title: "School Info",
                              description: "Basic details",
                              icon: Building2,
                              color: "from-blue-500 to-indigo-600",
                            },
                            {
                              step: 2,
                              title: "Branding",
                              description: "Admin & styling",
                              icon: Palette,
                              color: "from-purple-500 to-pink-600",
                            },
                            {
                              step: 3,
                              title: "Review",
                              description: "Plan & confirm",
                              icon: CheckCircle2,
                              color: "from-emerald-500 to-teal-600",
                            },
                          ].map((item, index) => {
                            const IconComponent = item.icon;
                            return (
                              <div
                                key={item.step}
                                className="flex items-center"
                              >
                                <motion.div
                                  className="flex flex-col items-center group"
                                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  transition={{
                                    delay: 0.5 + index * 0.15,
                                    type: "spring",
                                  }}
                                >
                                  <motion.div
                                    className={`relative flex items-center justify-center w-20 h-20 rounded-3xl font-black text-xl transition-all duration-500 shadow-xl border-2 ${
                                      currentStep >= item.step
                                        ? `bg-gradient-to-br ${item.color} text-white border-white/30`
                                        : "bg-white/90 text-gray-400 border-gray-200/50 backdrop-blur-sm"
                                    }`}
                                    whileHover={{ scale: 1.15, rotate: 10 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    {currentStep > item.step ? (
                                      <CheckCircle2 className="w-10 h-10" />
                                    ) : (
                                      <IconComponent className="w-8 h-8" />
                                    )}
                                    {currentStep === item.step && (
                                      <motion.div
                                        className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${item.color}`}
                                        animate={{
                                          boxShadow: [
                                            `0 0 40px rgba(59, 130, 246, 0.6)`,
                                            `0 0 80px rgba(59, 130, 246, 0.8)`,
                                            `0 0 40px rgba(59, 130, 246, 0.6)`,
                                          ],
                                        }}
                                        transition={{
                                          duration: 3,
                                          repeat: Infinity,
                                        }}
                                      />
                                    )}
                                  </motion.div>
                                  <div className="mt-4 text-center">
                                    <div
                                      className={`text-base font-bold transition-colors duration-300 ${
                                        currentStep >= item.step
                                          ? "text-gray-800"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {item.title}
                                    </div>
                                    <div
                                      className={`text-sm mt-1 transition-colors duration-300 ${
                                        currentStep >= item.step
                                          ? "text-gray-600"
                                          : "text-gray-300"
                                      }`}
                                    >
                                      {item.description}
                                    </div>
                                  </div>
                                </motion.div>
                                {index < 2 && (
                                  <motion.div
                                    className={`w-32 h-2 mx-8 rounded-full shadow-inner ${
                                      currentStep > item.step
                                        ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                                        : "bg-gray-200/50"
                                    }`}
                                    initial={{ scaleX: 0 }}
                                    animate={{
                                      scaleX: currentStep > item.step ? 1 : 0,
                                    }}
                                    transition={{
                                      duration: 0.8,
                                      delay: 0.6 + index * 0.1,
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-hidden min-h-0">
                      <motion.form
                        onSubmit={handleCreateSchool}
                        className="relative h-full flex flex-col"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      >
                        <div className="flex-1 overflow-y-auto px-8 pb-4 scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-indigo-100 max-h-[calc(100vh-300px)]">
                          <div className="bg-gradient-to-br from-white via-gray-50/50 to-slate-50/80 backdrop-blur-sm rounded-2xl p-8 border border-white/30 shadow-xl">
                            {renderStepContent()}
                          </div>
                        </div>

                        {/* Fixed Footer with Navigation */}
                        <motion.div
                          className="flex-shrink-0 border-t border-white/20 bg-gradient-to-r from-indigo-50/40 via-purple-50/30 to-pink-50/40 backdrop-blur-md px-8 py-8 shadow-inner"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                        <div className="flex items-center space-x-6">
                          {currentStep > 1 && (
                            <motion.div
                              whileHover={{ scale: 1.1, x: -3 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                type="button"
                                onClick={prevStep}
                                variant="outline"
                                className="border-2 border-indigo-200 hover:border-indigo-400 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:shadow-lg transition-all duration-300 rounded-2xl px-8 py-4 font-bold shadow-md text-indigo-700 hover:text-indigo-800"
                              >
                                <ArrowLeft className="w-6 h-6 mr-3" />
                                Back
                              </Button>
                            </motion.div>
                          )}
                          <div className="bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/40">
                            <div className="text-sm font-bold text-gray-700 flex items-center space-x-2">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                              <span>Step {currentStep} of 3</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center space-x-4">
                            {currentStep > 1 && (
                              <motion.div
                                whileHover={{ scale: 1.05, x: -2 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  type="button"
                                  onClick={prevStep}
                                  variant="outline"
                                  className="border-2 border-indigo-200 hover:border-indigo-400 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:shadow-lg transition-all duration-300 rounded-2xl px-6 py-3 font-bold shadow-md text-indigo-700 hover:text-indigo-800"
                                >
                                  <ArrowLeft className="w-5 h-5 mr-2" />
                                  Back
                                </Button>
                              </motion.div>
                            )}
                            <div className="bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/40">
                              <div className="text-sm font-bold text-gray-700 flex items-center space-x-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                                <span>Step {currentStep} of 3</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-4">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="border-2 border-gray-300 hover:border-gray-400 hover:bg-white hover:shadow-lg transition-all duration-300 rounded-2xl px-8 py-4 font-bold shadow-md text-gray-700 hover:text-gray-800"
                              >
                                <X className="w-5 h-5 mr-2" />
                                Cancel
                              </Button>
                            </motion.div>
                            {currentStep < 3 ? (
                              <motion.div
                                whileHover={{ scale: 1.05, x: 2 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  type="button"
                                  onClick={nextStep}
                                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl px-10 py-4 font-bold text-lg border-2 border-transparent hover:border-white/20"
                                >
                                  Continue
                                  <ArrowRight className="w-6 h-6 ml-3" />
                                </Button>
                              </motion.div>
                            ) : (
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  type="submit"
                                  disabled={creating}
                                  className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 rounded-2xl px-10 py-4 font-bold text-lg border-2 border-transparent hover:border-white/20"
                                >
                                  {creating ? (
                                    <div className="flex items-center">
                                      <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
                                      Creating School...
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <Sparkles className="w-6 h-6 mr-3" />
                                      Create School
                                    </div>
                                  )}
                                </Button>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </motion.form>
                    </div>
                  </div>
                </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col lg:flex-row gap-6 mb-8"
        >
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <Search className="w-5 h-5 text-white" />
              </div>
            </div>
            <Input
              placeholder="Search schools by name, slug, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-16 h-14 border-2 border-gray-200 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl bg-white text-gray-900 text-lg placeholder:text-gray-400 focus:ring-4 focus:ring-indigo-100 font-medium"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="border-2 border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-300 rounded-2xl px-8 py-4 h-14 font-semibold shadow-lg hover:shadow-xl bg-white"
              >
                <Filter className="w-5 h-5 mr-3 text-indigo-600" />
                Advanced Filters
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={handleExportSchools}
                className="border-2 border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-300 rounded-2xl px-8 py-4 h-14 font-semibold shadow-lg hover:shadow-xl bg-white"
              >
                <Download className="w-5 h-5 mr-3 text-emerald-600" />
                Export CSV
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={fetchSchools}
                className="border-2 border-blue-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 rounded-2xl px-6 py-4 h-14 font-semibold shadow-lg hover:shadow-xl bg-white"
              >
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </Button>
            </motion.div>
          </div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full mt-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border-2 border-indigo-200 p-6 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <span>Status Filter</span>
                    </Label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full h-12 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 hover:border-indigo-300 transition-all duration-300 bg-white shadow-sm text-gray-700 font-medium"
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <Crown className="w-4 h-4 text-purple-600" />
                      <span>Plan Filter</span>
                    </Label>
                    <select className="w-full h-12 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-400 hover:border-indigo-300 transition-all duration-300 bg-white shadow-sm text-gray-700 font-medium">
                      <option value="">All Plans</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStatusFilter("");
                        setSearchTerm("");
                        setShowAdvancedFilters(false);
                      }}
                      className="w-full h-12 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 rounded-xl font-semibold"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Schools Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-slate-50/95 to-gray-50/90 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-b border-white/30 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-30" />
                    <div className="relative p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-xl">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-3xl text-gray-800 font-black">
                      All Schools
                    </CardTitle>
                    <p className="text-gray-600 mt-2 text-lg font-medium">
                      {schools.length} schools found
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 rounded-2xl border border-indigo-200">
                    <div className="text-3xl font-black text-indigo-600">
                      {schools.length}
                    </div>
                    <div className="text-sm text-indigo-600 font-semibold">
                      Total Schools
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-gray-50/80 via-indigo-50/40 to-purple-50/40 hover:from-gray-50/90 hover:via-indigo-50/50 hover:to-purple-50/50 transition-all duration-300 border-b-2 border-indigo-100/50">
                        <TableHead className="font-bold text-gray-800 py-6 px-6 text-left">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            <span>School</span>
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-gray-800 py-6 px-6 text-left">
                          <div className="flex items-center space-x-2">
                            <Crown className="w-5 h-5 text-purple-600" />
                            <span>Plan</span>
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-gray-800 py-6 px-6 text-left">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-5 h-5 text-green-600" />
                            <span>Status</span>
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-gray-800 py-6 px-6 text-left">
                          <div className="flex items-center space-x-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span>Users</span>
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-gray-800 py-6 px-6 text-left">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                            <span>Revenue</span>
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-gray-800 py-6 px-6 text-left">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-5 h-5 text-orange-600" />
                            <span>Created</span>
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-gray-800 py-6 px-6 text-center w-[120px]">
                          <div className="flex items-center justify-center">
                            <Settings className="w-5 h-5 text-gray-600" />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schools.map((school, index) => (
                        <motion.tr
                          key={school.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="group cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50/60 hover:via-purple-50/40 hover:to-pink-50/30 transition-all duration-300 border-b border-gray-100/60 hover:border-indigo-200/50 hover:shadow-md"
                          onClick={() =>
                            router.push(`/super-admin/schools/${school.id}`)
                          }
                        >
                          <TableCell className="py-6 px-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                                <span className="text-white font-bold text-lg">
                                  {school.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-lg group-hover:text-indigo-700 transition-colors duration-200">
                                  {school.name}
                                </div>
                                <div className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-lg inline-block mt-1">
                                  {school.slug}
                                </div>
                                <div className="text-sm text-gray-600 mt-1 flex items-center space-x-1">
                                  <Mail className="w-4 h-4" />
                                  <span>{school.email}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-6">
                            <div className="flex items-center space-x-3">
                              <Badge
                                variant="outline"
                                className="cursor-pointer hover:bg-gradient-to-r hover:from-indigo-100 hover:to-purple-100 transition-all duration-300 border-2 border-indigo-200 hover:border-purple-300 text-indigo-700 hover:text-purple-700 font-semibold px-3 py-1 rounded-xl shadow-sm hover:shadow-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPlanChangeModal(school);
                                }}
                              >
                                {plans.find((p) => p.id === school.planId)
                                  ?.name || "No Plan"}
                              </Badge>
                              <motion.div
                                whileHover={{ scale: 1.2, rotate: 10 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPlanChangeModal(school);
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-purple-100 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                                >
                                  <Edit className="h-4 w-4 text-indigo-600" />
                                </Button>
                              </motion.div>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-6">
                            {getStatusBadge(school.status)}
                          </TableCell>
                          <TableCell className="py-6 px-6">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                                <Users className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold text-blue-700">
                                  {school._count.students}
                                </span>
                                <span className="text-blue-600 text-sm">
                                  students
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-xl border border-green-100">
                                <User className="w-4 h-4 text-green-600" />
                                <span className="font-semibold text-green-700">
                                  {school._count.teachers}
                                </span>
                                <span className="text-green-600 text-sm">
                                  teachers
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-xl border border-purple-100">
                                <Shield className="w-4 h-4 text-purple-600" />
                                <span className="font-semibold text-purple-700">
                                  {school._count.admins}
                                </span>
                                <span className="text-purple-600 text-sm">
                                  admins
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-6">
                            <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3 rounded-xl border border-emerald-200">
                              <div className="text-2xl font-bold text-emerald-700">
                                ${school.revenue.toLocaleString()}
                              </div>
                              <div className="text-emerald-600 text-sm">
                                total revenue
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-6">
                            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 px-4 py-3 rounded-xl border border-orange-200">
                              <div className="text-orange-700 font-medium">
                                {new Date(school.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </div>
                              <div className="text-orange-600 text-sm">
                                {new Date(school.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "short",
                                  }
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-6 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Button
                                    variant="ghost"
                                    className="h-10 w-10 p-0 hover:bg-gradient-to-r hover:from-gray-100 hover:to-indigo-100 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-5 w-5 text-gray-600" />
                                  </Button>
                                </motion.div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="shadow-xl border-0 bg-white/95 backdrop-blur-xl rounded-2xl p-2"
                              >
                                <DropdownMenuItem
                                  className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 cursor-pointer rounded-xl px-4 py-3 font-medium transition-all duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/super-admin/schools/${school.id}`
                                    );
                                  }}
                                >
                                  <Eye className="mr-3 h-5 w-5 text-indigo-600" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 cursor-pointer rounded-xl px-4 py-3 font-medium transition-all duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPlanChangeModal(school);
                                  }}
                                >
                                  <Edit className="mr-3 h-5 w-5 text-purple-600" />
                                  Change Plan
                                </DropdownMenuItem>
                                {school.status === "active" ? (
                                  <DropdownMenuItem
                                    className="hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 text-yellow-700 cursor-pointer rounded-xl px-4 py-3 font-medium transition-all duration-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (
                                        confirm(
                                          `Are you sure you want to suspend ${school.name}?`
                                        )
                                      ) {
                                        handleStatusChange(
                                          school.id,
                                          "suspended"
                                        );
                                      }
                                    }}
                                  >
                                    <Ban className="mr-3 h-5 w-5" />
                                    Suspend School
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 text-green-700 cursor-pointer rounded-xl px-4 py-3 font-medium transition-all duration-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(school.id, "active");
                                    }}
                                  >
                                    <Play className="mr-3 h-5 w-5" />
                                    Activate School
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 text-red-600 cursor-pointer rounded-xl px-4 py-3 font-medium transition-all duration-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSchool(school.id);
                                  }}
                                >
                                  <Trash2 className="mr-3 h-5 w-5" />
                                  Delete School
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex justify-center mt-12"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
                <div className="flex items-center space-x-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 rounded-2xl px-6 py-3 font-semibold shadow-sm hover:shadow-md"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Previous
                    </Button>
                  </motion.div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-indigo-100 to-purple-100 px-6 py-3 rounded-2xl border border-indigo-200">
                      <span className="text-indigo-700 font-bold text-lg">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          const pageNum =
                            Math.max(
                              1,
                              Math.min(totalPages - 4, currentPage - 2)
                            ) + i;
                          if (pageNum > totalPages) return null;
                          return (
                            <motion.button
                              key={pageNum}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-12 h-12 rounded-2xl font-bold transition-all duration-300 shadow-sm ${
                                currentPage === pageNum
                                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                                  : "bg-white border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700"
                              }`}
                            >
                              {pageNum}
                            </motion.button>
                          );
                        }
                      )}
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 rounded-2xl px-6 py-3 font-semibold shadow-sm hover:shadow-md"
                    >
                      Next
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Plan Change Modal - Temporarily commented out for debugging */}
      {/*
      <Dialog open={planChangeModal} onOpenChange={setPlanChangeModal}>
        <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 backdrop-blur-2xl border-0 shadow-2xl rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-3xl" />
          <DialogHeader className="relative pb-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-xl mb-4">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Change Subscription Plan
              </DialogTitle>
              <p className="text-gray-600">
                Update the school's subscription plan and billing
              </p>
            </motion.div>
          </DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6 relative"
          >
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-900">
                    Plan Selection
                  </h3>
                  <p className="text-sm text-indigo-600">
                    Choose a new subscription plan for the school
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <Label
                  htmlFor="plan-select"
                  className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <span>New Plan</span>
                </Label>
                <select
                  id="plan-select"
                  value={newPlanId}
                  onChange={(e) => setNewPlanId(e.target.value)}
                  className="w-full h-12 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 hover:border-indigo-300 transition-all duration-300 bg-white shadow-sm text-gray-700 font-medium"
                >
                  <option value="">Select a new plan...</option>
                  {plans
                    .filter((p) => p.isActive)
                    .map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {plan.basePrice} {plan.currency}/mo +{" "}
                        {plan.perStudentPrice} {plan.currency} per student
                      </option>
                    ))}
                </select>
                {newPlanId && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-50 p-4 rounded-xl border border-green-200"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">
                        Plan Selected
                      </span>
                    </div>
                    {(() => {
                      const selectedPlan = plans.find(
                        (p) => p.id === newPlanId
                      );
                      return selectedPlan ? (
                        <div className="text-sm text-green-700">
                          <div className="font-medium">{selectedPlan.name}</div>
                          <div className="mt-1">
                            Base: {selectedPlan.basePrice}{" "}
                            {selectedPlan.currency}/mo | Per Student:{" "}
                            {selectedPlan.perStudentPrice}{" "}
                            {selectedPlan.currency}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </motion.div>
                )}
              </div>
            </div>
            <motion.div
              className="flex justify-end space-x-4 pt-6 border-t border-gray-200/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPlanChangeModal(false)}
                  className="border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 rounded-lg px-6 py-3 font-semibold shadow-sm hover:shadow-md"
                >
                  Cancel
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handlePlanChange}
                  disabled={!newPlanId}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 rounded-lg px-8 py-3 font-semibold disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Change Plan
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
          </div>
          </div>
        </DialogContent>
        </Dialog>
      </Dialog>
      */}
      </div>
    </div>
  );
}

export default SuperAdminSchools;