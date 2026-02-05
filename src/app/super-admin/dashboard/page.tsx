"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Crown,
  Shield,
  Settings,
  Bot,
  Users,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SuperAdminDashboard() {

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome to your platform control center</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/super-admin/settings">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center text-indigo-900">
                <Crown className="w-6 h-6 mr-3 text-indigo-600" />
                Super Administrator Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  You have full access to manage the platform. This dashboard provides an overview of your administrative capabilities.
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-green-600" />
                    <span>Full Platform Access</span>
                  </div>
                  <div className="flex items-center">
                    <Crown className="w-4 h-4 mr-2 text-purple-600" />
                    <span>Super Admin Privileges</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feature Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Platform Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                  </div>
                  <h3 className="font-medium text-sm mb-1">Database</h3>
                  <p className="text-xs text-gray-600">Operational</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                  </div>
                  <h3 className="font-medium text-sm mb-1">API Services</h3>
                  <p className="text-xs text-gray-600">Healthy</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                  </div>
                  <h3 className="font-medium text-sm mb-1">System</h3>
                  <p className="text-xs text-gray-600">Running</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/super-admin/settings">
                  <div className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <Bot className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">Bot Settings</h3>
                        <p className="text-sm text-gray-600">Configure Telegram bot</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/super-admin/school-registrations">
                  <div className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-8 h-8 text-green-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">School Approvals</h3>
                        <p className="text-sm text-gray-600">Review registrations</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/super-admin/schools">
                  <div className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <Users className="w-8 h-8 text-purple-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">Manage Schools</h3>
                        <p className="text-sm text-gray-600">School administration</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/super-admin/payments">
                  <div className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-8 h-8 text-orange-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">Payments</h3>
                        <p className="text-sm text-gray-600">Revenue management</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}






