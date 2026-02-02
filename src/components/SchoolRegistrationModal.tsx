"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Check, Building2, User, Settings, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SchoolRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  // School Information
  schoolName: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolAddress: string;

  // Admin Information
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminUsername: string;
  adminPassword: string;

  // Configuration
  timezone: string;
  defaultCurrency: string;
  defaultLanguage: string;

  // Additional
  expectedStudents: string;
  schoolType: string;
  additionalNotes: string;
}

const initialFormData: FormData = {
  schoolName: "",
  schoolEmail: "",
  schoolPhone: "",
  schoolAddress: "",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
  adminUsername: "",
  adminPassword: "",
  timezone: "Africa/Addis_Ababa",
  defaultCurrency: "ETB",
  defaultLanguage: "en",
  expectedStudents: "",
  schoolType: "",
  additionalNotes: "",
};

export default function SchoolRegistrationModal({ isOpen, onClose }: SchoolRegistrationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const totalSteps = 3;

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // School Information
        return !!(formData.schoolName && formData.schoolEmail);
      case 2: // Admin Information
        return !!(formData.adminName && formData.adminEmail && formData.adminUsername && formData.adminPassword);
      case 3: // Configuration
        return true; // Optional fields
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/school-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolName: formData.schoolName,
          schoolEmail: formData.schoolEmail,
          schoolPhone: formData.schoolPhone,
          schoolAddress: formData.schoolAddress,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPhone: formData.adminPhone,
          adminUsername: formData.adminUsername,
          adminPassword: formData.adminPassword,
          timezone: formData.timezone,
          defaultCurrency: formData.defaultCurrency,
          defaultLanguage: formData.defaultLanguage,
          expectedStudents: formData.expectedStudents ? parseInt(formData.expectedStudents) : undefined,
          schoolType: formData.schoolType,
          additionalNotes: formData.additionalNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
        setFormData(initialFormData);
        setCurrentStep(1);
        setSubmitSuccess(false);
      }, 3000);

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
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
            className="space-y-6"
          >
            <div className="text-center">
              <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900">School Information</h3>
              <p className="text-gray-600 mt-2">Tell us about your school</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="schoolName">School Name *</Label>
                <Input
                  id="schoolName"
                  value={formData.schoolName}
                  onChange={(e) => handleInputChange("schoolName", e.target.value)}
                  placeholder="Enter your school name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="schoolEmail">School Email *</Label>
                <Input
                  id="schoolEmail"
                  type="email"
                  value={formData.schoolEmail}
                  onChange={(e) => handleInputChange("schoolEmail", e.target.value)}
                  placeholder="school@example.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="schoolPhone">School Phone</Label>
                <Input
                  id="schoolPhone"
                  value={formData.schoolPhone}
                  onChange={(e) => handleInputChange("schoolPhone", e.target.value)}
                  placeholder="+251..."
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="schoolAddress">School Address</Label>
                <Textarea
                  id="schoolAddress"
                  value={formData.schoolAddress}
                  onChange={(e) => handleInputChange("schoolAddress", e.target.value)}
                  placeholder="Enter your school address"
                  className="mt-1"
                  rows={3}
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
            className="space-y-6"
          >
            <div className="text-center">
              <User className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900">Admin Account</h3>
              <p className="text-gray-600 mt-2">Create your administrator account</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="adminName">Full Name *</Label>
                <Input
                  id="adminName"
                  value={formData.adminName}
                  onChange={(e) => handleInputChange("adminName", e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="adminEmail">Email Address *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                  placeholder="admin@example.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="adminPhone">Phone Number</Label>
                <Input
                  id="adminPhone"
                  value={formData.adminPhone}
                  onChange={(e) => handleInputChange("adminPhone", e.target.value)}
                  placeholder="+251..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="adminUsername">Username *</Label>
                <Input
                  id="adminUsername"
                  value={formData.adminUsername}
                  onChange={(e) => handleInputChange("adminUsername", e.target.value)}
                  placeholder="Choose a username"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="adminPassword">Password *</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                  placeholder="Create a secure password"
                  className="mt-1"
                />
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
            className="space-y-6"
          >
            <div className="text-center">
              <Settings className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900">Configuration</h3>
              <p className="text-gray-600 mt-2">Customize your school settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={formData.timezone} onValueChange={(value) => handleInputChange("timezone", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Addis_Ababa">East Africa Time (EAT)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Asia/Riyadh">Arabia Standard Time (AST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="defaultCurrency">Currency</Label>
                <Select value={formData.defaultCurrency} onValueChange={(value) => handleInputChange("defaultCurrency", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ETB">Ethiopian Birr (ETB)</SelectItem>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="SAR">Saudi Riyal (SAR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="defaultLanguage">Language</Label>
                <Select value={formData.defaultLanguage} onValueChange={(value) => handleInputChange("defaultLanguage", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="am">Amharic</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expectedStudents">Expected Number of Students</Label>
                <Input
                  id="expectedStudents"
                  type="number"
                  value={formData.expectedStudents}
                  onChange={(e) => handleInputChange("expectedStudents", e.target.value)}
                  placeholder="100"
                  className="mt-1"
                  min="1"
                  max="10000"
                />
              </div>

              <div>
                <Label htmlFor="schoolType">School Type</Label>
                <Select value={formData.schoolType} onValueChange={(value) => handleInputChange("schoolType", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select school type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="madrasa">Madrasa</SelectItem>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="academy">Academy</SelectItem>
                    <SelectItem value="institute">Institute</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                  placeholder="Any additional information about your school..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Register Your School</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {submitSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h3>
                <p className="text-gray-600 mb-6">
                  Thank you for registering your school. Our team will review your application and get back to you within 24-48 hours.
                </p>
                <p className="text-sm text-gray-500">
                  You will receive an email confirmation and further instructions.
                </p>
              </motion.div>
            ) : (
              renderStepContent()
            )}

            {submitError && (
              <Alert className="mt-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {submitError}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Footer */}
          {!submitSuccess && (
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex space-x-2">
                {currentStep < totalSteps ? (
                  <Button
                    onClick={handleNext}
                    disabled={!validateStep(currentStep)}
                    className="flex items-center"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!validateStep(currentStep) || isSubmitting}
                    className="flex items-center bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Registration
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}



