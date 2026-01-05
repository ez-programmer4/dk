import { motion } from "framer-motion";
import {
  FiPhone,
  FiFlag,
  FiUser,
  FiBook,
  FiClock,
  FiCalendar,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiPackage,
  FiEdit,
  FiChevronDown,
  FiChevronUp,
  FiBarChart2,
  FiMessageSquare,
  FiMapPin,
  FiX,
  FiLoader,
} from "react-icons/fi";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import PaymentManagement from "./PaymentManagement";
import { formatCurrency } from "@/lib/formatCurrency";

interface MonthlyPayment {
  id: number;
  studentid: number;
  month: string;
  paid_amount: number;
  payment_status: string;
  payment_type: string;
  start_date: string | null;
  end_date: string | null;
}

interface Student {
  id: number;
  name: string;
  phoneno: string;
  classfee: number;
  classfeeCurrency?: string;
  startdate: string;
  control: string;
  status: string;
  ustaz: string;
  package: string;
  subject: string;
  country: string;
  rigistral: string;
  daypackages: string;
  isTrained: boolean;
  refer: string;
  registrationdate: string;
  selectedTime: string;
  exitdate: string | null;
  progress: string;
  chatId: string | null;
  teacher: {
    ustazname: string;
  };
  paymentStatus?: {
    currentMonthPaid: boolean;
    hasOverdue: boolean;
    lastPayment?: MonthlyPayment;
    paymentHistory?: MonthlyPayment[];
  };
}

interface StudentCardProps {
  student: Student;
  index: number;
  onEdit: (student: Student) => void;
  onDelete: (studentId: number) => void;
  onStatusUpdate?: (studentId: number, newStatus: string) => void;
  onPaymentClick?: (student: Student) => void;
  user: { name: string; username: string; role: string } | null;
  schoolSlug?: string;
}

