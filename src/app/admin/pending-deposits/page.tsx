"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiClock,
  FiDollarSign,
  FiUser,
  FiCalendar,
  FiRefreshCw,
  FiInfo,
  FiAlertCircle,
  FiPhone,
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "use-debounce";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { formatCurrency } from "@/lib/formatCurrency";

interface Deposit {
  id: number;
  studentid: number;
  studentname: string;
  paidamount: number;
  reason: string;
  transactionid: string;
  paymentdate: string;
  status: string;
  currency: string;
  source: string;
  providerReference?: string | null;
  providerStatus?: string | null;
  providerFee?: number | null;
  student?: {
    name: string;
    currency: string;
    country?: string;
    controllerName?: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PendingDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
      });

      const response = await fetch(`/api/admin/pending-deposits?${params}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch pending deposits");
      }

      const data = await response.json();
      setDeposits(data.deposits);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error("Error fetching deposits:", error);
      toast.error(error.message || "Failed to fetch pending deposits");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, pagination.limit]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const handleApprove = async (deposit: Deposit) => {
    if (
      !confirm(
        `Are you sure you want to approve this deposit of ${formatCurrency(
          deposit.paidamount,
          deposit.currency
        )} for ${deposit.studentname}?`
      )
    ) {
      return;
    }

    setProcessingId(deposit.id);
    try {
      const response = await fetch("/api/admin/pending-deposits", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          paymentId: deposit.id,
          status: "Approved",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve deposit");
      }

      toast.success("Deposit approved successfully");
      fetchDeposits();
    } catch (error: any) {
      console.error("Error approving deposit:", error);
      toast.error(error.message || "Failed to approve deposit");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setRejectionReason("");
    setShowDetailsModal(true);
  };

  const confirmReject = async () => {
    if (!selectedDeposit) return;

    setProcessingId(selectedDeposit.id);
    try {
      const response = await fetch("/api/admin/pending-deposits", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          paymentId: selectedDeposit.id,
          status: "rejected",
          reason: rejectionReason || "Rejected by admin",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject deposit");
      }

      toast.success("Deposit rejected successfully");
      setShowDetailsModal(false);
      setSelectedDeposit(null);
      setRejectionReason("");
      fetchDeposits();
    } catch (error: any) {
      console.error("Error rejecting deposit:", error);
      toast.error(error.message || "Failed to reject deposit");
    } finally {
      setProcessingId(null);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-xl"
        >
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
              <FiClock className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Pending Deposits</h1>
              <p className="text-indigo-100 text-lg">
                Review and approve or reject pending payment deposits
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border-0 p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <FiClock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Pending Deposits</p>
                <p className="text-3xl font-bold text-gray-900">
                  {pagination.total}
                </p>
              </div>
            </div>
            <button
              onClick={fetchDeposits}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <FiRefreshCw
                className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border-0 p-6 mb-6"
        >
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name, transaction ID, or reason..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </motion.div>

        {/* Deposits Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden"
        >
          {loading && deposits.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <FiLoader className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : deposits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FiInfo className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No pending deposits found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {deposits.map((deposit) => (
                      <motion.tr
                        key={deposit.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="hover:bg-indigo-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <FiUser className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {deposit.studentname}
                              </p>
                              {deposit.student?.country && (
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <FiMapPin className="h-3 w-3" />
                                  {deposit.student.country}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FiDollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(deposit.paidamount, deposit.currency || "ETB")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {deposit.transactionid}
                            </code>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-gray-600">
                            <FiCalendar className="h-4 w-4" />
                            <span className="text-sm">
                              {format(
                                new Date(deposit.paymentdate),
                                "MMM dd, yyyy"
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              deposit.source === "stripe"
                                ? "bg-blue-100 text-blue-800"
                                : deposit.source === "chapa"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {deposit.source || "manual"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(deposit)}
                              disabled={
                                processingId === deposit.id || processingId !== null
                              }
                              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingId === deposit.id ? (
                                <FiLoader className="h-4 w-4 animate-spin" />
                              ) : (
                                <FiCheckCircle className="h-4 w-4" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(deposit)}
                              disabled={
                                processingId === deposit.id || processingId !== null
                              }
                              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingId === deposit.id ? (
                                <FiLoader className="h-4 w-4 animate-spin" />
                              ) : (
                                <FiXCircle className="h-4 w-4" />
                              )}
                              Reject
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setShowDetailsModal(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                            >
                              <FiInfo className="h-4 w-4" />
                              Details
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * pagination.limit) + 1} to{" "}
                {Math.min(page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} deposits
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                <span className="px-4 py-2 text-sm font-medium text-gray-700">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={page === pagination.totalPages || loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Details/Rejection Modal */}
        <AnimatePresence>
          {showDetailsModal && selectedDeposit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                if (!processingId) {
                  setShowDetailsModal(false);
                  setSelectedDeposit(null);
                  setRejectionReason("");
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Deposit Details</h2>
                    <button
                      onClick={() => {
                        if (!processingId) {
                          setShowDetailsModal(false);
                          setSelectedDeposit(null);
                          setRejectionReason("");
                        }
                      }}
                      disabled={processingId !== null}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <FiXCircle className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Student</p>
                      <p className="font-semibold text-gray-900">
                        {selectedDeposit.studentname}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Amount</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(
                          selectedDeposit.paidamount,
                          selectedDeposit.currency
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Transaction ID
                      </p>
                      <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {selectedDeposit.transactionid}
                      </code>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Date</p>
                      <p className="font-semibold text-gray-900">
                        {format(
                          new Date(selectedDeposit.paymentdate),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Source</p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedDeposit.source === "stripe"
                            ? "bg-blue-100 text-blue-800"
                            : selectedDeposit.source === "chapa"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selectedDeposit.source || "manual"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        {selectedDeposit.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Reason</p>
                    <p className="text-gray-900">{selectedDeposit.reason}</p>
                  </div>

                  {selectedDeposit.providerReference && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Provider Reference
                      </p>
                      <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {selectedDeposit.providerReference}
                      </code>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason (optional)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t">
                    <button
                      onClick={confirmReject}
                      disabled={
                        processingId === selectedDeposit.id ||
                        processingId !== null
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {processingId === selectedDeposit.id ? (
                        <>
                          <FiLoader className="h-5 w-5 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <FiXCircle className="h-5 w-5" />
                          Reject Deposit
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleApprove(selectedDeposit)}
                      disabled={
                        processingId === selectedDeposit.id ||
                        processingId !== null
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {processingId === selectedDeposit.id ? (
                        <>
                          <FiLoader className="h-5 w-5 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <FiCheckCircle className="h-5 w-5" />
                          Approve Deposit
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

