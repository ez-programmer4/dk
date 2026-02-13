"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiCreditCard,
  FiCalendar,
  FiUsers,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";

interface Subscription {
  id: number;
  studentId: number;
  studentName: string;
  packageName: string;
  amount: number;
  currency: string;
  status: "active" | "expired" | "pending" | "cancelled";
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod: string;
}

export default function ControllerSubscriptionsPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "pending">("all");

  useEffect(() => {
    // Mock data for subscriptions
    const mockSubscriptions: Subscription[] = [
      {
        id: 1,
        studentId: 1001,
        studentName: "Ahmed Hassan",
        packageName: "Premium Monthly",
        amount: 150,
        currency: "ETB",
        status: "active",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        autoRenew: true,
        paymentMethod: "Bank Transfer",
      },
      {
        id: 2,
        studentId: 1002,
        studentName: "Fatima Al-Zahra",
        packageName: "Standard Monthly",
        amount: 100,
        currency: "ETB",
        status: "active",
        startDate: "2024-02-01",
        endDate: "2024-12-31",
        autoRenew: false,
        paymentMethod: "Cash",
      },
      {
        id: 3,
        studentId: 1003,
        studentName: "Omar Khalid",
        packageName: "Premium Quarterly",
        amount: 400,
        currency: "ETB",
        status: "pending",
        startDate: "2024-03-01",
        endDate: "2024-05-31",
        autoRenew: true,
        paymentMethod: "Chapa",
      },
      {
        id: 4,
        studentId: 1004,
        studentName: "Aisha Mahmoud",
        packageName: "Standard Monthly",
        amount: 100,
        currency: "ETB",
        status: "expired",
        startDate: "2023-12-01",
        endDate: "2023-12-31",
        autoRenew: false,
        paymentMethod: "Bank Transfer",
      },
    ];

    setTimeout(() => {
      setSubscriptions(mockSubscriptions);
      setLoading(false);
    }, 1000);
  }, [schoolSlug]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "expired":
        return "text-red-600 bg-red-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "cancelled":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <FiCheckCircle className="h-4 w-4" />;
      case "expired":
        return <FiClock className="h-4 w-4" />;
      case "pending":
        return <FiClock className="h-4 w-4" />;
      default:
        return <FiCreditCard className="h-4 w-4" />;
    }
  };

  const filteredSubscriptions = subscriptions.filter(subscription => {
    if (filter === "all") return true;
    return subscription.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-md">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Student Subscriptions
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and monitor subscription packages for students in {schoolSlug}.
              </p>
            </div>

            <div className="flex gap-2">
              {["all", "active", "expired", "pending"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== "all" && (
                    <span className="ml-1">
                      ({subscriptions.filter(s => s.status === status).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <FiCheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-green-900">
                    {subscriptions.filter(s => s.status === "active").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <FiTrendingUp className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {subscriptions
                      .filter(s => s.status === "active")
                      .reduce((sum, s) => sum + s.amount, 0)} ETB
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <FiUsers className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-900">Total Students</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {subscriptions.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <FiCreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === "all" ? "No subscriptions found" : `No ${filter} subscriptions`}
              </h3>
              <p className="text-gray-500">
                {filter === "all"
                  ? "There are no student subscriptions at this time."
                  : `There are no ${filter} subscriptions.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Package
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auto Renew
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {subscription.studentName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {subscription.studentId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {subscription.packageName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {subscription.paymentMethod}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {subscription.amount} {subscription.currency}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                          {getStatusIcon(subscription.status)}
                          {subscription.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(subscription.startDate).toLocaleDateString()} - {new Date(subscription.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          subscription.autoRenew
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {subscription.autoRenew ? "Yes" : "No"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}































