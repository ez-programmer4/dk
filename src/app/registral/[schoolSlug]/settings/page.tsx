"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiSettings,
  FiShield,
  FiSave,
  FiEdit,
} from "react-icons/fi";

export default function RegistralSettingsPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "",
    schoolSlug: "",
  });

  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || "",
        username: session.user.username || "",
        email: (session.user as any).email || "",
        phone: (session.user as any).phone || "",
        role: session.user.role || "",
        schoolSlug: session.user.schoolSlug || "",
      });
    }
  }, [session]);

  const handleSave = async () => {
    setLoading(true);
    // Here you could implement profile update functionality
    // For now, just show a success message
    setTimeout(() => {
      setLoading(false);
      // You could add toast notification here
    }, 1000);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-500"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl shadow-xl">
              <FiSettings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                My Profile & Settings
              </h1>
              <p className="text-gray-600 text-lg">Manage your account information and preferences</p>
            </div>
          </div>
        </motion.div>

        {/* Profile Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FiUser className="text-teal-600" />
            Profile Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <FiUser className="text-gray-400" size={20} />
                <span className="text-gray-900 font-medium">{profile.name}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <FiUser className="text-gray-400" size={20} />
                <span className="text-gray-900 font-medium">{profile.username}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <FiMail className="text-gray-400" size={20} />
                <span className="text-gray-900 font-medium">
                  {profile.email || "Not provided"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <FiPhone className="text-gray-400" size={20} />
                <span className="text-gray-900 font-medium">
                  {profile.phone || "Not provided"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <FiShield className="text-gray-400" size={20} />
                <span className="text-gray-900 font-medium capitalize">{profile.role}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                School
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <FiShield className="text-gray-400" size={20} />
                <span className="text-gray-900 font-medium capitalize">{profile.schoolSlug}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FiCalendar className="text-teal-600" />
            Account Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {session?.user ? new Date(session.user.createdAt as string).getFullYear() : "N/A"}
              </div>
              <div className="text-gray-600 font-medium">Member Since</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
              <div className="text-3xl font-bold text-green-600 mb-2">
                Active
              </div>
              <div className="text-gray-600 font-medium">Account Status</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                Registral
              </div>
              <div className="text-gray-600 font-medium">Access Level</div>
            </div>
          </div>
        </motion.div>

        {/* Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FiSettings className="text-teal-600" />
            Preferences
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
                <p className="text-gray-600 text-sm">Receive notifications about your students</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h3 className="text-lg font-medium text-gray-900">SMS Notifications</h3>
                <p className="text-gray-600 text-sm">Receive SMS updates about student activities</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked={false}
                  className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Auto-refresh Dashboard</h3>
                <p className="text-gray-600 text-sm">Automatically refresh data every 5 minutes</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked={true}
                  className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
