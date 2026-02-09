"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  FiUser,
  FiBell,
  FiLock,
  FiMail,
  FiSave,
  FiSettings,
  FiCheck,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBranding } from "../layout";

export default function ControllerSettings() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const { data: session } = useSession();
  const router = useRouter();
  const branding = useBranding();

  const primaryColor = branding?.primaryColor || "#0f766e";
  const secondaryColor = branding?.secondaryColor || "#06b6d4";
  const schoolName = branding?.name || "Quran Academy";

  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    language: "en",
    timezone: "UTC",
    theme: "light",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!session || session.user?.role !== "controller") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <FiLock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Controller Settings
          </h1>
          <p className="text-gray-600 text-lg mt-2">
            Manage your account preferences and notifications
          </p>
        </div>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2"
          >
            <FiCheck className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Settings saved successfully!</span>
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <FiUser className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Profile Settings</h3>
                <p className="text-sm text-gray-600">Update your personal information</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={session.user?.name || ""}
                readOnly
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium"
              />
              <p className="text-xs text-gray-500 mt-1">
                Contact admin to update your name
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={session.user?.email || ""}
                readOnly
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium"
              />
              <p className="text-xs text-gray-500 mt-1">
                Contact admin to update your email
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800">
                  {session.user?.role?.toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-600">Controller</span>
              </div>
            </div>
          </div>
        </motion.div>

      


        {/* Account Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${secondaryColor}15` }}
              >
                <FiLock className="w-5 h-5" style={{ color: secondaryColor }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Account Security</h3>
                <p className="text-sm text-gray-600">Manage your account security</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change Password
              </label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // This would typically open a modal or navigate to a password change page
                  alert("Password change functionality would be implemented here. Please contact admin.");
                }}
              >
                <FiLock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Contact system administrator to change your password
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FiMail className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Need Help?</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      For account-related changes or technical support, please contact the system administrator at{" "}
                      <a
                        href={`mailto:${branding?.supportEmail || 'support@quranacademy.com'}`}
                        className="font-medium underline hover:text-yellow-900"
                      >
                        {branding?.supportEmail || 'support@quranacademy.com'}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-end pt-6 border-t border-gray-200"
      >
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 text-base font-semibold"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          }}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <FiSave className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
