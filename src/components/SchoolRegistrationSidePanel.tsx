"use client";

import { useState } from "react";
import { FiX, FiArrowRight, FiMail, FiLock, FiUser, FiPhone, FiMapPin, FiHome, FiCheckCircle, FiRefreshCw } from "react-icons/fi";

interface SchoolRegistrationSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SchoolRegistrationSidePanel({ isOpen, onClose }: SchoolRegistrationSidePanelProps) {
  const [step, setStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  const [formData, setFormData] = useState({
    schoolName: "",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    country: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const sendVerificationEmail = async () => {
    if (!formData.adminEmail) return;

    setIsVerifying(true);
    try {
      // Simulate API call to send verification email
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.adminEmail,
          schoolName: formData.schoolName,
          adminName: formData.adminName,
        }),
      });

      if (response.ok) {
        setIsEmailSent(true);
        setVerificationError("");
      } else {
        setVerificationError("Failed to send verification email. Please try again.");
      }
    } catch (error) {
      setVerificationError("Network error. Please check your connection and try again.");
    }
    setIsVerifying(false);
  };

  const verifyEmailCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError("Please enter a valid 6-digit verification code.");
      return;
    }

    setIsVerifying(true);
    try {
      // Simulate API call to verify code
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.adminEmail,
          code: verificationCode,
        }),
      });

      if (response.ok) {
        setEmailVerified(true);
        setVerificationError("");
      } else {
        setVerificationError("Invalid verification code. Please check and try again.");
      }
    } catch (error) {
      setVerificationError("Verification failed. Please try again.");
    }
    setIsVerifying(false);
  };

  const handleSubmit = async () => {
    if (!emailVerified) {
      setVerificationError("Please verify your email address before submitting.");
      return;
    }

    setIsVerifying(true);
    try {
      // Final registration submission
      const response = await fetch('/api/schools/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log("School registration successful:", formData);
        onClose();
        // You might want to show a success message or redirect
      } else {
        setVerificationError("Registration failed. Please try again.");
      }
    } catch (error) {
      setVerificationError("Network error. Please check your connection and try again.");
    }
    setIsVerifying(false);
  };

  return (
    <>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
            onClick={onClose}
          />

          {/* Side Panel */}
          <div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-black">Create Your School</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-4">
              <div className="flex items-center space-x-2 mb-2">
                {[1, 2, 3].map((stepNumber) => (
                  <div
                    key={stepNumber}
                    className={`flex-1 h-1 rounded-full ${
                      stepNumber <= step ? 'bg-black' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>School Info</span>
                <span>Admin Account</span>
                <span>Email Verify</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 pb-6">
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-2">School Information</h3>
                    <p className="text-sm text-gray-600 mb-4">Tell us about your Islamic school</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School Name *
                      </label>
                      <div className="relative">
                        <FiHome className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          name="schoolName"
                          value={formData.schoolName}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="Enter school name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address *
                      </label>
                      <div className="relative">
                        <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="School address"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-2">Admin Account</h3>
                    <p className="text-sm text-gray-600 mb-4">Create your administrator account</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          name="adminName"
                          value={formData.adminName}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="email"
                          name="adminEmail"
                          value={formData.adminEmail}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="admin@school.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="tel"
                          name="adminPhone"
                          value={formData.adminPhone}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="Create a strong password"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="Confirm your password"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-2">Email Verification</h3>
                    <p className="text-sm text-gray-600 mb-4">Verify your email address to complete registration</p>
                  </div>

                  {/* Email Verification Section */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <FiMail className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">{formData.adminEmail}</span>
                        </div>
                        {isEmailSent && !emailVerified && (
                          <FiCheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>

                      {!isEmailSent ? (
                        <button
                          onClick={sendVerificationEmail}
                          disabled={isVerifying}
                          className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                          {isVerifying ? (
                            <>
                              <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <FiMail className="w-4 h-4 mr-2" />
                              Send Verification Email
                            </>
                          )}
                        </button>
                      ) : emailVerified ? (
                        <div className="text-center py-4">
                          <FiCheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                          <p className="text-sm font-medium text-green-700">Email Verified Successfully!</p>
                          <p className="text-xs text-gray-600 mt-1">You can now complete your registration.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-700">
                            We've sent a 6-digit verification code to your email address.
                          </p>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Verification Code
                            </label>
                            <input
                              type="text"
                              value={verificationCode}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setVerificationCode(value);
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-center text-2xl font-mono tracking-widest"
                              placeholder="000000"
                              maxLength={6}
                            />
                          </div>

                          <div className="flex space-x-3">
                            <button
                              onClick={verifyEmailCode}
                              disabled={isVerifying || verificationCode.length !== 6}
                              className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isVerifying ? "Verifying..." : "Verify Code"}
                            </button>
                            <button
                              onClick={() => {
                                setIsEmailSent(false);
                                setVerificationCode("");
                                setVerificationError("");
                              }}
                              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Resend
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {verificationError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800">{verificationError}</p>
                      </div>
                    )}

                    {/* Information Summary */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Registration Summary</h4>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p><strong>School:</strong> {formData.schoolName}</p>
                        <p><strong>Admin:</strong> {formData.adminName}</p>
                        <p><strong>Email:</strong> {formData.adminEmail}</p>
                      </div>
                      <p className="text-xs text-blue-700 mt-3">
                        Complete email verification to finalize your school registration.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6">
              <div className="flex justify-between">
                {step > 1 ? (
                  <button
                    onClick={handlePrev}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
                  >
                    Next
                    <FiArrowRight className="ml-2 w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!emailVerified || isVerifying}
                    className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isVerifying ? (
                      <>
                        <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="w-4 h-4 mr-2" />
                        Complete Registration
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
