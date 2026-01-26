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
  Globe,
  Settings,
  Plus,
  Zap,
  RefreshCw,
  Shield,
  Receipt
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SchoolsFilters } from "./components/SchoolsFilters";
import { SchoolsTable } from "./components/SchoolsTable";
import { SchoolCreationPanel } from "./components/SchoolCreationPanel";
import { PricingManagement } from "./components/PricingManagement";

interface School {
  id: string;
  name: string;
  slug: string;
  email: string;
  status: "active" | "inactive" | "suspended";
  currentStudentCount: number;
  createdAt: string;
  _count: {
    admins: number;
    teachers: number;
    students: number;
  };
  revenue: number;
  primaryColor?: string;
  secondaryColor?: string;
}


export default function SuperAdminSchools() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Comprehensive school creation form state
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
    // Feature Flags
    features: {
      analytics: true,
      reports: true,
      notifications: true,
      integrations: false,
      apiAccess: false,
      customDomain: false,
      zoomIntegration: true,
      telegramBot: true,
      emailNotifications: true,
      smsNotifications: false,
      multiLanguage: false,
      advancedReporting: false,
    },
    // Admin details
    adminName: "",
    adminUsername: "",
    adminPassword: "",
    adminConfirmPassword: "",
    adminEmail: "",
    adminPhone: "",
  });



  // Additional state for enhanced features
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);


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
        timezone: newSchool.timezone,
        defaultCurrency: newSchool.defaultCurrency,
        defaultLanguage: newSchool.defaultLanguage,
        logoUrl: newSchool.logoUrl,
        primaryColor: newSchool.primaryColor,
        secondaryColor: newSchool.secondaryColor,
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


  // Filtered schools with advanced search
  const filteredSchools = schools.filter((school) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      school.name.toLowerCase().includes(searchLower) ||
      school.slug.toLowerCase().includes(searchLower) ||
      school.email.toLowerCase().includes(searchLower) ||
      school.phone?.toLowerCase().includes(searchLower) ||
      school.address?.toLowerCase().includes(searchLower)
    );
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            setIsCreatePanelOpen(true);
            break;
          case 'r':
            e.preventDefault();
            fetchSchools();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Button
                onClick={() => setIsCreatePanelOpen(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-4 text-lg font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New School
              </Button>
            </motion.div>

            <SchoolCreationPanel
              isOpen={isCreatePanelOpen}
              onClose={() => setIsCreatePanelOpen(false)}
              onSuccess={fetchSchools}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs defaultValue="schools" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="schools" className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span>Schools</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center space-x-2">
              <Receipt className="w-4 h-4" />
              <span>Pricing</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schools" className="space-y-6">
            {/* Quick Stats Bar */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{schools.length}</div>
                  <div className="text-sm text-gray-600">Total Schools</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {schools.filter(s => s.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {schools.reduce((acc, school) => acc + school._count.students, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {schools.filter(school => {
                      const createdDate = new Date(school.createdAt);
                      const now = new Date();
                      return createdDate.getMonth() === now.getMonth() &&
                             createdDate.getFullYear() === now.getFullYear();
                    }).length}
                  </div>
                  <div className="text-sm text-gray-600">This Month</div>
                </div>
              </div>
            </div>

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

            {/* Recent Schools Highlight */}
            {schools.length > 0 && (
              <Card className="border-2 border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-indigo-800">
                    <Crown className="w-5 h-5" />
                    <span>Recently Added Schools</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {schools.slice(0, 3).map((school) => (
                      <div key={school.id} className="bg-white rounded-lg p-4 border border-indigo-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">{school.name}</h3>
                          <Badge variant={school.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {school.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">/{school.slug}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{school._count.students} students</span>
                          <span>{new Date(school.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <Card className="p-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900">Loading Schools</h3>
                    <p className="text-sm text-gray-600">Fetching school data from the database...</p>
                  </div>
                </div>
              </Card>
            ) : filteredSchools.length === 0 ? (
              searchTerm ? (
                <Card className="p-8">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                      <Search className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">No Results Found</h3>
                      <p className="text-gray-600">
                        No schools match "{searchTerm}". Try adjusting your search terms.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSearchTerm("")}
                      className="mt-4"
                    >
                      Clear Search
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-12 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-200">
                  <div className="text-center space-y-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                        <Building2 className="w-10 h-10 text-indigo-600" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to School Management</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Start building your educational platform by creating your first school.
                        Each school gets its own isolated environment with dedicated admin access.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          onClick={() => setIsCreatePanelOpen(true)}
                          size="lg"
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Create Your First School
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={fetchSchools}
                          className="border-indigo-200 hover:bg-indigo-50"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-indigo-100">
                      <div className="text-center">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h4 className="font-medium text-sm mb-1">Secure Isolation</h4>
                        <p className="text-xs text-gray-600">Each school has complete data isolation</p>
                      </div>
                      <div className="text-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Zap className="w-5 h-5 text-purple-600" />
                        </div>
                        <h4 className="font-medium text-sm mb-1">Feature Rich</h4>
                        <p className="text-xs text-gray-600">Full educational platform features</p>
                      </div>
                      <div className="text-center">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Globe className="w-5 h-5 text-green-600" />
                        </div>
                        <h4 className="font-medium text-sm mb-1">Global Ready</h4>
                        <p className="text-xs text-gray-600">Multi-language and timezone support</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            ) : (
              <SchoolsTable
                schools={filteredSchools}
                loading={loading}
                onViewSchool={handleViewSchool}
                onEditSchool={handleEditSchool}
                onDeleteSchool={handleDeleteSchool}
              />
            )}
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <PricingManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-600">
                    <span>Total Schools</span>
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-indigo-600">
                    {schools.length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Registered institutions</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-600">
                    <span>Active Schools</span>
                    <Activity className="w-5 h-5 text-green-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {schools.filter(s => s.status === 'active').length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Currently operational</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-600">
                    <span>Total Students</span>
                    <Users className="w-5 h-5 text-blue-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {schools.reduce((acc, school) => acc + school._count.students, 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enrolled learners</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-600">
                    <span>Platform Health</span>
                    <Zap className="w-5 h-5 text-purple-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">98.5%</div>
                  <p className="text-xs text-gray-500 mt-1">System uptime</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* School Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <span>School Status Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { status: 'active', label: 'Active Schools', color: 'bg-green-500', count: schools.filter(s => s.status === 'active').length },
                      { status: 'inactive', label: 'Inactive Schools', color: 'bg-yellow-500', count: schools.filter(s => s.status === 'inactive').length },
                      { status: 'suspended', label: 'Suspended Schools', color: 'bg-red-500', count: schools.filter(s => s.status === 'suspended').length },
                    ].map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{item.count}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${item.color}`}
                              style={{ width: `${schools.length > 0 ? (item.count / schools.length) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-orange-600" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {schools.slice(0, 5).map((school, index) => (
                      <div key={school.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-indigo-600">
                              {school.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{school.name}</p>
                            <p className="text-xs text-gray-500">
                              Created {new Date(school.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={school.status === 'active' ? 'default' : 'secondary'}>
                          {school.status}
                        </Badge>
                      </div>
                    ))}
                    {schools.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No schools yet</p>
                        <p className="text-sm">Create your first school to get started</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-gray-600">
                    Average Students per School
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">
                    {schools.length > 0
                      ? Math.round(schools.reduce((acc, school) => acc + school._count.students, 0) / schools.length)
                      : 0
                    }
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Per institution</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-gray-600">
                    Schools Created This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {schools.filter(school => {
                      const createdDate = new Date(school.createdAt);
                      const now = new Date();
                      return createdDate.getMonth() === now.getMonth() &&
                             createdDate.getFullYear() === now.getFullYear();
                    }).length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Current month</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-gray-600">
                    System Load
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">Low</div>
                  <p className="text-xs text-gray-500 mt-1">Server performance</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    <span>Platform Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <h3 className="font-medium">Auto School Slug Generation</h3>
                      <p className="text-sm text-gray-600">Automatically generate slugs from school names</p>
                    </div>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <h3 className="font-medium">Default Admin Notifications</h3>
                      <p className="text-sm text-gray-600">Send welcome emails to new school admins</p>
                    </div>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <h3 className="font-medium">Multi-tenant Isolation</h3>
                      <p className="text-sm text-gray-600">Ensure complete data separation between schools</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <h3 className="font-medium">Global Telegram Bot</h3>
                      <p className="text-sm text-gray-600">Single bot instance for all schools</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-orange-600" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setIsCreatePanelOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New School
                  </Button>

                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={fetchSchools}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>

                  <Button
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>

                  <Button
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    System Maintenance
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-green-600" />
                  <span>Advanced Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Default Features</h4>
                    <p className="text-xs text-gray-600 mb-3">Configure default feature set for new schools</p>
                    <Button size="sm" variant="outline">Configure</Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Notification Templates</h4>
                    <p className="text-xs text-gray-600 mb-3">Customize email and message templates</p>
                    <Button size="sm" variant="outline">Edit Templates</Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">API Rate Limits</h4>
                    <p className="text-xs text-gray-600 mb-3">Manage API usage limits per school</p>
                    <Button size="sm" variant="outline">Configure Limits</Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Backup Settings</h4>
                    <p className="text-xs text-gray-600 mb-3">Configure automated backup schedules</p>
                    <Button size="sm" variant="outline">Backup Config</Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Security Policies</h4>
                    <p className="text-xs text-gray-600 mb-3">Update password and access policies</p>
                    <Button size="sm" variant="outline">Security Settings</Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Integration Hub</h4>
                    <p className="text-xs text-gray-600 mb-3">Manage third-party integrations</p>
                    <Button size="sm" variant="outline">Manage Integrations</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span>System Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                    </div>
                    <h3 className="font-medium text-sm">Database</h3>
                    <p className="text-xs text-gray-600">Operational</p>
                  </div>

                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                    </div>
                    <h3 className="font-medium text-sm">API Services</h3>
                    <p className="text-xs text-gray-600">Healthy</p>
                  </div>

                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                    </div>
                    <h3 className="font-medium text-sm">Telegram Bot</h3>
                    <p className="text-xs text-gray-600">Connected</p>
                  </div>

                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                    </div>
                    <h3 className="font-medium text-sm">File Storage</h3>
                    <p className="text-xs text-gray-600">Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Floating Action Button for Mobile */}
        <div className="fixed bottom-6 right-6 lg:hidden z-40">
          <Button
            onClick={() => setIsCreatePanelOpen(true)}
            size="lg"
            className="rounded-full w-14 h-14 shadow-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="fixed bottom-6 left-6 z-40 hidden lg:block">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border text-xs text-gray-600">
            <div className="font-medium mb-1">Keyboard Shortcuts</div>
            <div>Ctrl+N: New School</div>
            <div>Ctrl+R: Refresh</div>
          </div>
        </div>

        <SchoolCreationPanel
          isOpen={isCreatePanelOpen}
          onClose={() => setIsCreatePanelOpen(false)}
          onSuccess={fetchSchools}
        />
      </div>
    </div> 
  );
}
