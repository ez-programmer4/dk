"use client";

import { useState, useEffect } from "react";
import {
  FiPackage,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiDownload,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCreditCard,
  FiGlobe,
  FiMail,
  FiPhone,
  FiTrendingUp,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiPercent,
} from "react-icons/fi";
import {
  format as formatDate,
} from "date-fns";

interface Subscription {
  id: number;
  studentId: number;
  packageId: number;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: string;
  startDate: string;
  endDate: string;
  nextBillingDate: string | null;
  autoRenew: boolean;
  taxEnabled: boolean;
  totalTaxPaid: number;
  createdAt: string;
  updatedAt: string;
  student: {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    country: string | null;
    status: string | null;
  };
  package: {
    id: number;
    name: string;
    duration: number;
    price: number;
    currency: string;
    description: string | null;
  };
  paymentStats: {
    totalPaid: number;
    paymentCount: number;
    lastPaymentDate: string | null;
    lastPayment: {
      id: number;
      amount: number;
      date: string;
      status: string;
      currency: string;
    } | null;
  };
  taxStats: {
    transactionCount: number;
    recentTransactions: Array<{
      id: string;
      taxAmount: number;
      totalAmount: number;
      createdAt: string;
    }>;
  };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [packageFilter, setPackageFilter] = useState("");
  const [packages, setPackages] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "payments" | "tax"
  >("overview");
  const [page, setPage] = useState(1);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (packageFilter) params.append("packageId", packageFilter);

