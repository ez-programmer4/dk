"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  basePrice: number;
  currency: string;
  perStudentPrice: number;
  isActive: boolean;
  description?: string;
}

interface SchoolCreationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  plans: Plan[];
}

interface NewSchool {
  name: string;
  email: string;
  phone: string;
  address: string;
  slug: string;
  planId: string;
  adminName: string;
  adminUsername: string;
  adminPassword: string;
  adminConfirmPassword: string;
  maxStudents: string;
  billingCycle: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  subscriptionTier: string;
}

const initialSchoolState: NewSchool = {
  name: "",
  email: "",
  phone: "",
  address: "",
  slug: "",
  planId: "",
  adminName: "",
  adminUsername: "",
  adminPassword: "",
  adminConfirmPassword: "",
  maxStudents: "50",
  billingCycle: "monthly",
};

export function SchoolCreationModal({
  isOpen,
  onOpenChange,
  onSuccess,
  plans,
}: SchoolCreationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [newSchool, setNewSchool] = useState<NewSchool>(initialSchoolState);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const steps = [
    {
      step: 1,
      title: "School Info",
      description: "Basic details",
      icon: Building2,
    },
    {
      step: 2,
      title: "Admin & Branding",
      description: "Account, security & theme",
      icon: Sparkles,
    },
    {
      step: 3,
      title: "Plan Selection",
      description: "Choose your plan",
      icon: CheckCircle2,
    },
  ];

  // Handle name change and auto-generate slug
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
      setSlugAvailable(null);
    } finally {
      setSlugChecking(false);
    }
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!newSchool.name.trim()) errors.name = "School name is required";
      if (!newSchool.slug.trim()) errors.slug = "School slug is required";
      if (!newSchool.email.trim()) errors.email = "Email address is required";
      if (slugAvailable === false) errors.slug = "This slug is already taken";
    } else if (step === 2) {
      if (!newSchool.adminName.trim())
        errors.adminName = "Admin name is required";
      if (!newSchool.adminUsername.trim())
        errors.adminUsername = "Admin username is required";
      if (!newSchool.adminPassword)
        errors.adminPassword = "Password is required";
      if (newSchool.adminPassword !== newSchool.adminConfirmPassword)
        errors.adminConfirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation functions
  const nextStep = () => {
    if (validateStep(currentStep)) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Handle form submission
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
        planId: newSchool.planId,
        maxStudents: parseInt(newSchool.maxStudents) || 50,
        billingCycle: newSchool.billingCycle,
      };

      const response = await fetch("/api/super-admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schoolData),
      });

      if (response.ok) {
        onOpenChange(false);
        setCurrentStep(1);
        setNewSchool(initialSchoolState);
        setValidationErrors({});
        onSuccess();
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to create school");
        setTimeout(() => setErrorMessage(""), 5000);
      }
    } catch (error) {
      setErrorMessage("Failed to create school. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setCreating(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setNewSchool(initialSchoolState);
      setValidationErrors({});
      setSlugAvailable(null);
      setErrorMessage("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3 text-sm font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Add New School
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
          {/* Header */}
          <div className="text-center mb-6">
            <DialogTitle className="text-3xl font-bold text-gray-900 mb-2">
              Create New School
            </DialogTitle>
            <p className="text-gray-600">
              Set up a new school in 3 simple steps
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      currentStep >= step.step
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > step.step ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      step.step
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-1 mx-4 rounded transition-all duration-300 ${
                        currentStep > step.step
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content - Scrollable */}
          <div
            className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            style={{ maxHeight: "calc(90vh - 250px)" }}
          >
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* School Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      School Name *
                    </Label>
                    <Input
                      placeholder="Enter school name"
                      value={newSchool.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className={validationErrors.name ? "border-red-500" : ""}
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-sm">
                        {validationErrors.name}
                      </p>
                    )}
                  </div>

                  {/* School Slug */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      School Slug *
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="school-slug"
                        value={newSchool.slug}
                        onChange={(e) => {
                          const slug = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "-")
                            .replace(/^-+|-+$/g, "");
                          setNewSchool({ ...newSchool, slug });
                          checkSlugAvailability(slug);
                        }}
                        className={
                          validationErrors.slug
                            ? "border-red-500 pr-10"
                            : "pr-10"
                        }
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {slugChecking ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                        ) : slugAvailable === true ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : slugAvailable === false ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : null}
                      </div>
                    </div>
                    {validationErrors.slug && (
                      <p className="text-red-500 text-sm">
                        {validationErrors.slug}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Email Address *
                    </Label>
                    <Input
                      type="email"
                      placeholder="school@example.com"
                      value={newSchool.email}
                      onChange={(e) =>
                        setNewSchool({ ...newSchool, email: e.target.value })
                      }
                      className={validationErrors.email ? "border-red-500" : ""}
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm">
                        {validationErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Phone Number
                    </Label>
                    <Input
                      placeholder="+251 XXX XXX XXX"
                      value={newSchool.phone}
                      onChange={(e) =>
                        setNewSchool({ ...newSchool, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    School Address
                  </Label>
                  <Textarea
                    placeholder="Enter the complete school address..."
                    value={newSchool.address}
                    onChange={(e) =>
                      setNewSchool({ ...newSchool, address: e.target.value })
                    }
                    className="min-h-[80px]"
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Enhanced Header */}
                <div className="text-center mb-8 relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl mb-4 shadow-xl"
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2"
                  >
                    Administrator & Branding
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-600 text-base leading-relaxed max-w-md mx-auto"
                  >
                    Set up your administrator account and customize your
                    school's branding
                  </motion.p>
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Admin Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Administrator Name *
                    </Label>
                    <Input
                      placeholder="Enter administrator full name"
                      value={newSchool.adminName}
                      onChange={(e) =>
                        setNewSchool({
                          ...newSchool,
                          adminName: e.target.value,
                        })
                      }
                      className={
                        validationErrors.adminName ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.adminName && (
                      <p className="text-red-500 text-sm">
                        {validationErrors.adminName}
                      </p>
                    )}
                  </div>

                  {/* Admin Username */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Username *
                    </Label>
                    <Input
                      placeholder="admin_username"
                      value={newSchool.adminUsername}
                      onChange={(e) =>
                        setNewSchool({
                          ...newSchool,
                          adminUsername: e.target.value,
                        })
                      }
                      className={
                        validationErrors.adminUsername ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.adminUsername && (
                      <p className="text-red-500 text-sm">
                        {validationErrors.adminUsername}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Password *
                    </Label>
                    <Input
                      type="password"
                      placeholder="Create a strong password"
                      value={newSchool.adminPassword}
                      onChange={(e) =>
                        setNewSchool({
                          ...newSchool,
                          adminPassword: e.target.value,
                        })
                      }
                      className={
                        validationErrors.adminPassword ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.adminPassword && (
                      <p className="text-red-500 text-sm">
                        {validationErrors.adminPassword}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      Confirm Password *
                    </Label>
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      value={newSchool.adminConfirmPassword}
                      onChange={(e) =>
                        setNewSchool({
                          ...newSchool,
                          adminConfirmPassword: e.target.value,
                        })
                      }
                      className={
                        validationErrors.adminConfirmPassword
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {validationErrors.adminConfirmPassword && (
                      <p className="text-red-500 text-sm">
                        {validationErrors.adminConfirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Branding Section */}
                  <div className="space-y-6 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800">
                      Branding & Theme
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Primary Color */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Primary Color
                        </Label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="color"
                            value={newSchool.primaryColor}
                            onChange={(e) =>
                              setNewSchool({
                                ...newSchool,
                                primaryColor: e.target.value,
                              })
                            }
                            className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                          />
                          <Input
                            value={newSchool.primaryColor}
                            onChange={(e) =>
                              setNewSchool({
                                ...newSchool,
                                primaryColor: e.target.value,
                              })
                            }
                            className="flex-1 font-mono text-sm"
                            placeholder="#3B82F6"
                          />
                        </div>
                      </div>

                      {/* Secondary Color */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Secondary Color
                        </Label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="color"
                            value={newSchool.secondaryColor}
                            onChange={(e) =>
                              setNewSchool({
                                ...newSchool,
                                secondaryColor: e.target.value,
                              })
                            }
                            className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                          />
                          <Input
                            value={newSchool.secondaryColor}
                            onChange={(e) =>
                              setNewSchool({
                                ...newSchool,
                                secondaryColor: e.target.value,
                              })
                            }
                            className="flex-1 font-mono text-sm"
                            placeholder="#1F2937"
                          />
                        </div>
                      </div>

                      {/* Logo URL */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Logo URL (Optional)
                        </Label>
                        <Input
                          placeholder="https://example.com/logo.png"
                          value={newSchool.logoUrl}
                          onChange={(e) =>
                            setNewSchool({
                              ...newSchool,
                              logoUrl: e.target.value,
                            })
                          }
                        />
                      </div>

                      {/* Theme Preference */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          Default Theme
                        </Label>
                        <Select
                          value={newSchool.subscriptionTier}
                          onValueChange={(value) =>
                            setNewSchool({
                              ...newSchool,
                              subscriptionTier: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light Theme</SelectItem>
                            <SelectItem value="dark">Dark Theme</SelectItem>
                            <SelectItem value="auto">Auto (System)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Choose Your Plan
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan, index) => (
                      <motion.div
                        key={plan.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          setNewSchool({ ...newSchool, planId: plan.id })
                        }
                        className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          newSchool.planId === plan.id
                            ? "border-indigo-500 bg-indigo-50 shadow-lg"
                            : "border-gray-200 hover:border-indigo-300 hover:shadow-md"
                        }`}
                      >
                        {index === 0 && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <div className="bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                              Most Popular
                            </div>
                          </div>
                        )}

                        {newSchool.planId === plan.id && (
                          <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}

                        <div className="text-center">
                          <CheckCircle2
                            className={`w-8 h-8 mx-auto mb-3 ${
                              newSchool.planId === plan.id
                                ? "text-indigo-600"
                                : "text-gray-400"
                            }`}
                          />
                          <h4 className="text-lg font-bold text-gray-900 mb-2">
                            {plan.name}
                          </h4>
                          <div className="mb-4">
                            <span className="text-3xl font-black text-gray-900">
                              {plan.currency}
                              {plan.basePrice}
                            </span>
                            <span className="text-gray-600">/month</span>
                            {plan.perStudentPrice > 0 && (
                              <div className="text-sm text-gray-600 mt-1">
                                + {plan.currency}
                                {plan.perStudentPrice} per student
                              </div>
                            )}
                          </div>
                          <p className="text-gray-700 text-sm">
                            {plan.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Additional Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">
                        Maximum Students
                      </Label>
                      <Input
                        type="number"
                        placeholder="50"
                        value={newSchool.maxStudents}
                        onChange={(e) =>
                          setNewSchool({
                            ...newSchool,
                            maxStudents: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">
                        Billing Cycle
                      </Label>
                      <Select
                        value={newSchool.billingCycle}
                        onValueChange={(value) =>
                          setNewSchool({ ...newSchool, billingCycle: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select billing cycle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}

              <div className="text-sm text-gray-600">
                Step {currentStep} of {steps.length}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

              {currentStep < 3 ? (
                <Button
                  onClick={nextStep}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreateSchool}
                  disabled={creating}
                  className="bg-green-600 hover:bg-green-700 min-w-[150px]"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Create School
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
