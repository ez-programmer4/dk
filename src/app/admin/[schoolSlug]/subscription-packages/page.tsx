"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiAlertCircle,
  FiPackage,
  FiDollarSign,
  FiCalendar,
  FiSettings,
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiSave,
  FiSearch,
} from "react-icons/fi";
import {
  formatCurrency as formatCurrencyValue,
  getCurrencySymbol,
} from "@/lib/formatCurrency";

interface SubscriptionPackage {
  id: number;
  name: string;
  duration: number;
  price: number;
  currency: string;
  description: string | null;
  paymentLink: string | null;
  isActive: boolean;
  configId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Config {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  packages: Array<{
    id: number;
    name: string;
    duration: number;
    price: number;
    currency: string;
  }>;
  studentCount: number;
}

export default function SubscriptionPackagesPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const [activeTab, setActiveTab] = useState<"packages" | "configs">(
    "packages"
  );

  // Packages tab state
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] =
    useState<SubscriptionPackage | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    duration: "",
    price: "",
    currency: "USD",
    description: "",
    paymentLink: "",
    isActive: true,
  });

  // Configs tab state
  const [configs, setConfigs] = useState<Config[]>([]);
  const [allPackages, setAllPackages] = useState<SubscriptionPackage[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [errorConfigs, setErrorConfigs] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [configFormData, setConfigFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    selectedPackageIds: [] as number[],
  });

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("`/api/admin/${schoolSlug}/subscription-packages`");
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (data.success) {
          setPackages(data.packages);
        } else {
          setError(data.error || "Failed to load packages");
        }
      } else {
        setError("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConfigs = useCallback(async () => {
    setLoadingConfigs(true);
    setErrorConfigs(null);
    try {
      const response = await fetch("`/api/admin/${schoolSlug}/subscription-package-configs`");
      const data = await response.json();
      if (data.success) {
        setConfigs(data.configs || []);
      } else {
        setErrorConfigs(data.error || "Failed to load configs");
      }
    } catch (err: any) {
      setErrorConfigs(err.message || "Failed to load configs");
    } finally {
      setLoadingConfigs(false);
    }
  }, []);

  const loadAllPackagesForConfigs = useCallback(async () => {
    try {
      const response = await fetch("`/api/admin/${schoolSlug}/subscription-packages`");
      const data = await response.json();
      if (data.success && data.packages) {
        setAllPackages(
          data.packages.filter((p: SubscriptionPackage) => p.isActive)
        );
      }
    } catch (err: any) {
      console.error("Failed to load packages:", err);
    }
  }, []);

  useEffect(() => {
    loadPackages();
    // Also load configs for the package form dropdown
    loadConfigs();
  }, [loadPackages, loadConfigs]);

  useEffect(() => {
    if (activeTab === "configs") {
      loadConfigs();
      loadAllPackagesForConfigs();
    }
  }, [activeTab, loadConfigs, loadAllPackagesForConfigs]);

  const handleOpenModal = (pkg?: SubscriptionPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        duration: String(pkg.duration),
        price: String(pkg.price),
        currency: pkg.currency,
        description: pkg.description || "",
        paymentLink: pkg.paymentLink || "",
        isActive: pkg.isActive,
      });
    } else {
      setEditingPackage(null);
      setFormData({
        name: "",
        duration: "",
        price: "",
        currency: "USD",
        description: "",
        paymentLink: "",
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleOpenConfigModal = (config?: Config) => {
    if (config) {
      setEditingConfig(config);
      setConfigFormData({
        name: config.name,
        description: config.description || "",
        isActive: config.isActive,
        selectedPackageIds: config.packages.map((p) => p.id),
      });
    } else {
      setEditingConfig(null);
      setConfigFormData({
        name: "",
        description: "",
        isActive: true,
        selectedPackageIds: [],
      });
    }
    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    if (!configFormData.name.trim()) {
      setErrorConfigs("Config name is required");
      return;
    }

    try {
      const url = "`/api/admin/${schoolSlug}/subscription-package-configs`";
      const method = editingConfig ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingConfig && { id: editingConfig.id }),
          name: configFormData.name.trim(),
          description: configFormData.description.trim() || null,
          isActive: configFormData.isActive,
          packageIds: configFormData.selectedPackageIds,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowConfigModal(false);
        loadConfigs();
        loadPackages(); // Reload packages to show updated config assignments
        setErrorConfigs(null);
      } else {
        setErrorConfigs(data.error || "Failed to save config");
      }
    } catch (err: any) {
      setErrorConfigs("Failed to save config");
    }
  };

  const togglePackageSelection = (packageId: number) => {
    setConfigFormData((prev) => ({
      ...prev,
      selectedPackageIds: prev.selectedPackageIds.includes(packageId)
        ? prev.selectedPackageIds.filter((id) => id !== packageId)
        : [...prev.selectedPackageIds, packageId],
    }));
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPackage(null);
    setFormData({
      name: "",
      duration: "",
      price: "",
      currency: "USD",
      description: "",
      paymentLink: "",
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      name: formData.name.trim(),
      duration: parseInt(formData.duration),
      price: parseFloat(formData.price),
      currency: formData.currency.toUpperCase(),
      description: formData.description.trim() || null,
      paymentLink: formData.paymentLink.trim() || null,
      isActive: formData.isActive,
    };

    try {
      const url = editingPackage
        ? `/api/admin/${schoolSlug}/subscription-packages/${editingPackage.id}`
        : `/api/admin/${schoolSlug}/subscription-packages`;
      const method = editingPackage ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (data.success) {
          handleCloseModal();
          loadPackages();
        } else {
          setError(data.error || "Failed to save package");
        }
      } else {
        setError("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save package");
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this package? This will deactivate it."
      )
    ) {
      return;
    }

    setError(null);
    try {
      const response = await fetch(`/api/admin/${schoolSlug}/subscription-packages/${id}`, {
        method: "DELETE",
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (data.success) {
          loadPackages();
        } else {
          setError(data.error || "Failed to delete package");
        }
      } else {
        setError("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete package");
    }
  };

  const handleToggleActive = async (pkg: SubscriptionPackage) => {
    setError(null);
    try {
      const response = await fetch(
        ``/api/admin/${schoolSlug}/subscription-packages`/${pkg.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...pkg,
            isActive: !pkg.isActive,
          }),
        }
      );

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (data.success) {
          loadPackages();
        } else {
          setError(data.error || "Failed to update package");
        }
      } else {
        setError("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update package");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Enhanced Header with School Branding */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+PC9zdmc+')] opacity-20" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              {/* Status & School Info */}
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center gap-2 text-green-300 font-medium text-sm bg-green-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-green-400/30">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  System Online
                </span>
                <span className="text-white/60">•</span>
                <span className="text-xs text-blue-300 bg-blue-500/20 backdrop-blur-sm px-2 py-1 rounded-md font-medium">
                  School: {schoolSlug}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg">
                  <FiPackage className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                    Subscription Packages
                  </h1>
                  <p className="text-indigo-100 text-lg font-medium">
                    Manage subscription packages and configurations for {schoolSlug}
                  </p>
                </div>
              </div>
            </div>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={activeTab === "packages" ? loadPackages : loadConfigs}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-white/20"
            >
              <FiRefreshCw
                className={`w-4 h-4 ${
                  loading || loadingConfigs ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
            {activeTab === "packages" && (
              <button
                onClick={() => handleOpenModal()}
                className="px-5 py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg"
              >
                <FiPlus className="w-5 h-5" />
                Add Package
              </button>
            )}
            {activeTab === "configs" && (
              <button
                onClick={() => handleOpenConfigModal()}
                className="px-5 py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg"
              >
                <FiPlus className="w-5 h-5" />
                New Config
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("packages")}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "packages"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FiPackage className="w-5 h-5" />
              Packages
            </div>
          </button>
          <button
            onClick={() => setActiveTab("configs")}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "configs"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FiSettings className="w-5 h-5" />
              Configs
            </div>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {(error || errorConfigs) && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <FiAlertCircle className="w-5 h-5" />
          <span>{error || errorConfigs}</span>
          <button
            onClick={() => {
              setError(null);
              setErrorConfigs(null);
            }}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Packages Tab Content */}
      {activeTab === "packages" && (
        <>
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <FiRefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-gray-600">Loading packages...</p>
            </div>
          )}

          {/* Packages Table */}
          {!loading && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {packages.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mb-4">
                    <FiPackage className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No subscription packages found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Get started by creating your first package
                  </p>
                  <button
                    onClick={() => handleOpenModal()}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2 shadow-lg"
                  >
                    <FiPlus className="w-5 h-5" />
                    Create First Package
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Package
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {packages.map((pkg) => (
                        <tr
                          key={pkg.id}
                          className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all group"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg group-hover:scale-110 transition-transform">
                                <FiPackage className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {pkg.name}
                                </div>
                                {pkg.description && (
                                  <div className="text-xs text-gray-500 mt-1 max-w-md">
                                    {pkg.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                              <FiCalendar className="w-4 h-4 text-indigo-500" />
                              <span>
                                {pkg.duration}{" "}
                                {pkg.duration === 1 ? "month" : "months"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-green-100 rounded-lg">
                                <FiDollarSign className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="text-sm font-bold text-gray-900">
                                {formatCurrencyValue(pkg.price, pkg.currency)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <button
                              onClick={() => handleToggleActive(pkg)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 ${
                                pkg.isActive
                                  ? "bg-green-100 text-green-700 hover:bg-green-200 shadow-sm"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {pkg.isActive ? (
                                <>
                                  <FiCheck className="w-3.5 h-3.5" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <FiX className="w-3.5 h-3.5" />
                                  Inactive
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-5 text-sm text-gray-600">
                            {new Date(pkg.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenModal(pkg)}
                                className="p-2.5 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                                title="Edit"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(pkg.id)}
                                className="p-2.5 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                                title="Delete"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Configs Tab Content */}
      {activeTab === "configs" && (
        <>
          {/* Workflow Guide */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-indigo-200 shadow-lg p-6 mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <FiSettings className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-indigo-900 mb-3 flex items-center gap-2">
                  <span>Workflow Guide</span>
                </h3>
                <ol className="text-sm text-indigo-800 space-y-2.5 list-none">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <div>
                      <strong className="text-indigo-900">
                        Create Configs:
                      </strong>{" "}
                      Create package configurations here (e.g., "Standard
                      Packages", "Premium Packages")
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <div>
                      <strong className="text-indigo-900">
                        Assign Packages:
                      </strong>{" "}
                      When creating/editing a config, select which packages
                      belong to it
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-600 text-white text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <div>
                      <strong className="text-indigo-900">
                        Assign to Students:
                      </strong>{" "}
                      In the registration page, assign a config to each student
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                    <div>
                      <strong className="text-indigo-900">Result:</strong>{" "}
                      Students will only see packages from their assigned config
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </motion.div>

          {/* Search and New Config Button */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search configs by name, description, or package..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                />
              </div>
            </div>
            <button
              onClick={() => handleOpenConfigModal()}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 whitespace-nowrap"
            >
              <FiPlus className="w-5 h-5" />
              New Config
            </button>
          </div>

          {/* Loading State */}
          {loadingConfigs && (
            <div className="text-center py-12">
              <FiRefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-gray-600">Loading configs...</p>
            </div>
          )}

          {/* Configs Grid */}
          {!loadingConfigs && (
            <>
              {configs.filter((config) => {
                if (!searchTerm) return true;
                const search = searchTerm.toLowerCase();
                return (
                  config.name.toLowerCase().includes(search) ||
                  config.description?.toLowerCase().includes(search) ||
                  config.packages.some((p) =>
                    p.name.toLowerCase().includes(search)
                  )
                );
              }).length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                  <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    No configs found. Create one to get started.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {configs
                    .filter((config) => {
                      if (!searchTerm) return true;
                      const search = searchTerm.toLowerCase();
                      return (
                        config.name.toLowerCase().includes(search) ||
                        config.description?.toLowerCase().includes(search) ||
                        config.packages.some((p) =>
                          p.name.toLowerCase().includes(search)
                        )
                      );
                    })
                    .map((config) => (
                      <motion.div
                        key={config.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-2xl border-2 border-gray-200 hover:border-indigo-400 transition-all duration-300 overflow-hidden"
                      >
                        {/* Gradient accent bar */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                        <div className="p-6">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-extrabold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                {config.name}
                              </h3>
                              {config.description && (
                                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                  {config.description}
                                </p>
                              )}

                              {/* Stats */}
                              <div className="flex items-center gap-4 text-sm mb-4">
                                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-semibold">
                                  <FiPackage className="w-4 h-4" />
                                  {config.packages.length}{" "}
                                  {config.packages.length === 1
                                    ? "Package"
                                    : "Packages"}
                                </span>
                                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 font-semibold">
                                  <FiUsers className="w-4 h-4" />
                                  {config.studentCount}{" "}
                                  {config.studentCount === 1
                                    ? "Student"
                                    : "Students"}
                                </span>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 ml-3">
                              <button
                                onClick={() => handleOpenConfigModal(config)}
                                className="p-2.5 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                                title="Edit"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      `Are you sure you want to delete config "${config.name}"?`
                                    )
                                  ) {
                                    return;
                                  }
                                  try {
                                    const response = await fetch(
                                      ``/api/admin/${schoolSlug}/subscription-package-configs`?id=${config.id}`,
                                      { method: "DELETE" }
                                    );
                                    const data = await response.json();
                                    if (data.success) {
                                      loadConfigs();
                                    } else {
                                      alert(
                                        data.error || "Failed to delete config"
                                      );
                                    }
                                  } catch (err: any) {
                                    alert("Failed to delete config");
                                  }
                                }}
                                className="p-2.5 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                                title="Delete"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Status badge */}
                          <div className="mb-4">
                            {config.isActive ? (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                                <FiCheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200">
                                <FiXCircle className="w-3.5 h-3.5 mr-1.5" />
                                Inactive
                              </span>
                            )}
                          </div>

                          {/* Packages list */}
                          {config.packages.length > 0 ? (
                            <div className="border-t border-gray-200 pt-4">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FiPackage className="w-3.5 h-3.5" />
                                Assigned Packages
                              </p>
                              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                {config.packages.map((pkg) => (
                                  <div
                                    key={pkg.id}
                                    className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-gray-50 to-indigo-50/30 border border-gray-200 hover:border-indigo-300 transition-colors"
                                  >
                                    <span className="text-sm font-semibold text-gray-800">
                                      {pkg.name}
                                    </span>
                                    <span className="text-sm font-bold text-indigo-600">
                                      {formatCurrencyValue(
                                        pkg.price,
                                        pkg.currency
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="border-t border-gray-200 pt-4">
                              <div className="text-center py-3 px-4 rounded-lg bg-amber-50 border border-amber-200">
                                <p className="text-xs font-semibold text-amber-800">
                                  No packages assigned
                                </p>
                                <p className="text-xs text-amber-600 mt-1">
                                  Edit this config to assign packages
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Create/Edit Package Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-auto relative border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-800 rounded-full p-2 bg-gray-100 hover:bg-gray-200 transition-all hover:scale-110"
            >
              <FiX className="w-5 h-5" />
            </button>

            {/* Modal Header with Gradient */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-t-3xl p-6 sm:p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <FiPackage className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    {editingPackage ? "Edit Package" : "Create New Package"}
                  </h2>
                  <p className="text-indigo-100 mt-1 text-sm sm:text-base">
                    {editingPackage
                      ? "Update subscription package details"
                      : "Add a new subscription package for students"}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Package Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Package Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                    placeholder="e.g., 3-Month Package"
                  />
                </div>

                {/* Duration and Currency Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Duration (months) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData({ ...formData, duration: e.target.value })
                        }
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                        placeholder="3"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({ ...formData, currency: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                    </select>
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-600">
                      {getCurrencySymbol(formData.currency)}
                    </span>
                    <FiDollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white text-lg font-semibold"
                      placeholder="55.00"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Description
                    <span className="text-gray-400 font-normal ml-2">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white resize-none"
                    placeholder="Add a description for this package (e.g., '3 months of classes with special discount')"
                  />
                </div>

                {/* Payment Link */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Stripe Payment Link
                    <span className="text-gray-400 font-normal ml-2">
                      (Optional - for auto-renewal subscriptions)
                    </span>
                  </label>
                  <input
                    type="url"
                    value={formData.paymentLink}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentLink: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                    placeholder="https://pay.darulkubra.com/b/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If provided, students will use this payment link for
                    subscription. Otherwise, a dynamic checkout session will be
                    created. Payment links must be configured as recurring
                    subscriptions in Stripe for auto-renewal to work.
                  </p>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm font-semibold text-gray-700 cursor-pointer flex-1"
                  >
                    Active Package
                    <span className="block text-xs font-normal text-gray-500 mt-0.5">
                      Make this package visible to students
                    </span>
                  </label>
                  {formData.isActive && (
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                      Active
                    </div>
                  )}
                </div>

                {/* Error Display in Modal */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  >
                    {editingPackage ? (
                      <span className="flex items-center gap-2">
                        <FiCheck className="w-5 h-5" />
                        Update Package
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <FiPlus className="w-5 h-5" />
                        Create Package
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-auto relative border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-800 rounded-full p-2 bg-gray-100 hover:bg-gray-200 transition-all hover:scale-110"
            >
              <FiX className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-t-3xl p-6 sm:p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <FiSettings className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    {editingConfig ? "Edit Config" : "New Config"}
                  </h2>
                  <p className="text-indigo-100 mt-1 text-sm sm:text-base">
                    {editingConfig
                      ? "Update subscription package config"
                      : "Create a new subscription package config"}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <div className="space-y-6">
                {/* Config Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Config Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={configFormData.name}
                    onChange={(e) =>
                      setConfigFormData({
                        ...configFormData,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                    placeholder="e.g., Standard Packages, Premium Packages"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={configFormData.description}
                    onChange={(e) =>
                      setConfigFormData({
                        ...configFormData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white"
                    placeholder="Optional description for this config"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={configFormData.isActive}
                    onChange={(e) =>
                      setConfigFormData({
                        ...configFormData,
                        isActive: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label className="text-sm font-semibold text-gray-700 cursor-pointer">
                    Active
                  </label>
                </div>

                {/* Assign Packages */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-gray-700">
                      Assign Packages
                    </label>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border border-indigo-200">
                      {configFormData.selectedPackageIds.length} selected
                    </span>
                  </div>

                  {allPackages.length === 0 ? (
                    <div className="p-8 text-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                      <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-600 mb-1">
                        No packages available
                      </p>
                      <p className="text-xs text-gray-500">
                        Create packages first in the Packages tab
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-gray-200 rounded-xl bg-white shadow-inner max-h-80 overflow-y-auto custom-scrollbar">
                      <div className="divide-y divide-gray-100">
                        {allPackages.map((pkg) => {
                          const isSelected =
                            configFormData.selectedPackageIds.includes(pkg.id);
                          return (
                            <motion.label
                              key={pkg.id}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className={`flex items-center justify-between p-4 cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() =>
                                      togglePackageSelection(pkg.id)
                                    }
                                    className="w-5 h-5 rounded border-2 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer transition-all"
                                  />
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute inset-0 flex items-center justify-center"
                                    >
                                      <FiCheck className="w-3 h-3 text-white" />
                                    </motion.div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className={`font-bold ${
                                        isSelected
                                          ? "text-indigo-700"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      {pkg.name}
                                    </span>
                                    {isSelected && (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
                                        Selected
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <FiCalendar className="w-3.5 h-3.5" />
                                      {pkg.duration}{" "}
                                      {pkg.duration === 1 ? "month" : "months"}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <FiDollarSign className="w-3.5 h-3.5" />
                                      <span className="font-semibold text-indigo-600">
                                        {formatCurrencyValue(
                                          pkg.price,
                                          pkg.currency
                                        )}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </motion.label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {allPackages.length > 0 && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-xs text-blue-800 flex items-start gap-2">
                        <FiAlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Tip:</strong> Select the packages that should
                          be available to students assigned to this config. Only
                          selected packages will be visible to those students.
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {errorConfigs && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{errorConfigs}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <FiSave className="w-5 h-5" />
                    {editingConfig ? "Update Config" : "Create Config"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