export default function StudentCard({
  student,
  index,
  onEdit,
  onDelete,
  onStatusUpdate,
  onPaymentClick,
  user,
  schoolSlug,
}: StudentCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const currency = student.classfeeCurrency || "ETB";
  const isNotYet = student.status?.toLowerCase() === "not yet";
  const currentMonthPaid = student.paymentStatus?.currentMonthPaid || false;
  const hasOverdue = student.paymentStatus?.hasOverdue || false;
  const lastPayment = student.paymentStatus?.lastPayment;

  // Add console logging to debug
  const handlePaymentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onPaymentClick) {
      onPaymentClick(student);
    } else {
      router.push(`/paymentmanagement/${student.id}`);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!student.id) {
      toast.error("Student ID is missing. Cannot update status.");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/controller/students/${student.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          classfee: student.classfee,
          package: student.package,
          subject: student.subject,
          daypackages: student.daypackages,
          selectedTime: student.selectedTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      const updatedStudent = await response.json();
      toast.success(`Status updated to ${newStatus} successfully`);

      // Call the callback to refresh the student list
      if (onStatusUpdate) {
        onStatusUpdate(student.id, newStatus);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "leave":
        return "bg-red-100 text-red-800 border-red-300";
      case "fresh":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden"
    >
      {/* Main Content */}
      <div className="p-6">
        <div className="mb-4 overflow-x-auto">
          <div className="flex items-center min-w-[520px] sm:min-w-0 justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-sm">
                {student.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {student.name}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <FiPhone className="text-gray-400" size={14} />
                  <span className="text-sm text-gray-600">
                    {student.phoneno}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  student.status
                )} border`}
              >
                {student.status}
              </span>
              {/* Payment Status Badge */}
              {currentMonthPaid ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300 flex items-center gap-1">
                  <FiCheckCircle size={12} />
                  Paid
                </span>
              ) : hasOverdue ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300 flex items-center gap-1 animate-pulse">
                  <FiXCircle size={12} />
                  Overdue
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300 flex items-center gap-1">
                  <FiDollarSign size={12} />
                  Not Paid
                </span>
              )}
              <div className="flex items-center space-x-2">
                {isNotYet ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (!student.id) {
                          toast.error(
                            "Student ID is missing. Cannot edit this student."
                          );
                          return;
                        }
                        onEdit(student);
                      }}
                      className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-all duration-300 shadow-sm"
                      title="Add/Edit"
                      aria-label="Add or edit student"
                    >
                      <FiEdit size={16} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange("Active")}
                      disabled={isUpdatingStatus}
                      className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all duration-300 shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      title="Change status to Active"
                      aria-label="Change status to Active"
                    >
                      {isUpdatingStatus ? (
                        <FiLoader className="animate-spin" size={14} />
                      ) : (
                        <FiCheckCircle size={14} />
                      )}
                      <span>Active</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange("Not succeed")}
                      disabled={isUpdatingStatus}
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-300 shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      title="Change status to Not succeed"
                      aria-label="Change status to Not succeed"
                    >
                      {isUpdatingStatus ? (
                        <FiLoader className="animate-spin" size={14} />
                      ) : (
                        <FiXCircle size={14} />
                      )}
                      <span>Not succeed</span>
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (!student.id) {
                        toast.error(
                          "Student ID is missing. Cannot edit this student."
                        );
                        return;
                      }
                      onEdit(student);
                    }}
                    className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-all duration-300 shadow-sm"
                    title="Edit"
                    aria-label="Edit student"
                  >
                    <FiEdit size={16} />
                  </motion.button>
                )}
                <button
                  onClick={handlePaymentClick}
                  className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-all duration-300 shadow-sm"
                  title="Payments"
                  aria-label="Manage payments"
                >
                  <FiDollarSign size={16} />
                </button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-all duration-300 shadow-sm"
                  aria-label={
                    isExpanded ? "Collapse details" : "Expand details"
                  }
                >
                  {isExpanded ? (
                    <FiChevronUp size={16} />
                  ) : (
                    <FiChevronDown size={16} />
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Warning Banner */}
        {hasOverdue && (
          <div className="mt-4 mx-6 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg">
            <div className="flex items-center gap-2">
              <FiXCircle className="text-red-600" size={18} />
              <div>
                <p className="text-sm font-semibold text-red-900">
                  Payment Overdue
                </p>
                <p className="text-xs text-red-700">
                  This student has unpaid months. Please check payment history.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Info */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                  Progress
                </th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                  Teacher
                </th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                  Registral
                </th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                  Start Date
                </th>
                {student.status?.toLowerCase() === "leave" && student.exitdate && (
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                    Exit Date
                  </th>
                )}
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                  Payment Status
                </th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                  Telegram
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="py-2 sm:py-3 px-2 sm:px-4 border-b border-gray-200 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <FiBarChart2 className="text-indigo-600" size={16} />
                    </div>
                    <span className="font-medium text-gray-900">
                      {student.progress || "Not set"}
                    </span>
                  </div>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 border-b border-gray-200 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <FiUser className="text-purple-600" size={16} />
                    </div>
                    <span className="font-medium text-gray-900">
                      {student.teacher?.ustazname || student.ustaz}
                    </span>
                  </div>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 border-b border-gray-200 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <FiFlag className="text-indigo-600" size={16} />
                    </div>
                    <span className="font-medium text-gray-900">
                      {student.rigistral || "Not set"}
                    </span>
                  </div>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 border-b border-gray-200 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-pink-50 rounded-lg">
                      <FiCalendar className="text-pink-600" size={16} />
                    </div>
                    <span className="font-medium text-gray-900">
                      {(() => {
                        try {
                          const date = new Date(student.startdate);
                          return isNaN(date.getTime())
                            ? "Invalid date"
                            : format(date, "MMM d, yyyy");
                        } catch {
                          return "Invalid date";
                        }
                      })()}
                    </span>
                  </div>
                </td>
                {student.status?.toLowerCase() === "leave" && student.exitdate && (
                  <td className="py-2 sm:py-3 px-2 sm:px-4 border-b border-gray-200 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-red-50 rounded-lg">
                        <FiCalendar className="text-red-600" size={16} />
                      </div>
                      <span className="font-medium text-red-900">
                        {(() => {
                          try {
                            const date = new Date(student.exitdate);
                            return isNaN(date.getTime())
                              ? "Invalid date"
                              : format(date, "MMM d, yyyy");
                          } catch {
                            return "Invalid date";
                          }
                        })()}
                      </span>
                    </div>
                  </td>
                )}
                <td className="py-2 sm:py-3 px-2 sm:px-4 border-b border-gray-200 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {currentMonthPaid ? (
                      <>
                        <div className="p-2 bg-green-50 rounded-lg">
                          <FiCheckCircle className="text-green-600" size={16} />
                        </div>
                        <div>
                          <span className="font-medium text-green-600 block">
                            Paid
                          </span>
                          {lastPayment && (
                            <span className="text-xs text-gray-500">
                              {format(
                                new Date(lastPayment.month + "-01"),
                                "MMM yyyy"
                              )}
                            </span>
                          )}
                        </div>
                      </>
                    ) : hasOverdue ? (
                      <>
                        <div className="p-2 bg-red-50 rounded-lg">
                          <FiXCircle className="text-red-600" size={16} />
                        </div>
                        <div>
                          <span className="font-medium text-red-600 block">
                            Overdue
                          </span>
                          <span className="text-xs text-red-500">
                            Action needed
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-2 bg-yellow-50 rounded-lg">
                          <FiDollarSign className="text-yellow-600" size={16} />
                        </div>
                        <div>
                          <span className="font-medium text-yellow-600 block">
                            Not Paid
                          </span>
                          <span className="text-xs text-gray-500">
                            This month
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-4 border-b border-gray-200 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {student.chatId ? (
                      <>
                        <div className="p-2 bg-green-50 rounded-lg">
                          <FiMessageSquare
                            className="text-green-600"
                            size={16}
                          />
                        </div>
                        <span className="font-medium text-green-600">
                          Connected
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <FiMessageSquare
                            className="text-gray-400"
                            size={16}
                          />
                        </div>
                        <span className="font-medium text-gray-500">
                          Not Connected
                        </span>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-50 border-t border-gray-200"
        >
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FiPackage className="text-blue-600" size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Package</p>
                  <p className="text-sm font-medium text-gray-900">
                    {student.package}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <FiBook className="text-green-600" size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Subject</p>
                  <p className="text-sm font-medium text-gray-900">
                    {student.subject}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <FiClock className="text-yellow-600" size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Time Slot</p>
                  <p className="text-sm font-medium text-gray-900">
                    {(() => {
                      const time =
                        student.selectedTime ||
                        (student as any).timeSlot ||
                        (student as any).time ||
                        (student as any).classTime;
                      if (
                        !time ||
                        time.toString().trim() === "" ||
                        time === "null" ||
                        time === "undefined"
                      )
                        return "Not set";
                      const timeStr = time.toString().trim();

                      // Already in 12-hour format
                      if (timeStr.includes("AM") || timeStr.includes("PM"))
                        return timeStr;

                      // Handle 24-hour format (e.g., "6:00:00" or "14:30")
                      if (timeStr.includes(":")) {
                        const parts = timeStr.split(":");
                        const hour = parseInt(parts[0]);
                        const minute = parseInt(parts[1]) || 0;

                        if (!isNaN(hour) && hour >= 0 && hour <= 23) {
                          const period = hour >= 12 ? "PM" : "AM";
                          const adjustedHour = hour % 12 || 12;
                          return `${adjustedHour}:${minute
                            .toString()
                            .padStart(2, "0")} ${period}`;
                        }
                      }

                      return timeStr;
                    })()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FiDollarSign className="text-blue-600" size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Class Fee</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(student.classfee, currency)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <FiMapPin className="text-yellow-600" size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Country</p>
                  <p className="text-sm font-medium text-gray-900">
                    {student.country}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <FiBarChart2 className="text-purple-600" size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Training Status</p>
                  <p className="text-sm font-medium text-gray-900">
                    {student.isTrained ? "Trained" : "Not Trained"}
                  </p>
                </div>
              </div>
              {/* Payment History Summary */}
              {student.paymentStatus?.paymentHistory &&
                student.paymentStatus.paymentHistory.length > 0 && (
                  <div className="flex items-center space-x-2 col-span-full">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FiDollarSign className="text-blue-600" size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Payment History</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-gray-900">
                          {
                            student.paymentStatus.paymentHistory.filter(
                              (p) => p.payment_status === "Paid"
                            ).length
                          }{" "}
                          paid months
                        </span>
                        {lastPayment && (
                          <span className="text-xs text-gray-500">
                            • Last:{" "}
                            {format(
                              new Date(lastPayment.month + "-01"),
                              "MMM yyyy"
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-500">
            Registration:{" "}
            {(() => {
              try {
                const date = new Date(student.registrationdate);
                return isNaN(date.getTime())
                  ? "Invalid date"
                  : format(date, "MMM d, yyyy");
              } catch {
                return "Invalid date";
              }
            })()}
          </span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-500">
            Day Package: {student.daypackages}
          </span>
        </div>
        <div className="text-xs text-gray-500">ID: {student.id}</div>
      </div>
    </motion.div>
  );
}
