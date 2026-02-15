"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  FiPlus,
  FiSettings,
  FiUsers,
  FiPackage,
  FiBook,
  FiCalendar,
  FiRefreshCw,
  FiEdit3,
  FiSave,
  FiX,
  FiSearch,
  FiInfo,
  FiTrash2,
  FiLoader,
} from "react-icons/fi";
import { toast } from "@/components/ui/use-toast";

export default function StudentConfigPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const [statuses, setStatuses] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [daypackages, setDaypackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editType, setEditType] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "status" | "package" | "subject" | "daypackage"
  >("status");

  const tabs = [
    {
      id: "status" as const,
      label: "Statuses",
      icon: FiUsers,
      items: statuses,
      color: "emerald",
      title: "Student Statuses",
    },
    {
      id: "package" as const,
      label: "Packages",
      icon: FiPackage,
      items: packages,
      color: "purple",
      title: "Student Packages",
    },
    {
      id: "daypackage" as const,
      label: "Day Packages",
      icon: FiCalendar,
      items: daypackages,
      color: "orange",
      title: "Day Packages",
    },
    {
      id: "subject" as const,
      label: "Subjects",
      icon: FiBook,
      items: subjects,
      color: "indigo",
      title: "Student Subjects",
    },
  ];

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${schoolSlug}/student-config`);
      if (res.ok) {
        const data = await res.json();
        setStatuses(data.statuses || []);
        setPackages(data.packages || []);
        setSubjects(data.subjects || []);
        setDaypackages(data.daypackages || []);
      }
    } catch (error) {
      console.error("Failed to fetch configurations");
      toast({
        title: "Error",
        description: "Failed to fetch configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const initializeDefaults = async () => {
    if (!confirm("This will reset all configurations to default. Continue?"))
      return;

    setInitializing(true);
    try {
      const res = await fetch(`/api/admin/${schoolSlug}/student-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "init" }),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Defaults initialized successfully",
        });
        fetchConfigurations();
      } else {
        throw new Error("Failed to initialize defaults");
      }
    } catch (error) {
      console.error("Failed to initialize defaults");
      toast({
        title: "Error",
        description: "Failed to initialize defaults",
        variant: "destructive",
      });
    } finally {
      setInitializing(false);
    }
  };

  const addItem = async (type: string, name: string) => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/${schoolSlug}/student-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name: name.trim(), action: "add" }),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: `${
            type?.charAt(0)?.toUpperCase() + type?.slice(1) || "Item"
          } added successfully`,
        });
        setInputValue("");
        fetchConfigurations();
      } else {
        const errorData = await res.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to add item",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (type: string, id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`
      )
    )
      return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/${schoolSlug}/student-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, action: "delete" }),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: `${
            type.charAt(0).toUpperCase() + type.slice(1)
          } deleted successfully`,
        });
        fetchConfigurations();
      } else {
        const errorData = await res.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete item",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (id: string, name: string, type: string) => {
    setEditingId(id);
    setEditValue(name);
    setEditType(type);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
    setEditType("");
  };

  const saveEdit = async () => {
    if (!editValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${schoolSlug}/student-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editType,
          id: editingId,
          name: editValue.trim(),
          action: "update",
        }),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: `${
            editType?.charAt(0)?.toUpperCase() + editType?.slice(1) || "Item"
          } updated successfully`,
        });
        cancelEdit();
        fetchConfigurations();
      } else {
        const errorData = await res.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to update item",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    setSearchTerm("");
    setInputValue("");
    setEditingId(null);
    setEditValue("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isSubmitting) {
      await addItem(activeTab, inputValue);
    }
  };

  const currentTab = tabs.find((tab) => tab.id === activeTab)!;
  const filteredItems = currentTab.items.filter((item) =>
    searchTerm
      ? item.name.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const colorClasses: Record<string, any> = {
    emerald: {
      bg: "bg-gradient-to-r from-emerald-500 to-teal-600",
      hover: "hover:from-emerald-600 hover:to-teal-700",
      light: "bg-gradient-to-br from-emerald-50 to-teal-50",
      border: "border-emerald-300",
      text: "text-emerald-700",
      icon: "text-emerald-600",
      active:
        "bg-gradient-to-r from-emerald-100 to-teal-100 border-emerald-400 text-emerald-800",
      shadow: "shadow-emerald-200",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    },
    purple: {
      bg: "bg-gradient-to-r from-purple-500 to-violet-600",
      hover: "hover:from-purple-600 hover:to-violet-700",
      light: "bg-gradient-to-br from-purple-50 to-violet-50",
      border: "border-purple-300",
      text: "text-purple-700",
      icon: "text-purple-600",
      active:
        "bg-gradient-to-r from-purple-100 to-violet-100 border-purple-400 text-purple-800",
      shadow: "shadow-purple-200",
      glow: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
    },
    orange: {
      bg: "bg-gradient-to-r from-orange-500 to-amber-600",
      hover: "hover:from-orange-600 hover:to-amber-700",
      light: "bg-gradient-to-br from-orange-50 to-amber-50",
      border: "border-orange-300",
      text: "text-orange-700",
      icon: "text-orange-600",
      active:
        "bg-gradient-to-r from-orange-100 to-amber-100 border-orange-400 text-orange-800",
      shadow: "shadow-orange-200",
      glow: "shadow-[0_0_20px_rgba(249,115,22,0.3)]",
    },
    indigo: {
      bg: "bg-gradient-to-r from-indigo-500 to-blue-600",
      hover: "hover:from-indigo-600 hover:to-blue-700",
      light: "bg-gradient-to-br from-indigo-50 to-blue-50",
      border: "border-indigo-300",
      text: "text-indigo-700",
      icon: "text-indigo-600",
      active:
        "bg-gradient-to-r from-indigo-100 to-blue-100 border-indigo-400 text-indigo-800",
      shadow: "shadow-indigo-200",
      glow: "shadow-[0_0_20px_rgba(99,102,241,0.3)]",
    },
  };

  const colors = colorClasses[currentTab.color];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white mb-6 shadow-2xl relative overflow-hidden animate-slide-in">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-lg transform hover:scale-110 hover:rotate-3 transition-all duration-300">
                <FiSettings className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1 drop-shadow-lg">
                  Student Configuration
                </h1>
                <p className="text-indigo-100 text-sm sm:text-base font-medium">
                  Manage student configurations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={initializeDefaults}
                disabled={initializing}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-lg transition-all duration-300 disabled:opacity-50 font-medium text-sm shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                <FiRefreshCw
                  className={`h-4 w-4 ${initializing ? "animate-spin" : ""}`}
                />
                Reset Defaults
              </button>
              <button
                onClick={fetchConfigurations}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-indigo-600 rounded-lg transition-all duration-300 disabled:opacity-50 font-medium text-sm shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                <FiRefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 overflow-hidden animate-fade-in">
          <div className="flex overflow-x-auto custom-scrollbar">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const tabColors = colorClasses[tab.color];
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  style={{ animationDelay: `${index * 100}ms` }}
                  className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-4 font-semibold transition-all duration-300 flex-shrink-0 border-b-3 relative group animate-slide-in ${
                    isActive
                      ? `${tabColors.active} border-b-3 ${tabColors.border}`
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b-3 border-transparent"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-transform duration-300 ${
                      isActive
                        ? `${tabColors.icon} scale-110`
                        : "text-gray-500 group-hover:scale-110"
                    }`}
                  />
                  <span className="text-sm sm:text-base font-medium">
                    {tab.label}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
                      isActive
                        ? `${tabColors.bg
                            .replace("from-", "from-")
                            .replace("to-", "to-")} text-white shadow-lg`
                        : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                    }`}
                  >
                    {tab.items.length}
                  </span>
                  {isActive && (
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-0.5 ${tabColors.bg
                        .replace("border-", "bg-gradient-to-r")
                        .replace("200", "500")
                        .replace("300", "600")} rounded-t-full`}
                    ></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {initialLoading ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <FiLoader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8 animate-fade-in">
            {/* Add Item Form */}
            <div
              className={`mb-6 p-5 sm:p-6 rounded-xl border-2 ${colors.border} ${colors.light} shadow-md transition-all duration-300 hover:shadow-lg`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`p-2 ${colors.bg
                    .replace("from-", "from-")
                    .replace("to-", "to-")} rounded-lg shadow-md`}
                >
                  <FiPlus className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800">
                  Add New {currentTab.label.slice(0, -1)}
                </h3>
              </div>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`Enter ${
                      activeTab === "daypackage" ? "day package" : activeTab
                    } name...`}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base bg-white shadow-sm hover:border-gray-400"
                    disabled={loading || isSubmitting}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !inputValue.trim() || isSubmitting}
                  className={`${colors.bg} ${colors.hover} text-white px-8 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:transform-none`}
                  style={{
                    boxShadow: inputValue.trim()
                      ? "0 0 20px rgba(59, 130, 246, 0.3), 0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                      : undefined,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="h-5 w-5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <FiPlus className="h-5 w-5" />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Search */}
            {currentTab.items.length > 0 && (
              <div className="mb-6">
                <div className="relative group">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors duration-300" />
                  <input
                    type="text"
                    placeholder={`Search ${currentTab.label.toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base bg-gray-50 hover:bg-white shadow-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
                      aria-label="Clear search"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  )}
                  {searchTerm && (
                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                      {filteredItems.length} result
                      {filteredItems.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-3">
              {filteredItems.length > 0 ? (
                filteredItems.map((item: any, index: number) => (
                  <div
                    key={item.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 animate-slide-in group"
                  >
                    {editingId === item.id ? (
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-4 py-2.5 border-2 border-blue-400 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveEdit();
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              cancelEdit();
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={saveEdit}
                          disabled={loading}
                          className="bg-green-500 hover:bg-green-600 text-white p-2.5 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 transform hover:scale-110 active:scale-95"
                          aria-label="Save"
                        >
                          <FiSave className="h-5 w-5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={loading}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 p-2.5 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 transform hover:scale-110 active:scale-95"
                          aria-label="Cancel"
                        >
                          <FiX className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`w-2 h-2 ${colors.bg
                              .replace("from-", "from-")
                              .replace("to-", "to-")} rounded-full shadow-md`}
                          ></div>
                          <span className="font-semibold text-gray-900 text-base">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() =>
                              startEdit(item.id, item.name, activeTab)
                            }
                            disabled={loading || deletingId === item.id}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 transform hover:scale-110 active:scale-95"
                            aria-label="Edit"
                          >
                            <FiEdit3 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              deleteItem(activeTab, item.id, item.name)
                            }
                            disabled={loading || deletingId === item.id}
                            className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 transform hover:scale-110 active:scale-95"
                            aria-label="Delete"
                          >
                            {deletingId === item.id ? (
                              <FiLoader className="h-5 w-5 animate-spin" />
                            ) : (
                              <FiTrash2 className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : searchTerm ? (
                <div className="text-center py-16 text-gray-500 animate-fade-in">
                  <div className="text-6xl mb-4 animate-bounce">🔍</div>
                  <div className="font-bold text-gray-700 mb-2 text-lg">
                    No matches found
                  </div>
                  <div className="text-sm text-gray-500">
                    Try adjusting your search terms
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500 animate-fade-in">
                  <div className="text-7xl mb-5 animate-bounce">📝</div>
                  <div className="font-bold text-gray-700 mb-3 text-xl">
                    No {currentTab.label.toLowerCase()} configured yet
                  </div>
                  <div className="text-base text-gray-500 mb-4">
                    Add your first item above to get started
                  </div>
                  <div
                    className={`inline-block px-4 py-2 ${colors.light} ${colors.border} border-2 rounded-lg text-sm font-medium ${colors.text}`}
                  >
                    💡 Tip: Use the form above to add items
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5 sm:p-6 shadow-lg animate-fade-in">
          <h4 className="font-bold text-blue-900 mb-5 flex items-center gap-3 text-lg">
            <div className="p-2.5 bg-blue-100 rounded-xl shadow-md">
              <FiInfo className="h-5 w-5 text-blue-600" />
            </div>
            Important Notes
          </h4>
          <ul className="text-gray-700 text-sm sm:text-base space-y-3">
            <li className="flex items-start gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors duration-200">
              <span className="text-blue-600 font-bold mt-0.5 text-lg">✓</span>
              <span className="font-medium">
                Changes will be reflected in student registration forms
                immediately
              </span>
            </li>
            <li className="flex items-start gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors duration-200">
              <span className="text-blue-600 font-bold mt-0.5 text-lg">✓</span>
              <span className="font-medium">
                Existing students will keep their current values
              </span>
            </li>
            <li className="flex items-start gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors duration-200">
              <span className="text-blue-600 font-bold mt-0.5 text-lg">✓</span>
              <span className="font-medium">
                Deleting items may affect existing student records
              </span>
            </li>
            <li className="flex items-start gap-3 p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors duration-200">
              <span className="text-blue-600 font-bold mt-0.5 text-lg">✓</span>
              <span className="font-medium">
                These configurations are used across the entire system
              </span>
            </li>
          </ul>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            filter: blur(5px);
          }
          to {
            opacity: 1;
            filter: blur(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 0.8);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 8px;
          box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