      const response = await fetch(`/api/controller/subscriptions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch subscriptions");

      const data = await response.json();
      setSubscriptions(data.data);
      setPagination(data.pagination);
      if (data.filters?.packages) {
        setPackages(data.filters.packages);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [page, search, statusFilter, packageFilter]);

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "active")
      return "bg-green-100 text-green-800 border-green-200";
    if (statusLower === "canceled")
      return "bg-red-100 text-red-800 border-red-200";
    if (statusLower === "past_due")
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (statusLower === "trialing")
      return "bg-blue-100 text-blue-800 border-blue-200";
    if (statusLower === "unpaid")
      return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "active") return <FiCheckCircle className="h-4 w-4" />;
    if (statusLower === "canceled") return <FiXCircle className="h-4 w-4" />;
    if (statusLower === "past_due" || statusLower === "unpaid")
      return <FiAlertCircle className="h-4 w-4" />;
    return <FiClock className="h-4 w-4" />;
  };

  const isActive = (endDate: string) => {
    return new Date(endDate) >= new Date();
  };

  const handleExport = () => {
    const csv = [
      [
        "Student Name",
        "Email",
        "Phone",
        "Country",
        "Package",
        "Status",
        "Start Date",
        "End Date",
        "Next Billing",
        "Auto Renew",
        "Total Paid",
        "Payment Count",
        "Tax Enabled",
        "Total Tax Paid",
        "Stripe Subscription ID",
      ],
      ...subscriptions.map((sub) => [
        sub.student.name,
        sub.student.email || "",
        sub.student.phone || "",
        sub.student.country || "",
        sub.package.name,
        sub.status,
        formatDate(new Date(sub.startDate), "yyyy-MM-dd"),
        formatDate(new Date(sub.endDate), "yyyy-MM-dd"),
        sub.nextBillingDate
          ? formatDate(new Date(sub.nextBillingDate), "yyyy-MM-dd")
          : "",
        sub.autoRenew ? "Yes" : "No",
        `${sub.package.currency} ${sub.paymentStats.totalPaid.toFixed(2)}`,
        sub.paymentStats.paymentCount.toString(),
        sub.taxEnabled ? "Yes" : "No",
        `${sub.package.currency} ${sub.taxStats.recentTransactions
          .reduce((sum, tx) => sum + tx.taxAmount, 0)
          .toFixed(2)}`,
        sub.stripeSubscriptionId,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscriptions-${formatDate(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const stats = subscriptions.reduce(
    (acc, sub) => {
      acc.total += 1;
      if (sub.status.toLowerCase() === "active") acc.active += 1;
      if (sub.autoRenew) acc.autoRenew += 1;
      acc.totalRevenue += sub.paymentStats.totalPaid;
      return acc;
    },
    { total: 0, active: 0, autoRenew: 0, totalRevenue: 0 }
  );


  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Simplified Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Subscriptions</h1>
            <p className="text-gray-600">Manage your students' subscriptions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchSubscriptions}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <FiDownload className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Simplified Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total</span>
              <FiPackage className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Active</span>
              <FiCheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Auto Renew</span>
              <FiTrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.autoRenew}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Revenue</span>
              <FiDollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Simplified Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="canceled">Canceled</option>
              <option value="past_due">Past Due</option>
              <option value="trialing">Trialing</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <select
              value={packageFilter}
              onChange={(e) => {
                setPackageFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="">All Packages</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>
          </div>
        </div>


        {/* Simplified Subscriptions Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <FiRefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="p-12 text-center">
              <FiPackage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">No subscriptions found</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Package
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Total Paid
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscriptions.map((sub, index) => (
                      <tr
                        key={sub.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedSubscription(sub);
                          setShowDetailModal(true);
                        }}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{sub.student.name}</p>
                            {sub.student.phone && (
                              <p className="text-sm text-gray-500">{sub.student.phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{sub.package.name}</p>
                          <p className="text-sm text-gray-500">{sub.package.duration} months</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(sub.status)}`}>
                            {getStatusIcon(sub.status)}
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900">
                            {formatDate(new Date(sub.startDate), "MMM dd, yyyy")}
                          </p>
                          <p className="text-sm text-gray-500">
                            to {formatDate(new Date(sub.endDate), "MMM dd, yyyy")}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {sub.package.currency} {sub.paymentStats.totalPaid.toFixed(2)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubscription(sub);
                              setShowDetailModal(true);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Simplified Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="px-4 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
                  <div className="text-sm text-gray-600">
                    Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{" "}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{" "}
                    {pagination.totalItems}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!pagination.hasPreviousPage}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors text-sm"
                    >
                      <FiChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors text-sm"
                    >
                      <FiChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Simplified Detail Modal */}
      {showDetailModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-indigo-600 text-white p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Subscription Details</h2>
                <p className="text-sm text-indigo-100">
                  {selectedSubscription.student.name} • {selectedSubscription.package.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setActiveTab("overview");
                }}
                className="p-2 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <FiXCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Simplified Tabs */}
            <div className="border-b border-gray-200 bg-gray-50 px-4">
              <div className="flex space-x-1">
                {[
                  { id: "overview", label: "Overview", icon: FiUser },
                  { id: "payments", label: "Payments", icon: FiDollarSign },
                  { id: "tax", label: "Tax", icon: FiPercent },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                        activeTab === tab.id
                          ? "border-indigo-600 text-indigo-600 bg-white"
                          : "border-transparent text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Student Info */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiUser className="h-5 w-5 text-indigo-600" />
                      Student Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Name</p>
                        <p className="font-semibold text-gray-900">
                          {selectedSubscription.student.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Student ID</p>
                        <p className="font-semibold text-gray-900">
                          #{selectedSubscription.student.id}
                        </p>
                      </div>
                      {selectedSubscription.student.email && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Email</p>
                          <p className="font-semibold text-gray-900">
                            {selectedSubscription.student.email}
                          </p>
                        </div>
                      )}
                      {selectedSubscription.student.phone && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Phone</p>
                          <p className="font-semibold text-gray-900">
                            {selectedSubscription.student.phone}
                          </p>
                        </div>
                      )}
                      {selectedSubscription.student.country && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Country</p>
                          <p className="font-semibold text-gray-900">
                            {selectedSubscription.student.country}
                          </p>
                        </div>
                      )}
                      {selectedSubscription.student.status && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Status</p>
                          <p className="font-semibold text-gray-900">
                            {selectedSubscription.student.status}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Package Info */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiPackage className="h-5 w-5 text-purple-600" />
                      Package Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Package Name
                        </p>
                        <p className="font-semibold text-gray-900">
                          {selectedSubscription.package.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Duration</p>
                        <p className="font-semibold text-gray-900">
                          {selectedSubscription.package.duration} months
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Price</p>
                        <p className="font-semibold text-gray-900">
                          {selectedSubscription.package.currency}{" "}
                          {selectedSubscription.package.price.toFixed(2)}
                        </p>
                      </div>
                      {selectedSubscription.package.description && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600 mb-1">
                            Description
                          </p>
                          <p className="font-semibold text-gray-900">
                            {selectedSubscription.package.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subscription Details */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiCalendar className="h-5 w-5 text-green-600" />
                      Subscription Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Status</p>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            selectedSubscription.status
                          )}`}
                        >
                          {getStatusIcon(selectedSubscription.status)}
                          {selectedSubscription.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Auto Renew</p>
                        <p className="font-semibold text-gray-900">
                          {selectedSubscription.autoRenew ? (
                            <span className="text-green-600">Enabled</span>
                          ) : (
                            <span className="text-red-600">Disabled</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Start Date</p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(
                            new Date(selectedSubscription.startDate),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">End Date</p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(
                            new Date(selectedSubscription.endDate),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </p>
                      </div>
                      {selectedSubscription.nextBillingDate && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Next Billing Date
                          </p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(
                              new Date(selectedSubscription.nextBillingDate),
                              "MMM dd, yyyy HH:mm"
                            )}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Created At</p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(
                            new Date(selectedSubscription.createdAt),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Stats */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiDollarSign className="h-5 w-5 text-orange-600" />
                      Payment Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                        <p className="font-semibold text-gray-900 text-xl">
                          {selectedSubscription.package.currency}{" "}
                          {selectedSubscription.paymentStats.totalPaid.toFixed(
                            2
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Payment Count
                        </p>
                        <p className="font-semibold text-gray-900 text-xl">
                          {selectedSubscription.paymentStats.paymentCount}
                        </p>
                      </div>
                      {selectedSubscription.paymentStats.lastPayment && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              Last Payment Amount
                            </p>
                            <p className="font-semibold text-gray-900">
                              {
                                selectedSubscription.paymentStats.lastPayment
                                  .currency
                              }{" "}
                              {selectedSubscription.paymentStats.lastPayment.amount.toFixed(
                                2
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              Last Payment Date
                            </p>
                            <p className="font-semibold text-gray-900">
                              {formatDate(
                                new Date(
                                  selectedSubscription.paymentStats.lastPayment.date
                                ),
                                "MMM dd, yyyy HH:mm"
                              )}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tax Stats */}
                  {selectedSubscription.taxEnabled && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiPercent className="h-5 w-5 text-indigo-600" />
                        Tax Information
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Tax Enabled</p>
                          <p className="font-semibold text-green-600">Yes</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Total Tax Paid</p>
                          <p className="font-semibold text-gray-900">
                            {selectedSubscription.package.currency} {selectedSubscription.totalTaxPaid.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Transactions</p>
                          <p className="font-semibold text-gray-900">
                            {selectedSubscription.taxStats.transactionCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stripe Info */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiCreditCard className="h-5 w-5 text-gray-600" />
                      Stripe Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Subscription ID</p>
                        <p className="font-mono text-sm text-gray-900 break-all bg-white p-2 rounded border border-gray-200">
                          {selectedSubscription.stripeSubscriptionId}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Customer ID</p>
                        <p className="font-mono text-sm text-gray-900 break-all bg-white p-2 rounded border border-gray-200">
                          {selectedSubscription.stripeCustomerId}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "payments" && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiDollarSign className="h-5 w-5 text-orange-600" />
                      Payment Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                        <p className="text-xl font-bold text-gray-900">
                          {selectedSubscription.package.currency} {selectedSubscription.paymentStats.totalPaid.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Payment Count</p>
                        <p className="text-xl font-bold text-gray-900">
                          {selectedSubscription.paymentStats.paymentCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Average Payment</p>
                        <p className="text-xl font-bold text-gray-900">
                          {selectedSubscription.package.currency}{" "}
                          {selectedSubscription.paymentStats.paymentCount > 0
                            ? (selectedSubscription.paymentStats.totalPaid / selectedSubscription.paymentStats.paymentCount).toFixed(2)
                            : "0.00"}
                        </p>
                      </div>
                      {selectedSubscription.paymentStats.lastPayment && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Last Payment</p>
                          <p className="text-xl font-bold text-gray-900">
                            {selectedSubscription.paymentStats.lastPayment.currency}{" "}
                            {selectedSubscription.paymentStats.lastPayment.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(new Date(selectedSubscription.paymentStats.lastPayment.date), "MMM dd, yyyy")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "tax" && (
                <div className="space-y-4">
                  {selectedSubscription.taxEnabled ? (
                    <>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <FiPercent className="h-5 w-5 text-indigo-600" />
                          Tax Summary
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Tax Enabled</p>
                            <p className="text-lg font-bold text-green-600">Yes</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Total Tax Paid</p>
                            <p className="text-lg font-bold text-gray-900">
                              {selectedSubscription.package.currency} {selectedSubscription.totalTaxPaid.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Transactions</p>
                            <p className="text-lg font-bold text-gray-900">
                              {selectedSubscription.taxStats.transactionCount}
                            </p>
                          </div>
                        </div>
                      </div>
                      {selectedSubscription.taxStats.recentTransactions.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                          <div className="space-y-2">
                            {selectedSubscription.taxStats.recentTransactions.map((tx) => (
                              <div key={tx.id} className="bg-gray-50 rounded p-3 border border-gray-200">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      Tax: {selectedSubscription.package.currency} {tx.taxAmount.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {formatDate(new Date(tx.createdAt), "MMM dd, yyyy")}
                                    </p>
                                  </div>
                                  <p className="font-bold text-gray-900">
                                    Total: {selectedSubscription.package.currency} {tx.totalAmount.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                      <FiPercent className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="font-medium text-gray-700 mb-1">Tax Not Enabled</p>
                      <p className="text-sm text-gray-500">This subscription does not have tax enabled.</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
