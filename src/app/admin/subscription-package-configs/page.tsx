"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiSearch,
  FiPackage,
  FiSettings,
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiSave,
  FiX,
} from "react-icons/fi";
import { toast } from "@/components/ui/use-toast";
import {
  formatCurrency as formatCurrencyValue,
} from "@/lib/formatCurrency";

interface Package {
  id: number;
  name: string;
  duration: number;
  price: number;
  currency: string;
  isActive: boolean;
}

interface Config {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  packages: Package[];
  studentCount: number;
}

export default function SubscriptionPackageConfigsPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [allPackages, setAllPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Config | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    selectedPackageIds: [] as number[],
  });

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/subscription-package-configs");
      const data = await response.json();
      if (data.success) {
        setConfigs(data.configs || []);
      } else {
        setError(data.error || "Failed to load configs");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load configs");
      toast({
        title: "Error",
        description: "Failed to load configs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPackages = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/subscription-packages");
      const data = await response.json();
      if (data.success && data.packages) {
        setAllPackages(data.packages.filter((p: Package) => p.isActive));
      }
    } catch (err: any) {
      console.error("Failed to load packages:", err);
    }
  }, []);

  useEffect(() => {
    loadConfigs();
    loadPackages();
  }, [loadConfigs, loadPackages]);

  const handleOpenModal = (config?: Config) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        name: config.name,
        description: config.description || "",
        isActive: config.isActive,
        selectedPackageIds: config.packages.map((p) => p.id),
      });
    } else {
      setEditingConfig(null);
      setFormData({
        name: "",
        description: "",
        isActive: true,
        selectedPackageIds: [],
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Config name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = editingConfig
        ? "/api/admin/subscription-package-configs"
        : "/api/admin/subscription-package-configs";
      const method = editingConfig ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingConfig && { id: editingConfig.id }),
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          isActive: formData.isActive,
          packageIds: formData.selectedPackageIds,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Config saved successfully",
        });
        setShowModal(false);
        loadConfigs();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save config",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to save config",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete config "${name}"? This will remove package assignments but won't delete the packages themselves.`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/subscription-package-configs?id=${id}`,
        { method: "DELETE" }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Config deleted successfully",
        });
        loadConfigs();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete config",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to delete config",
        variant: "destructive",
      });
    }
  };

  const togglePackageSelection = (packageId: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedPackageIds: prev.selectedPackageIds.includes(packageId)
        ? prev.selectedPackageIds.filter((id) => id !== packageId)
        : [...prev.selectedPackageIds, packageId],
    }));
  };

  const filteredConfigs = configs.filter((config) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      config.name.toLowerCase().includes(search) ||
      config.description?.toLowerCase().includes(search) ||
      config.packages.some((p) => p.name.toLowerCase().includes(search))
    );
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FiSettings className="w-8 h-8 text-blue-600" />
          Subscription Package Configs
        </h1>
        <p className="text-gray-600">
          Create and manage subscription package configurations. Assign packages to configs, then assign configs to students.
        </p>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search configs by name, description, or package..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              New Config
            </button>
            <button
              onClick={loadConfigs}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Configs Grid */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading configs...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredConfigs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No configs found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConfigs.map((config) => (
            <div
              key={config.id}
              className="bg-white rounded-lg shadow-md p-6 border-2 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {config.name}
                  </h3>
                  {config.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {config.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <FiPackage className="w-4 h-4 text-gray-400" />
                      {config.packages.length} package{config.packages.length !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiUsers className="w-4 h-4 text-gray-400" />
                      {config.studentCount} student{config.studentCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(config)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(config.id, config.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                {config.isActive ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <FiCheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <FiXCircle className="w-3 h-3 mr-1" />
                    Inactive
                  </span>
                )}
              </div>

              {config.packages.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Packages
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {config.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="text-sm text-gray-700 flex items-center justify-between"
                      >
                        <span>{pkg.name}</span>
                        <span className="text-gray-500">
                          {formatCurrencyValue(pkg.price, pkg.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingConfig ? "Edit Config" : "New Config"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Config Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Standard Packages, Premium Packages"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description for this config"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Packages ({formData.selectedPackageIds.length} selected)
                </label>
                <div className="border rounded-md max-h-64 overflow-y-auto">
                  {allPackages.length === 0 ? (
                    <p className="p-4 text-gray-500 text-center">
                      No packages available
                    </p>
                  ) : (
                    <div className="divide-y">
                      {allPackages.map((pkg) => (
                        <label
                          key={pkg.id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={formData.selectedPackageIds.includes(pkg.id)}
                              onChange={() => togglePackageSelection(pkg.id)}
                              className="rounded"
                            />
                            <div>
                              <div className="font-medium text-gray-900">
                                {pkg.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {pkg.duration} month{pkg.duration !== 1 ? "s" : ""} • {formatCurrencyValue(pkg.price, pkg.currency)}
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <FiSave className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
















































