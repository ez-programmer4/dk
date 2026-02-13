"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/ui/LoginForm";
import {
  FiShield,
  FiLock,
  FiChevronRight,
  FiCheck,
  FiArrowLeft,
  FiHome,
  FiUserCheck,
  FiBriefcase,
  FiBookOpen,
  FiSettings,
  FiUsers,
  FiGlobe,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Step = "school" | "role" | "login";
type School = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  status: string;
  timezone: string;
  currency: string;
  stats?: {
    students: number;
    teachers: number;
    admins: number;
  };
  subscription?: {
    status: string;
    currentStudents: number;
    maxStudents: number;
    tier: string;
  } | null;
  contact?: {
    email?: string;
    phone?: string;
  };
  createdAt: Date;
};

function LoginPageContent() {
  const { isLoading, isAuthenticated } = useAuth({
    redirectIfFound: true,
  });
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("school");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [schools, setSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Handle authentication errors
  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError === "AccessDenied") {
      setError("You do not have permission to access this page.");
    } else if (authError === "SchoolInactive") {
      setError("Your school account is currently inactive. Please contact support for assistance.");
    } else if (authError) {
      setError("An authentication error occurred. Please try again.");
    }
  }, [searchParams]);

  // Fetch schools for multi-tenant selection
  useEffect(() => {
    const fetchSchools = async () => {
      setLoadingSchools(true);

      try {
        const response = await fetch("/api/schools");
        const data = await response.json();

        if (response.ok) {
          setSchools(data.schools || []);
        } else {
          setSchools([]);
        }
      } catch (error) {
        console.error("Failed to fetch schools:", error);
        setSchools([]);
      } finally {
        setLoadingSchools(false);
      }
    };

    fetchSchools();
  }, []);


  // Detect login success
  useEffect(() => {
    if (isAuthenticated && !loginSuccess) {
      setLoginSuccess(true);
      setTimeout(() => {
        setLoginSuccess(false);
      }, 3000);
    }
  }, [isAuthenticated, loginSuccess]);

  const handleSchoolSelect = (school: School) => {
    setSelectedSchool(school);
    setCurrentStep("role");
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setCurrentStep("login");
  };

  const handleBack = () => {
    if (currentStep === "role") {
      setCurrentStep("school");
      setSelectedSchool(null);
    } else if (currentStep === "login") {
      setCurrentStep("role");
      setSelectedRole("");
    }
  };

  const roles = [
    {
      id: "admin",
      name: "Administrator",
      description: "Manage school operations and settings",
      icon: FiSettings,
      color: "bg-purple-100 text-purple-600",
    },
    {
      id: "controller",
      name: "Controller",
      description: "Oversee student progress and attendance",
      icon: FiUserCheck,
      color: "bg-blue-100 text-blue-600",
    },
    {
      id: "registral",
      name: "Registral",
      description: "Handle student registrations and admissions",
      icon: FiBriefcase,
      color: "bg-green-100 text-green-600",
    },
    {
      id: "teacher",
      name: "Teacher",
      description: "Manage classes and student learning",
      icon: FiBookOpen,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  if (isLoading) {
    return <PageLoading />;
  }

  if (loginSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center"
        >
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 10,
            }}
            className="relative mb-8"
          >
            <div className="p-6 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full shadow-2xl border-4 border-white">
              <FiCheck className="h-16 w-16 text-emerald-600" />
            </div>
            {/* Success pulse */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.5,
              }}
              className="absolute inset-0 bg-emerald-400 rounded-full"
            />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent mb-4"
          >
            🎉 Welcome Back!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-emerald-600 font-medium text-lg mb-6"
          >
            Successfully signed in to {selectedSchool?.name}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center space-x-2 text-emerald-500"
          >
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent"></div>
            <span className="text-sm font-medium">Redirecting to dashboard...</span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 -z-10" />

      {/* Floating Elements */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-xl animate-pulse" />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-xl animate-pulse" />

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="p-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50">
                <Image
                  src="https://darelkubra.com/wp-content/uploads/2024/06/cropped-ዳሩል-ሎጎ-150x150.png"
                  alt="Darulkubra Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                  priority
                />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-2xl blur-xl -z-10" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
            Darulkubra Academy
          </h1>
        </motion.div>

        {/* Main Content */}
        <motion.div
          layout
          className="w-full max-w-md"
        >
          <AnimatePresence mode="wait">
            {/* Step 1: School Selection */}
            {currentStep === "school" && (
              <motion.div
                key="school"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8"
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-4">
                    <FiHome className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Select Your School
                  </h2>
                  <p className="text-slate-600">
                    Choose the institution you want to access
                  </p>
                </div>

                {loadingSchools ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                    <span className="ml-3 text-slate-600 text-sm">Loading schools...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {schools.map((school) => (
                      <motion.button
                        key={school.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSchoolSelect(school)}
                        className="w-full p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-between group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FiHome className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-medium text-slate-800 group-hover:text-blue-800 transition-colors">
                              {school.name}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {school.status === 'active' ? 'Active' : school.status === 'trial' ? 'Trial' : school.status}
                              {school.stats && ` • ${school.stats.students} students`}
                            </p>
                          </div>
                        </div>
                        <FiChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </motion.button>
                    ))}

                    {schools.length === 0 && (
                      <div className="text-center py-8">
                        <FiHome className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                        <h3 className="text-sm font-medium text-slate-800 mb-1">No Schools Available</h3>
                        <p className="text-xs text-slate-600">Please contact your administrator.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Platform Admin Link */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => router.push("/super-admin/login")}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 rounded-xl text-slate-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <FiSettings className="w-4 h-4" />
                    <span>Platform Administration</span>
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Role Selection */}
            {currentStep === "role" && selectedSchool && (
              <motion.div
                key="role"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8"
              >
                <div className="flex items-center justify-between mb-8">
                  <button
                    onClick={handleBack}
                    className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    <FiArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {selectedSchool.name}
                  </Badge>
                </div>

                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-4">
                    <FiUsers className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Select Your Role
                  </h2>
                  <p className="text-slate-600">
                    Choose your role at {selectedSchool.name}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {roles.map((role) => {
                    const IconComponent = role.icon;
                    return (
                      <motion.button
                        key={role.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRoleSelect(role.id)}
                        className="p-4 bg-gradient-to-r from-white to-slate-50 hover:from-green-50 hover:to-emerald-50 rounded-2xl border border-slate-200 hover:border-green-300 transition-all duration-200 shadow-sm hover:shadow-md group text-left"
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`flex-shrink-0 p-3 rounded-xl ${role.color}`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800 group-hover:text-green-800 transition-colors mb-1">
                              {role.name}
                            </h3>
                            <p className="text-sm text-slate-600 group-hover:text-green-600 transition-colors">
                              {role.description}
                            </p>
                          </div>
                          <FiChevronRight className="w-5 h-5 text-slate-400 group-hover:text-green-500 transition-colors flex-shrink-0 mt-2" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 3: Login Form */}
            {currentStep === "login" && selectedSchool && selectedRole && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8"
              >
                <div className="flex items-center justify-between mb-8">
                  <button
                    onClick={handleBack}
                    className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    <FiArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {selectedSchool.name}
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {roles.find(r => r.id === selectedRole)?.name}
                    </Badge>
                  </div>
                </div>

                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mb-4">
                    <FiLock className="w-8 h-8 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Sign In
                  </h2>
                  <p className="text-slate-600">
                    Enter your credentials to access the system
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl"
                  >
                    <div className="flex items-center space-x-3">
                      <FiShield className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <p className="text-red-700 font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}

                <LoginForm
                  defaultRole={selectedRole as any}
                  hideRoleSelect={true}
                  callbackUrl={searchParams.get("callbackUrl") || undefined}
                />

                {/* Security Features */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-center space-x-6 text-xs text-slate-500">
                    <div className="flex items-center space-x-2">
                      <FiShield className="w-4 h-4" />
                      <span>SSL Encrypted</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiLock className="w-4 h-4" />
                      <span>Secure Login</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiGlobe className="w-4 h-4" />
                      <span>Multi-Tenant</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>


        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-8 text-center text-slate-500 text-sm"
        >
          <p>© 2025 Darulkubra Academy. Secure multi-tenant education platform.</p>
          <p className="mt-1">
            Need help? Contact{" "}
            <a
              href="mailto:support@darulkubra.com"
              className="text-blue-600 hover:text-blue-800 underline transition-colors"
            >
              support@darulkubra.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <LoginPageContent />
    </Suspense>
  );
}