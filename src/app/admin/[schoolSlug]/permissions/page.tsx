"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useBranding } from "../layout";
import {
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiBell,
  FiSend,
  FiUser,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiDownload,
  FiUsers,
  FiClock,
  FiEye,
} from "react-icons/fi";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import JSConfetti from "js-confetti";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminPermissionsPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const branding = useBranding();

  // Use branding colors with fallbacks
  const primaryColor = branding?.primaryColor || "#4F46E5";
  const secondaryColor = branding?.secondaryColor || "#7C3AED";
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [form, setForm] = useState({
    status: "Approved",
    reviewNotes: "",
    lateReviewReason: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const confettiRef = useRef<JSConfetti | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: string;
    message: string;
  } | null>(null);

  // Permission Reasons Section
  const [permissionReasons, setPermissionReasons] = useState<
    { id: number; reason: string }[]
  >([]);
  const [newReason, setNewReason] = useState("");
  const [savingReasons, setSavingReasons] = useState(false);
  const [reasonsError, setReasonsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchReasons() {
      try {
        const res = await fetch(`/api/admin/${schoolSlug}/permission-reasons`);
        if (!res.ok) throw new Error("Failed to fetch permission reasons");
        const data = await res.json();
        if (isMounted) {
          setPermissionReasons(Array.isArray(data) ? data : []);
        }
      } catch (e: any) {
        if (isMounted) {
          setReasonsError(e.message || "Failed to load reasons");
        }
      }
    }
    fetchReasons();
    return () => {
      isMounted = false;
    };
  }, []);

  async function addReason() {
    if (
      !newReason.trim() ||
      permissionReasons.some((r) => r.reason === newReason.trim())
    )
      return;
    setSavingReasons(true);
    setReasonsError(null);
    try {
      const res = await fetch(`/api/admin/${schoolSlug}/permission-reasons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: newReason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add reason");
      }
      const created = await res.json();
      setPermissionReasons((prev) => [...prev, created]);
      setNewReason("");
      toast({ title: "Reason Added", description: created.reason });
    } catch (e: any) {
      setReasonsError(e.message || "Failed to add reason");
      toast({
        title: "Error",
        description: e.message || "Failed to add reason",
        variant: "destructive",
      });
    } finally {
      setSavingReasons(false);
    }
  }

  async function removeReason(reasonId: number) {
    setSavingReasons(true);
    setReasonsError(null);
    try {
      const res = await fetch(`/api/admin/${schoolSlug}/permission-reasons?id=${reasonId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete reason");
      }
      setPermissionReasons((prev) => prev.filter((r) => r.id !== reasonId));
      toast({ title: "Reason Removed" });
    } catch (e: any) {
      setReasonsError(e.message || "Failed to remove reason");
      toast({
        title: "Error",
        description: e.message || "Failed to remove reason",
        variant: "destructive",
      });
    } finally {
      setSavingReasons(false);
    }
  }

  useEffect(() => {
    confettiRef.current = new JSConfetti();
    return () => {
      confettiRef.current = null;
    };
  }, []);

  useEffect(() => {
    fetchRequests();
    setCurrentPage(1); // Reset to first page when filter changes
  }, [statusFilter]);

  async function fetchRequests() {
    setLoading(true);
    setError(null);
    try {
      // Build query params - request all results (no limit) for frontend pagination
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append("status", statusFilter);
      }
      // Don't set limit - API will return all results
      const queryString = params.toString();
      const url = `/api/admin/permissions${
        queryString ? `?${queryString}` : ""
      }`;
      const res = await fetch(url.replace('/api/admin/', `/api/admin/${schoolSlug}/`));
      if (!res.ok) throw new Error("Failed to fetch permission requests");
      const data = await res.json();

      setRequests(data);
    } catch (e: any) {
      setError(e.message);
      setToastMessage({
        type: "error",
        message: e.message || "Failed to fetch requests",
      });
    } finally {
      setLoading(false);
    }
  }

  function openModal(req: any) {
    setSelected(req);
    setForm({ status: "Approved", reviewNotes: "", lateReviewReason: "" });
    setFormError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelected(null);
    setFormError(null);
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/${schoolSlug}/permissions/${selected.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || "Failed to review request");
        return;
      }
      closeModal();
      fetchRequests();
      setToastMessage({
        type: "success",
        message: `Permission request ${form.status.toLowerCase()} successfully!`,
      });
      confettiRef.current?.addConfetti({
        emojis: ["🎉", "🎊", "🎈", "✨", "🎀"],
        emojiSize: 48,
        confettiNumber: 50,
      });
    } catch (e: any) {
      setFormError(e.message || "Failed to review request");
      setToastMessage({
        type: "error",
        message: e.message || "Failed to review request",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredRequests = requests.filter((req) => {
    return (
      (!statusFilter || req.status === statusFilter) &&
      (!search ||
        (req.teacher?.ustazname || req.teacherId)
          .toLowerCase()
          .includes(search.toLowerCase()))
    );
  });
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate statistics
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "Pending").length,
    approved: requests.filter((r) => r.status === "Approved").length,
    declined: requests.filter((r) => r.status === "Declined").length,
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}08 0%, ${secondaryColor}05 50%, #ffffff 100%)`,
      }}
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header + Stats */}
        <div
          className="rounded-2xl shadow-lg border border-gray-100/50 p-8 lg:p-10 backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, #ffffff 0%, ${primaryColor}02 100%)`,
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-8 mb-8">
            <div className="flex items-center gap-6">
              <div
                className="p-4 rounded-2xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                <FiBell className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1
                  className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent mb-2"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  Permission Review
                </h1>
                <p className="text-gray-600 text-lg lg:text-xl font-medium">
                  Manage teacher absence requests and notifications
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:ml-auto w-full">
              <div
                className="rounded-2xl p-4 text-center border border-gray-200 hover:shadow-md transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}05 0%, ${secondaryColor}03 100%)`,
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div
                    className="p-1 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}25)`,
                    }}
                  >
                    <FiBell className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">
                    Total
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </div>
              </div>
              <div
                className="rounded-2xl p-4 text-center border border-gray-200 hover:shadow-md transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}05 0%, ${secondaryColor}03 100%)`,
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div
                    className="p-1 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}25)`,
                    }}
                  >
                    <FiClock className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">
                    Pending
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.pending}
                </div>
              </div>
              <div
                className="rounded-2xl p-4 text-center border border-gray-200 hover:shadow-md transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}05 0%, ${secondaryColor}03 100%)`,
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div
                    className="p-1 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}25)`,
                    }}
                  >
                    <FiCheck className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">
                    Approved
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.approved}
                </div>
              </div>
              <div
                className="rounded-2xl p-4 text-center border border-gray-200 hover:shadow-md transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}05 0%, ${secondaryColor}03 100%)`,
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div
                    className="p-1 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}25)`,
                    }}
                  >
                    <FiX className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">
                    Declined
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.declined}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div
            className="rounded-2xl p-6 border border-gray-100/50"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}05 0%, ${secondaryColor}03 100%)`,
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              <div className="lg:col-span-4">
                <label className="block text-sm font-bold text-black mb-3">
                  <FiSearch className="inline h-4 w-4 mr-2" />
                  Search Teachers
                </label>
                <input
                  type="text"
                  placeholder="Search teacher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900 shadow-sm transition-all duration-200 text-base"
                  style={{
                    boxShadow: `0 0 0 2px ${primaryColor}40`,
                  }}
                />
              </div>
              <div className="lg:col-span-4">
                <label className="block text-sm font-bold text-black mb-3">
                  <FiBell className="inline h-4 w-4 mr-2" />
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900 shadow-sm transition-all duration-200 text-base"
                  style={{
                    boxShadow: `0 0 0 2px ${primaryColor}40`,
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Declined">Declined</option>
                </select>
              </div>
              <div className="lg:col-span-4">
                <button
                  onClick={() => {
                    const headers = [
                      "Teacher",
                      "Date",
                      "Category",
                      "Details",
                      "Time Slots",
                      "Submitted",
                      "Status",
                    ];
                    const rows = filteredRequests.map((req) => [
                      req.teacher?.ustazname || req.teacherId,
                      dayjs(req.requestedDate).format("MMM D, YYYY"),
                      req.reasonCategory,
                      req.reasonDetails,
                      req.timeSlots
                        ? (() => {
                            try {
                              const slots = JSON.parse(req.timeSlots);
                              return slots.includes("Whole Day")
                                ? "Whole Day"
                                : `${slots.length} Time Slots`;
                            } catch {
                              return "N/A";
                            }
                          })()
                        : "N/A",
                      dayjs(req.createdAt).fromNow(),
                      req.status,
                    ]);
                    const csv = [
                      headers.join(","),
                      ...rows.map((r) => r.join(",")),
                    ].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `permission_requests_${dayjs().format(
                      "YYYY-MM-DD"
                    )}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    toast({
                      title: "CSV Exported",
                      description: "Permission requests exported successfully!",
                    });
                  }}
                  className="w-full text-white px-4 py-3 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  <FiDownload className="h-4 w-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div
          className="rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, #ffffff 0%, ${primaryColor}02 100%)`,
          }}
        >
          <div className="p-6 sm:p-8 lg:p-10 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                <FiUsers className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Permission Requests
                </h2>
                <p className="text-gray-600">
                  Review and manage teacher absence requests
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            {loading ? (
              <div className="text-center py-16">
                <div className="relative mb-8">
                  <div
                    className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 mx-auto"
                    style={{
                      borderTopColor: primaryColor,
                    }}
                  ></div>
                  <div
                    className="absolute inset-0 rounded-full border-4 border-transparent animate-spin mx-auto"
                    style={{
                      borderTopColor: secondaryColor,
                      animationDirection: 'reverse',
                      animationDuration: '1.5s',
                    }}
                  ></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Loading Permission Requests</h2>
                <p className="text-gray-600 text-lg">
                  Please wait while we fetch the data
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="flex space-x-2">
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: primaryColor }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: secondaryColor,
                        animationDelay: '0.1s',
                      }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: primaryColor,
                        animationDelay: '0.2s',
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="relative mb-8">
                  <div className="p-8 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl w-fit mx-auto shadow-lg">
                    <FiX className="h-16 w-16 text-red-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 p-2 bg-red-500 rounded-full">
                    <FiAlertTriangle className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Error Loading Requests
                </h3>
                <p className="text-red-600 text-xl font-medium">{error}</p>
                <p className="text-gray-500 text-sm mt-2">
                  Please try refreshing the page or contact support if the issue persists.
                </p>
              </div>
            ) : paginatedRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative mb-8">
                  <div className="p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl w-fit mx-auto shadow-lg">
                    <FiBell className="h-16 w-16 text-gray-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 p-2 bg-gray-400 rounded-full">
                    <FiSearch className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  No Requests Found
                </h3>
                <p className="text-gray-600 text-xl font-medium">
                  No permission requests match your current filters.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Try adjusting your search criteria or status filter.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Teacher
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Dates
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-bold text-black uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {paginatedRequests.map((req, index) => (
                        <tr
                          key={req.id}
                          className={`hover:bg-gray-50 transition-all duration-200 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                                {req.teacher?.ustazname || req.teacherId
                                  ? (req.teacher?.ustazname || req.teacherId)
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")
                                  : "N/A"}
                              </div>
                              <span className="font-semibold text-black">
                                {req.teacher?.ustazname ||
                                  req.teacherId ||
                                  "Unknown Teacher"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            <div>
                              <div className="font-medium">
                                {dayjs(req.requestedDate).format("MMM D, YYYY")}
                              </div>
                              {req.timeSlots && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {(() => {
                                    try {
                                      const slots = JSON.parse(req.timeSlots);
                                      return slots.includes("Whole Day")
                                        ? "🚫 Whole Day Absence"
                                        : `⏰ ${slots.length} Time Slot${
                                            slots.length > 1 ? "s" : ""
                                          }`;
                                    } catch {
                                      return "Time slots unavailable";
                                    }
                                  })()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {req.reasonCategory}
                          </td>
                          <td className="px-6 py-4 text-gray-700 max-w-xs truncate">
                            {req.reasonDetails}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {dayjs(req.createdAt).fromNow()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                req.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : req.status === "Approved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {req.status === "Pending" && (
                                <FiClock className="h-3 w-3 mr-1" />
                              )}
                              {req.status === "Approved" && (
                                <FiCheck className="h-3 w-3 mr-1" />
                              )}
                              {req.status === "Declined" && (
                                <FiX className="h-3 w-3 mr-1" />
                              )}
                              {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openModal(req)}
                              className="p-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all hover:scale-105"
                              title="Review Request"
                            >
                              <FiEye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <p className="text-lg font-semibold text-gray-700">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-3 border border-gray-300 rounded-xl bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all hover:scale-105"
                    >
                      <FiChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-3 border border-gray-300 rounded-xl bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all hover:scale-105"
                    >
                      <FiChevronRight className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Permission Reasons Management */}
        <div
          className="rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, #ffffff 0%, ${primaryColor}02 100%)`,
          }}
        >
          <div className="p-6 sm:p-8 lg:p-10 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                <FiBell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Permission Reasons
                </h2>
                <p className="text-gray-600">
                  Manage pre-approved reasons for teacher time-off requests
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            {reasonsError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 mb-6">
                {reasonsError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              {permissionReasons.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="text-black font-medium">{r.reason}</p>
                  </div>
                  <button
                    onClick={() => removeReason(r.id)}
                    disabled={savingReasons}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-xl transition-all hover:scale-105"
                    title={`Remove ${r.reason}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Add a new reason..."
                onKeyDown={(e) => e.key === "Enter" && addReason()}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white text-gray-900 shadow-sm transition-all duration-200"
              />
              <button
                onClick={addReason}
                disabled={savingReasons || !newReason.trim()}
                className="text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 shadow-lg hover:shadow-xl"
                style={{
                  background: savingReasons || !newReason.trim()
                    ? '#9CA3AF'
                    : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                {savingReasons ? (
                  <FiLoader className="h-4 w-4 animate-spin" />
                ) : (
                  "Add"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Review Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 relative border border-gray-200 max-h-[90vh] overflow-y-auto">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 rounded-full p-2 bg-gray-100 hover:bg-gray-200 transition-all hover:scale-110 z-10"
              >
                <FiX size={20} />
              </button>

              {/* Modal Header */}
              <div
                className="rounded-t-3xl p-6 text-white"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <FiBell className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Permission Request Review
                    </h2>
                    <p className="text-gray-300 mt-1">
                      Evaluate and respond to teacher absence request
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div className="p-6 sm:p-8">
                <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                    <FiUser className="h-5 w-5" />
                    Request Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Teacher
                      </p>
                      <p className="text-black font-semibold">
                        {selected?.teacher?.ustazname || selected?.teacherId}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Absence Date
                      </p>
                      <p className="text-black font-semibold">
                        {dayjs(selected?.requestedDate).format(
                          "dddd, MMMM D, YYYY"
                        )}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Reason Category
                      </p>
                      <p className="text-black font-semibold">
                        {selected?.reasonCategory || "Not specified"}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Submitted
                      </p>
                      <p className="text-black font-semibold">
                        {selected?.createdAt
                          ? dayjs(selected.createdAt).format(
                              "MMM D, YYYY [at] h:mm A"
                            )
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {/* Time Slots Information */}
                  {selected?.timeSlots && (
                    <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                        ⏰ Requested Time Slots
                      </p>
                      {(() => {
                        try {
                          const slots = JSON.parse(selected.timeSlots);
                          if (slots.includes("Whole Day")) {
                            return (
                              <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                                <p className="text-red-800 font-semibold flex items-center gap-2">
                                  🚫 Whole Day Absence Request
                                </p>
                                <p className="text-red-600 text-sm mt-1">
                                  Teacher requested permission for the entire
                                  day
                                </p>
                              </div>
                            );
                          } else {
                            return (
                              <div className="space-y-2">
                                <p className="text-blue-600 text-sm">
                                  Specific time slots ({slots.length} selected):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {slots.map((slot: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                                    >
                                      {slot}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        } catch {
                          return (
                            <p className="text-gray-500 text-sm">
                              Time slot information unavailable
                            </p>
                          );
                        }
                      })()}
                    </div>
                  )}

                  {selected?.reasonDetails && (
                    <div className="mt-4 bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Additional Details
                      </p>
                      <p className="text-black leading-relaxed">
                        {selected.reasonDetails}
                      </p>
                    </div>
                  )}
                </div>

                {/* Review Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Decision Buttons */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-black mb-4">
                      Review Decision
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                          form.status === "Approved"
                            ? "text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700"
                        }`}
                        style={
                          form.status === "Approved"
                            ? {
                                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                              }
                            : {}
                        }
                        onClick={() =>
                          setForm((f) => ({ ...f, status: "Approved" }))
                        }
                        disabled={submitting}
                      >
                        <FiCheck className="h-5 w-5" />
                        <span>Approve Request</span>
                      </button>
                      <button
                        type="button"
                        className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                          form.status === "Declined"
                            ? "text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700"
                        }`}
                        style={
                          form.status === "Declined"
                            ? {
                                background: `linear-gradient(135deg, #DC2626, #B91C1C)`,
                              }
                            : {}
                        }
                        onClick={() =>
                          setForm((f) => ({ ...f, status: "Declined" }))
                        }
                        disabled={submitting}
                      >
                        <FiX className="h-5 w-5" />
                        <span>Decline Request</span>
                      </button>
                    </div>
                  </div>

                  {form.status === "Declined" && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                      <FiAlertTriangle className="text-red-600" />
                      <span className="text-red-800 font-semibold">
                        Unpermitted Absence Deduction will apply.
                      </span>
                    </div>
                  )}

                  {/* Review Notes */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-black mb-4">
                      Review Notes & Comments
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Review Notes
                        </label>
                        <textarea
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                          style={{
                            boxShadow: `0 0 0 2px ${primaryColor}40`,
                          }}
                          value={form.reviewNotes}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              reviewNotes: e.target.value,
                            }))
                          }
                          rows={4}
                          placeholder="Add your review comments, feedback, or instructions for the teacher..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Review Classification
                        </label>
                        <select
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                          style={{
                            boxShadow: `0 0 0 2px ${primaryColor}40`,
                          }}
                          value={form.lateReviewReason}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              lateReviewReason: e.target.value,
                            }))
                          }
                        >
                          <option value="">-- Select Classification --</option>
                          <option value="Accepted Reason">
                            Valid Reason (No Salary Deduction)
                          </option>
                          <option value="Not Relevant Reason">
                            Invalid Reason (Salary Deduction Applies)
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {formError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
                      <FiAlertTriangle className="h-4 w-4" />
                      {formError}
                    </div>
                  )}

                  {/* Notification Buttons */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-3 text-white rounded-xl transition-all font-semibold hover:scale-105 shadow-lg hover:shadow-xl"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        }}
                        onClick={async () => {
                          if (!selected) return;
                          try {
                            const res = await fetch(
                              `/api/admin/${schoolSlug}/permissions/${selected.id}/notify-teacher`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  status: form.status,
                                  reviewNotes: form.reviewNotes,
                                  teacherName:
                                    selected.teacher?.ustazname ||
                                    selected.teacherId,
                                  requestDate: selected.requestedDate,
                                  timeSlots: selected.timeSlots,
                                }),
                              }
                            );
                            const data = await res.json();
                            const title = data.success
                              ? "✅ Notification Sent"
                              : "❌ Notification Failed";
                            let description = "";

                            if (data.success) {
                              description = `📱 SMS sent to ${
                                data.teacherInfo?.name || "teacher"
                              } (${
                                data.teacherInfo?.phone || "phone"
                              }) for ${data.requestInfo?.status?.toLowerCase()} request on ${
                                data.requestInfo?.date
                              }`;
                            } else {
                              if (data.smsDetails?.status === "no_phone") {
                                description =
                                  "🙅 Teacher has no phone number on file. Please update their contact information.";
                              } else if (data.smsDetails?.error) {
                                description = `😔 SMS failed: ${data.smsDetails.error}`;
                              } else {
                                description =
                                  data.error || "Failed to notify teacher";
                              }
                            }

                            toast({
                              title,
                              description,
                              variant: data.success ? "default" : "destructive",
                            });
                            if (data.success) {
                              confettiRef.current?.addConfetti({
                                emojis: ["📧", "✅", "🎉"],
                                emojiSize: 30,
                                confettiNumber: 20,
                              });
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to notify teacher",
                              variant: "destructive",
                            });
                          }
                        }}
                        title="Send SMS and system notification to teacher"
                      >
                        <FiSend className="h-4 w-4" /> Notify Teacher
                      </button>
                      <button
                        type="button"
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all font-semibold hover:scale-105 ${
                          form.status === "Approved"
                            ? "text-white shadow-lg hover:shadow-xl"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                        style={
                          form.status === "Approved"
                            ? {
                                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                              }
                            : {}
                        }
                        onClick={async () => {
                          if (!selected || form.status !== "Approved") return;
                          try {
                            const res = await fetch(
                              `/api/admin/${schoolSlug}/permissions/${selected.id}/notify-students`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  teacherName:
                                    selected.teacher?.ustazname ||
                                    selected.teacherId,
                                  absenceDate: selected.requestedDate,
                                  reason: selected.reasonCategory,
                                  timeSlots: selected.timeSlots,
                                }),
                              }
                            );
                            const data = await res.json();
                            toast({
                              title: data.success ? "Success" : "Error",
                              description: data.success
                                ? `Students notified successfully! (${
                                    data.sentCount || 0
                                  } notifications sent via ${
                                    data.methods?.join(", ") || "SMS"
                                  })`
                                : data.error || "Failed to notify students",
                              variant: data.success ? "default" : "destructive",
                            });
                            if (data.success) {
                              confettiRef.current?.addConfetti({
                                emojis: ["📱", "👥", "✅", "🎉"],
                                emojiSize: 30,
                                confettiNumber: 30,
                              });
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to notify students",
                              variant: "destructive",
                            });
                          }
                        }}
                        title={
                          form.status === "Approved"
                            ? "Send SMS notifications to all students"
                            : "Only available for approved requests"
                        }
                        disabled={form.status !== "Approved"}
                      >
                        <FiSend className="h-4 w-4" /> Notify Students
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`px-6 py-3 rounded-xl font-semibold text-white transition-all ${
                          submitting
                            ? "bg-gray-400 cursor-not-allowed"
                            : "hover:scale-105 shadow-lg hover:shadow-xl"
                        }`}
                        style={{
                          background: submitting
                            ? '#9CA3AF'
                            : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        }}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <FiLoader className="animate-spin inline-block mr-2" />
                            Processing...
                          </>
                        ) : (
                          "Submit Review"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-xl text-white font-semibold ${
              toastMessage.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {toastMessage.message}
          </div>
        )}
      </div>
    </div>
  );
}
