"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiCalendar,
  FiUsers,
  FiCheck,
  FiSearch,
  FiSettings,
  FiAlertTriangle,
  FiRefreshCw,
  FiClock,
  FiDollarSign,
  FiExternalLink,
  FiArrowRight,
  FiFileText,
  FiX,
} from "react-icons/fi";
import { toast } from "@/components/ui/use-toast";

export default function DeductionAdjustmentsPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [adjustmentType, setAdjustmentType] = useState("waive_absence");
  const [reason, setReason] = useState("");
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]); // For absence adjustments
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewSummary, setPreviewSummary] = useState<any>({});
  const [showPreview, setShowPreview] = useState(false);
  const [waiverHistory, setWaiverHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(true); // Always show by default
  const [lastApiResponse, setLastApiResponse] = useState<any>(null);
  const [lastAppliedAdjustment, setLastAppliedAdjustment] = useState<any>(null);
  const [showSuccessReview, setShowSuccessReview] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchTimeSlots();
  }, []);

  // Clear selected students when adjustment type changes
  useEffect(() => {
    if (adjustmentType !== "waive_absence") {
      setSelectedStudents([]);
    }
  }, [adjustmentType]);

  useEffect(() => {
    if (!Array.isArray(teachers)) {
      setFilteredTeachers([]);
      return;
    }
    const filtered = teachers.filter((teacher) =>
      teacher.name.toLowerCase().includes(teacherSearch.toLowerCase())
    );
    setFilteredTeachers(filtered);
  }, [teachers, teacherSearch]);

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/admin/teachers");
      if (res.ok) {
        const data = await res.json();
        const teachersArray = Array.isArray(data) ? data : [];
        setTeachers(teachersArray);
        setFilteredTeachers(teachersArray);

        if (teachersArray.length === 0) {
          toast({
            title: "No Teachers Found",
            description: "No teachers available in the system",
            variant: "destructive",
          });
        }
      } else {
        const errorData = await res.json();
        toast({
          title: "Failed to Load Teachers",
          description: errorData.error || "Could not fetch teachers list",
          variant: "destructive",
        });
        setTeachers([]);
        setFilteredTeachers([]);
      }
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
      setTeachers([]);
      setFilteredTeachers([]);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const res = await fetch("/api/admin/time-slots");
      if (res.ok) {
        const data = await res.json();
        const slotsArray = Array.isArray(data) ? data : [];
        setTimeSlots(slotsArray);
      } else {
        setTimeSlots([]);
      }
    } catch (error) {
      console.error("Failed to fetch time slots");
      setTimeSlots([]);
    }
  };

  const fetchWaiverHistory = async () => {
    try {
      const res = await fetch(
        "/api/admin/deduction-adjustments/history?limit=50"
      );
      if (res.ok) {
        const data = await res.json();
        const waivers = Array.isArray(data.waivers) ? data.waivers : [];
        setWaiverHistory(waivers);
        setShowHistory(true);
      } else {
        setWaiverHistory([]);
        setShowHistory(true);
      }
    } catch (error) {
      console.error("Failed to fetch waiver history");
      setWaiverHistory([]);
    }
  };

  const previewAdjustments = async (studentIds?: string[]) => {
    // Enhanced validation
    if (!dateRange.startDate || !dateRange.endDate) {
      toast({
        title: "Missing Date Range",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (selectedTeachers.length === 0) {
      toast({
        title: "No Teachers Selected",
        description: "Please select at least one teacher",
        variant: "destructive",
      });
      return;
    }

    // Validate date range
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast({
        title: "Invalid Date Format",
        description: "Please select valid dates",
        variant: "destructive",
      });
      return;
    }

    // Normalize to start of day for comparison
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start > end) {
      toast({
        title: "Invalid Date Range",
        description: "Start date must be before or equal to end date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/deduction-adjustments/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adjustmentType,
          dateRange,
          teacherIds: selectedTeachers,
          timeSlots: selectedTimeSlots,
          studentIds:
            studentIds ||
            (adjustmentType === "waive_absence" && selectedStudents.length > 0
              ? selectedStudents
              : undefined),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const records = data.records || [];

        // If studentIds were provided, filter records by selected students
        if (studentIds && studentIds.length > 0) {
          const filteredRecords = records.filter((record: any) => {
            const studentIdentifier = record.studentId
              ? `id:${record.studentId}`
              : `name:${record.studentName}`;
            return studentIds.includes(studentIdentifier);
          });

          // Recalculate summary for filtered records
          const filteredSummary = {
            totalRecords: filteredRecords.length,
            totalAmount: filteredRecords.reduce(
              (sum: number, r: any) => sum + (r.deduction || 0),
              0
            ),
            totalTeachers: new Set(filteredRecords.map((r: any) => r.teacherId))
              .size,
            totalLatenessAmount: filteredRecords
              .filter((r: any) => r.type === "Lateness")
              .reduce((sum: number, r: any) => sum + (r.deduction || 0), 0),
            totalAbsenceAmount: filteredRecords
              .filter((r: any) => r.type === "Absence")
              .reduce((sum: number, r: any) => sum + (r.deduction || 0), 0),
          };

          setPreviewData(filteredRecords);
          setPreviewSummary(filteredSummary);
        } else {
          setPreviewData(records);
          setPreviewSummary(data.summary || {});
        }

        setShowPreview(true);

        if (records.length === 0) {
          toast({
            title: "No Records Found",
            description:
              studentIds && studentIds.length > 0
                ? "No deduction records match the selected students. Try selecting different students or clear selection to see all records."
                : "No deduction records match your criteria. All deductions may already be waived or no deductions exist for the selected period.",
          });
        } else {
          toast({
            title:
              studentIds && studentIds.length > 0
                ? "Preview Updated"
                : "Preview Ready",
            description: `Found ${records.length} record${
              records.length !== 1 ? "s" : ""
            } totaling ${
              (studentIds && studentIds.length > 0
                ? records.reduce(
                    (sum: number, r: any) => sum + (r.deduction || 0),
                    0
                  )
                : data.summary?.totalAmount) || 0
            } ETB${
              studentIds && studentIds.length > 0
                ? ` (filtered by ${studentIds.length} selected student${
                    studentIds.length !== 1 ? "s" : ""
                  })`
                : ""
            }`,
          });
        }
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch preview");
      }
    } catch (error: any) {
      console.error("Preview error:", error);
      toast({
        title: "Preview Failed",
        description:
          error.message ||
          "Failed to preview adjustments. Please check your connection and try again.",
        variant: "destructive",
      });
      setPreviewData([]);
      setPreviewSummary({});
      setShowPreview(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustment = async () => {
    // Enhanced validation
    if (!reason.trim()) {
      toast({
        title: "Missing Reason",
        description: "Please provide a reason for the adjustment",
        variant: "destructive",
      });
      return;
    }

    if (previewData.length === 0) {
      toast({
        title: "No Records to Process",
        description:
          "Please preview adjustments first to see what will be waived",
        variant: "destructive",
      });
      return;
    }

    if (!dateRange.startDate || !dateRange.endDate) {
      toast({
        title: "Missing Date Range",
        description: "Please select a date range",
        variant: "destructive",
      });
      return;
    }

    if (selectedTeachers.length === 0) {
      toast({
        title: "No Teachers Selected",
        description: "Please select at least one teacher",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(
      `🚨 CRITICAL ACTION\n\nYou are about to waive ${
        previewData.length
      } deduction records totaling ${
        previewSummary.totalAmount || 0
      } ETB.\n\nReason: ${reason}\n\nThis will:\n✅ Increase teacher salaries immediately\n✅ Update all payment calculations\n✅ Create permanent audit records\n\n⚠️ This action CANNOT be undone!\n\nProceed?`
    );
    if (!confirmed) return;

    setLoading(true);

    // Clear previous logs and show loading state
    setDebugLogs([
      "⏳ Starting adjustment request...",
      `Request time: ${new Date().toISOString()}`,
    ]);
    setShowDebug(true);

    try {
      console.log("=== STARTING ADJUSTMENT REQUEST ===");
      console.log("Request payload:", {
        adjustmentType,
        dateRange,
        teacherIds: selectedTeachers,
        timeSlots: selectedTimeSlots,
        reason: reason.substring(0, 50) + "...",
      });

      const res = await fetch("/api/admin/deduction-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adjustmentType,
          dateRange,
          teacherIds: selectedTeachers,
          timeSlots: selectedTimeSlots,
          studentIds:
            adjustmentType === "waive_absence" && selectedStudents.length > 0
              ? selectedStudents
              : undefined,
          reason,
        }),
      });

      console.log("=== API RESPONSE RECEIVED ===");
      console.log("Status:", res.status, res.statusText);
      console.log("OK:", res.ok);
      console.log("Headers:", Object.fromEntries(res.headers.entries()));

      let data: any;
      try {
        const text = await res.text();
        console.log("Response text length:", text.length);
        console.log("Response text preview:", text.substring(0, 500));
        data = JSON.parse(text);
        console.log("Parsed data keys:", Object.keys(data));
        console.log("Has debugLogs:", !!data.debugLogs);
        console.log("debugLogs type:", typeof data.debugLogs);
        console.log("debugLogs is array:", Array.isArray(data.debugLogs));
        console.log("debugLogs length:", data.debugLogs?.length);
      } catch (parseError: any) {
        console.error("JSON Parse Error:", parseError);
        setDebugLogs([
          "❌ ERROR: Failed to parse API response",
          `Status: ${res.status} ${res.statusText}`,
          `Error: ${parseError.message}`,
          `Response might not be JSON`,
        ]);
        setShowDebug(true);
        toast({
          title: "❌ Parse Error",
          description: "Server response was not valid JSON",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Store the full API response for debugging
      setLastApiResponse(data);

      if (res.ok) {
        console.log("=== SUCCESS RESPONSE ===");

        // Store debug logs - ENHANCED
        if (
          data.debugLogs &&
          Array.isArray(data.debugLogs) &&
          data.debugLogs.length > 0
        ) {
          console.log(`✓ Setting ${data.debugLogs.length} debug logs`);
          setDebugLogs([
            "✅ API Response received successfully",
            `Status: ${res.status}`,
            `Debug logs count: ${data.debugLogs.length}`,
            "---",
            ...data.debugLogs,
          ]);
        } else {
          console.log("⚠ No debug logs in response, creating debug entry");
          // If no logs, create a log entry showing what we got
          setDebugLogs([
            "=== API RESPONSE DEBUG ===",
            `Status: ${res.status} ${res.statusText}`,
            `Has debugLogs: ${!!data.debugLogs}`,
            `Is Array: ${Array.isArray(data.debugLogs)}`,
            `Length: ${data.debugLogs?.length || 0}`,
            `Full response keys: ${Object.keys(data).join(", ")}`,
            `Records affected: ${data.recordsAffected || "N/A"}`,
            `Total amount waived: ${
              data.financialImpact?.totalAmountWaived || "N/A"
            }`,
            "---",
            `Full Response: ${JSON.stringify(data, null, 2)}`,
          ]);
        }
        setShowDebug(true); // Always show after adjustment

        // Store the applied adjustment details for review
        const appliedAdjustment = {
          recordsAffected: data.recordsAffected || 0,
          totalAmountWaived:
            data.totalAmountWaived ||
            data.financialImpact?.totalAmountWaived ||
            0,
          adjustmentType,
          dateRange,
          selectedTeachers: selectedTeachers.map(
            (id) => teachers.find((t) => t.id === id)?.name || id
          ),
          selectedStudents: selectedStudents.length,
          selectedTimeSlots: selectedTimeSlots.length,
          reason,
          appliedAt: new Date().toISOString(),
          previewSummary,
        };

        setLastAppliedAdjustment(appliedAdjustment);
        setShowSuccessReview(true);

        // Refresh waiver history
        fetchWaiverHistory();

        // Show enhanced success message
        toast({
          title: "✅ Adjustment Applied Successfully!",
          description: `Successfully waived ${
            data.recordsAffected || 0
          } deduction record${(data.recordsAffected || 0) !== 1 ? "s" : ""}. ${(
            data.totalAmountWaived ||
            data.financialImpact?.totalAmountWaived ||
            0
          ).toLocaleString()} ETB has been returned to teacher salaries. Review the details below.`,
          duration: 5000,
        });

        // Reset form (but keep success review visible)
        setTimeout(() => {
          setSelectedTeachers([]);
          setReason("");
          setDateRange({ startDate: "", endDate: "" });
          setSelectedTimeSlots([]);
          setSelectedStudents([]);
          setPreviewData([]);
          setPreviewSummary({});
          setShowPreview(false);
        }, 5000);
      } else {
        console.error("=== ERROR RESPONSE ===");
        console.error("Error data:", data);
        const errorMessage =
          data?.error || `HTTP ${res.status}: ${res.statusText}`;

        setDebugLogs([
          "❌ API Error Response",
          `Status: ${res.status} ${res.statusText}`,
          `Error: ${errorMessage}`,
          "---",
          `Full response: ${JSON.stringify(data, null, 2)}`,
        ]);
        setShowDebug(true);

        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("=== EXCEPTION CAUGHT ===");
      console.error("Error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      const errorLogs = [
        "❌ EXCEPTION: Request failed",
        `Error type: ${error.name || "Unknown"}`,
        `Error message: ${error.message || "No message"}`,
        `Error stack: ${error.stack || "No stack trace"}`,
      ];

      setDebugLogs((prev) => [...prev, "---", ...errorLogs]);
      setShowDebug(true);

      toast({
        title: "❌ Adjustment Failed",
        description:
          error.message ||
          "Failed to adjust deductions. Check debug logs for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log("=== REQUEST COMPLETE ===");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Top Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
                <FiSettings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Deduction Adjustments
                </h1>
                <p className="text-sm text-gray-600">
                  Manage salary deduction waivers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/teacher-payments"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg text-sm font-medium"
              >
                <FiDollarSign className="h-4 w-4" />
                Payments
                <FiExternalLink className="h-3 w-3" />
              </Link>
              <button
                onClick={fetchWaiverHistory}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 text-sm font-medium"
              >
                <FiSearch className="h-4 w-4" />
                History
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Step Indicator */}
          {(() => {
            // Determine current step based on completion status
            let currentStep = 1;

            // Step 1: Configure (date range + type)
            if (dateRange.startDate && dateRange.endDate && adjustmentType) {
              currentStep = 2;

              // Step 2: Select Teachers
              if (selectedTeachers.length > 0) {
                if (adjustmentType === "waive_absence") {
                  // Step 3: Select Students (optional for absence)
                  currentStep = 3;
                  // If previewed, move to step 4 (Preview)
                  if (showPreview && previewData.length > 0) {
                    currentStep = 4;
                  }
                } else if (adjustmentType === "waive_lateness") {
                  // Step 3: Select Time Slots (optional for lateness)
                  currentStep = 3;
                  // If previewed, move to step 4 (Preview)
                  if (showPreview && previewData.length > 0) {
                    currentStep = 4;
                  }
                }
              }
            }

            const steps = [
              {
                number: 1,
                title: "Configure",
                description: "Date & Type",
                icon: FiSettings,
                completed:
                  dateRange.startDate && dateRange.endDate && adjustmentType,
              },
              {
                number: 2,
                title: "Select Teachers",
                description: "Choose teachers",
                icon: FiUsers,
                completed: selectedTeachers.length > 0,
              },
              ...(adjustmentType === "waive_absence"
                ? [
                    {
                      number: 3,
                      title: "Select Students",
                      description: "Choose students",
                      icon: FiUsers,
                      completed: true, // Optional step, always considered "done" (can skip)
                      optional: true,
                      helpText:
                        "Select specific students or leave empty for all",
                    },
                  ]
                : adjustmentType === "waive_lateness"
                ? [
                    {
                      number: 3,
                      title: "Select Time Slots",
                      description: "Choose time slots",
                      icon: FiClock,
                      completed: true, // Optional step, always considered "done" (can skip)
                      optional: true,
                      helpText:
                        "Select specific time slots or leave empty for all",
                    },
                  ]
                : []),
              {
                number:
                  adjustmentType === "waive_absence" ||
                  adjustmentType === "waive_lateness"
                    ? 4
                    : 3,
                title: "Preview",
                description: "Review changes",
                icon: FiSearch,
                completed: showPreview && previewData.length > 0,
              },
              {
                number:
                  adjustmentType === "waive_absence" ||
                  adjustmentType === "waive_lateness"
                    ? 5
                    : 4,
                title: "Apply",
                description: "Confirm & apply",
                icon: FiCheck,
                completed: false,
              },
            ];

            return (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    Adjustment Process
                  </h2>
                  <div className="text-sm font-medium text-gray-600">
                    Step {currentStep} of {steps.length}
                  </div>
                </div>
                <div className="flex items-center justify-between relative">
                  {/* Progress Line */}
                  <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 -z-0">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                      style={{
                        width: `${
                          ((currentStep - 1) / (steps.length - 1)) * 100
                        }%`,
                      }}
                    ></div>
                  </div>

                  {steps.map((step, index) => {
                    const isActive = step.number === currentStep;
                    const isCompleted =
                      step.completed && step.number < currentStep;
                    const StepIcon = step.icon;

                    return (
                      <div
                        key={step.number}
                        className="flex items-center flex-1"
                      >
                        <div className="flex flex-col items-center flex-1">
                          {/* Step Circle */}
                          <div
                            className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                              isCompleted
                                ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white scale-110"
                                : isActive
                                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white scale-110 ring-4 ring-blue-200"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {isCompleted ? (
                              <FiCheck className="h-6 w-6" />
                            ) : (
                              <>
                                <StepIcon className="h-5 w-5" />
                                {step.optional && (
                                  <span className="absolute -top-1 -right-1 text-xs bg-orange-400 text-orange-900 rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-white shadow-sm">
                                    ?
                                  </span>
                                )}
                              </>
                            )}
                            {/* Step Number Badge */}
                            <div
                              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCompleted || isActive
                                  ? "bg-white text-green-600"
                                  : "bg-gray-400 text-white"
                              }`}
                            >
                              {step.number}
                            </div>
                          </div>

                          {/* Step Info */}
                          <div className="mt-3 text-center max-w-[120px]">
                            <div
                              className={`text-xs font-bold mb-0.5 ${
                                isActive
                                  ? "text-blue-600"
                                  : isCompleted
                                  ? "text-green-600"
                                  : "text-gray-500"
                              }`}
                            >
                              {step.title}
                              {step.optional && (
                                <span className="ml-1 text-[9px] text-orange-600">
                                  (Optional)
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-[10px] ${
                                isActive || isCompleted
                                  ? "text-gray-700"
                                  : "text-gray-400"
                              }`}
                            >
                              {step.description}
                            </div>
                            {step.helpText && isActive && (
                              <div className="mt-1 text-[9px] text-blue-600 font-medium">
                                {step.helpText}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Connector Arrow */}
                        {index < steps.length - 1 && (
                          <div className="flex-1 mx-2 hidden md:block">
                            <FiArrowRight
                              className={`h-5 w-5 mx-auto ${
                                isCompleted
                                  ? "text-green-500"
                                  : isActive
                                  ? "text-blue-500"
                                  : "text-gray-300"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Current Step Description */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      {(() => {
                        const CurrentStepIcon =
                          steps[currentStep - 1]?.icon || FiSettings;
                        return (
                          <CurrentStepIcon className="h-5 w-5 text-white" />
                        );
                      })()}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 mb-1">
                        {steps[currentStep - 1]?.title || "Get Started"}
                        {steps[currentStep - 1]?.optional && (
                          <span className="ml-2 text-xs font-normal text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                            Optional
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 space-y-1">
                        {currentStep === 1 && (
                          <>
                            <p>
                              Select the date range and choose the type of
                              deduction to adjust (Absence or Lateness).
                            </p>
                          </>
                        )}
                        {currentStep === 2 && (
                          <>
                            <p>
                              Select one or more teachers whose deductions you
                              want to adjust.
                            </p>
                          </>
                        )}
                        {currentStep === 3 &&
                          adjustmentType === "waive_absence" && (
                            <>
                              <p className="font-semibold text-blue-700">
                                📋 Select Specific Students (Optional)
                              </p>
                              <p>
                                Choose specific students to adjust, or leave
                                empty to adjust <strong>all students</strong>{" "}
                                found in the preview.
                              </p>
                              <p className="text-xs text-gray-600 mt-2">
                                💡 Tip: After previewing, you can select
                                students and click "Update Preview" to see the
                                updated results.
                              </p>
                            </>
                          )}
                        {currentStep === 3 &&
                          adjustmentType === "waive_lateness" && (
                            <>
                              <p className="font-semibold text-orange-700">
                                ⏰ Select Specific Time Slots (Optional)
                              </p>
                              <p>
                                Choose specific time slots to adjust, or leave
                                empty to adjust <strong>all time slots</strong>{" "}
                                found in the preview.
                              </p>
                              <p className="text-xs text-gray-600 mt-2">
                                💡 Tip: This helps you target specific lateness
                                incidents by time of day.
                              </p>
                            </>
                          )}
                        {currentStep === 4 &&
                          adjustmentType === "waive_absence" && (
                            <>
                              <p className="font-semibold text-green-700">
                                👀 Review Preview Results
                              </p>
                              <p>
                                Review the preview below showing which
                                deductions will be waived. You can still adjust
                                student selection and click "Update Preview" to
                                refresh.
                              </p>
                            </>
                          )}
                        {currentStep === 4 &&
                          adjustmentType === "waive_lateness" && (
                            <>
                              <p className="font-semibold text-green-700">
                                👀 Review Preview Results
                              </p>
                              <p>
                                Review the preview below showing which lateness
                                deductions will be waived. You can still adjust
                                time slot selection and preview again if needed.
                              </p>
                            </>
                          )}
                        {currentStep === 5 && (
                          <>
                            <p className="font-semibold text-purple-700">
                              ✅ Ready to Apply
                            </p>
                            <p>
                              Review all details carefully, then click "Apply
                              Adjustments" to confirm and process the waiver.
                            </p>
                            <p className="text-xs text-gray-600 mt-2">
                              ⚠️ This action cannot be undone!
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick Stats Dashboard */}
          {waiverHistory.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border-2 border-blue-400/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold mb-1">
                      {waiverHistory.length}
                    </div>
                    <div className="text-blue-100 text-xs font-medium uppercase tracking-wide">
                      Total Adjustments
                    </div>
                  </div>
                  <FiSettings className="h-8 w-8 opacity-80 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border-2 border-green-400/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold mb-1">
                      {waiverHistory
                        .reduce((sum, w) => sum + (w.originalAmount || 0), 0)
                        .toLocaleString()}
                    </div>
                    <div className="text-green-100 text-xs font-medium uppercase tracking-wide">
                      Amount Waived (ETB)
                    </div>
                  </div>
                  <FiDollarSign className="h-8 w-8 opacity-80 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border-2 border-purple-400/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold mb-1">
                      {new Set(waiverHistory.map((w) => w.teacherId)).size}
                    </div>
                    <div className="text-purple-100 text-xs font-medium uppercase tracking-wide">
                      Teachers Affected
                    </div>
                  </div>
                  <FiUsers className="h-8 w-8 opacity-80 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border-2 border-orange-400/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold mb-1">
                      {
                        waiverHistory.filter(
                          (w) =>
                            new Date(w.createdAt).toDateString() ===
                            new Date().toDateString()
                        ).length
                      }
                    </div>
                    <div className="text-orange-100 text-xs font-medium uppercase tracking-wide">
                      Today's Adjustments
                    </div>
                  </div>
                  <FiCalendar className="h-8 w-8 opacity-80 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area - Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Configuration Form */}
            <div className="xl:col-span-2 space-y-6">
              {/* Warning Banner */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-xl p-5 shadow-md">
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-yellow-900 mb-1">
                      Critical System Function
                    </h3>
                    <p className="text-sm text-yellow-800">
                      All changes are permanent and immediately reflected in
                      payment systems.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  Configuration
                </h2>

                {/* Date Range */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FiCalendar className="h-4 w-4 text-blue-600" />
                    Date Range <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium bg-white"
                      required
                    />
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Adjustment Type */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FiSettings className="h-4 w-4 text-purple-600" />
                    Adjustment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm font-medium bg-white"
                  >
                    <option value="waive_absence">
                      Waive Absence Deductions
                    </option>
                    <option value="waive_lateness">
                      Waive Lateness Deductions
                    </option>
                  </select>
                  <p className="text-xs text-gray-600">
                    {adjustmentType === "waive_absence"
                      ? "Removes deductions from recorded absence events"
                      : "Removes deductions from late class starts"}
                  </p>
                </div>

                {/* Student Selection - Only for Absence - BEFORE PREVIEW */}
                {adjustmentType === "waive_absence" && (
                  <div className="space-y-3 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-5 border-2 border-teal-200">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
                        <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg shadow-md">
                          <FiUsers className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            Select Specific Students
                            <span className="text-xs font-normal bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full border border-teal-300">
                              Optional
                            </span>
                          </div>
                          <div className="text-xs font-medium text-gray-600 mt-0.5">
                            {selectedStudents.length === 0 ? (
                              <span className="text-gray-500">
                                ⚠️ All students will be adjusted if left empty
                              </span>
                            ) : (
                              <span className="text-teal-700 font-semibold">
                                ✓ {selectedStudents.length} student
                                {selectedStudents.length !== 1 ? "s" : ""}{" "}
                                selected
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                      <div className="flex gap-2">
                        {previewData.length > 0 ? (
                          <button
                            type="button"
                            onClick={async () => {
                              const allStudents = new Set<string>();
                              previewData.forEach((record: any) => {
                                if (record.studentId) {
                                  allStudents.add(`id:${record.studentId}`);
                                } else if (record.studentName) {
                                  allStudents.add(`name:${record.studentName}`);
                                }
                              });
                              setSelectedStudents(Array.from(allStudents));
                            }}
                            className="px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-semibold hover:bg-teal-600 transition-all shadow-sm"
                          >
                            Select All
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setSelectedStudents([])}
                          className="px-3 py-1.5 bg-gray-400 text-white rounded-lg text-xs font-semibold hover:bg-gray-500 transition-all shadow-sm"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border-2 border-teal-200 p-4 max-h-64 overflow-y-auto">
                      {previewData.length > 0 ? (
                        <div className="space-y-2">
                          <div className="mb-2 pb-2 border-b border-teal-200">
                            <p className="text-xs font-semibold text-teal-700 flex items-center gap-1">
                              <FiCheck className="h-3 w-3" />
                              {(() => {
                                const uniqueStudents = new Set<string>();
                                previewData.forEach((record: any) => {
                                  if (record.studentId) {
                                    uniqueStudents.add(
                                      `id:${record.studentId}`
                                    );
                                  } else if (record.studentName) {
                                    uniqueStudents.add(
                                      `name:${record.studentName}`
                                    );
                                  }
                                });
                                return uniqueStudents.size;
                              })()}{" "}
                              students found in preview
                            </p>
                          </div>
                          {(() => {
                            const studentMap = new Map<
                              string,
                              { id?: number; name: string; count: number }
                            >();
                            previewData.forEach((record: any) => {
                              const key = record.studentId
                                ? `id:${record.studentId}`
                                : `name:${record.studentName}`;
                              if (!studentMap.has(key)) {
                                studentMap.set(key, {
                                  id: record.studentId,
                                  name: record.studentName || "Unknown",
                                  count: 0,
                                });
                              }
                              studentMap.get(key)!.count++;
                            });

                            return Array.from(studentMap.entries()).map(
                              ([identifier, student]) => {
                                const isSelected =
                                  selectedStudents.includes(identifier);
                                return (
                                  <label
                                    key={identifier}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                                      isSelected
                                        ? "bg-gradient-to-r from-teal-100 to-cyan-100 border-teal-400 shadow-md"
                                        : "bg-white border-gray-200 hover:border-teal-300 hover:bg-teal-50"
                                    }`}
                                  >
                                    <div className="relative">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedStudents((prev) => [
                                              ...prev,
                                              identifier,
                                            ]);
                                          } else {
                                            setSelectedStudents((prev) =>
                                              prev.filter(
                                                (id) => id !== identifier
                                              )
                                            );
                                          }
                                        }}
                                        className="w-5 h-5 rounded border-2 border-gray-300 text-teal-600 focus:ring-teal-500"
                                      />
                                      {isSelected && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <FiCheck className="h-3 w-3 text-white" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                                        {student.name}
                                        {isSelected && (
                                          <span className="px-2 py-0.5 bg-teal-500 text-white text-xs rounded-full font-bold">
                                            SELECTED
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {student.count} deduction
                                        {student.count !== 1 ? "s" : ""} found
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <div className="p-1.5 bg-teal-500 rounded-full">
                                        <FiCheck className="h-4 w-4 text-white" />
                                      </div>
                                    )}
                                  </label>
                                );
                              }
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-2">👆</div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">
                            Preview adjustments first
                          </p>
                          <p className="text-xs text-gray-500">
                            Click "Preview Adjustments" to see available
                            students
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-800 font-medium flex items-start gap-2">
                        <span className="text-base">💡</span>
                        <span>
                          <strong>Tip:</strong> Select specific students to
                          adjust only their deductions. Leave empty to adjust{" "}
                          <strong>all students</strong> found in the preview.
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Time Slots - Only for Lateness */}
                {adjustmentType === "waive_lateness" && (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FiClock className="h-4 w-4 text-orange-600" />
                      Time Slots (Optional)
                    </label>
                    <div className="border-2 border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50">
                      <div className="mb-2">
                        <label className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTimeSlots.length === 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTimeSlots([]);
                              }
                            }}
                            className="w-4 h-4 rounded border-2 border-gray-300 text-blue-600"
                          />
                          <span className="text-sm font-medium text-blue-600">
                            All Time Slots
                          </span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.isArray(timeSlots) &&
                          timeSlots.map((slot) => (
                            <label
                              key={slot}
                              className="flex items-center gap-2 p-2 hover:bg-orange-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedTimeSlots.includes(slot)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTimeSlots((prev) => [
                                      ...prev,
                                      slot,
                                    ]);
                                  } else {
                                    setSelectedTimeSlots((prev) =>
                                      prev.filter((s) => s !== slot)
                                    );
                                  }
                                }}
                                className="w-4 h-4 rounded border-2 border-gray-300 text-orange-600"
                              />
                              <span className="text-xs font-medium">
                                {slot}
                              </span>
                            </label>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FiAlertTriangle className="h-4 w-4 text-green-600" />
                    Reason for Adjustment{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Server downtime on [date] prevented normal operations..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm font-medium bg-white resize-none"
                    rows={4}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    This reason will be permanently recorded in audit logs.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Teacher Selection */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                  Select Teachers
                  <span className="text-sm font-normal text-gray-500">
                    ({selectedTeachers.length} selected)
                  </span>
                </h2>

                {/* Search */}
                <div className="relative mb-4">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search teachers..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-white"
                  />
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => {
                      if (Array.isArray(filteredTeachers)) {
                        setSelectedTeachers(filteredTeachers.map((t) => t.id));
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-xs font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedTeachers([])}
                    className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg text-xs font-semibold hover:bg-gray-600 transition-all shadow-md"
                  >
                    Clear
                  </button>
                </div>

                {/* Teacher List */}
                <div className="border-2 border-gray-200 rounded-lg max-h-96 overflow-y-auto bg-gray-50">
                  <div className="p-2 space-y-1">
                    {Array.isArray(filteredTeachers) &&
                      filteredTeachers.map((teacher) => (
                        <label
                          key={teacher.id}
                          className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded cursor-pointer transition-colors border border-transparent hover:border-blue-200"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTeachers.includes(teacher.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTeachers((prev) => [
                                  ...prev,
                                  teacher.id,
                                ]);
                              } else {
                                setSelectedTeachers((prev) =>
                                  prev.filter((id) => id !== teacher.id)
                                );
                              }
                            }}
                            className="w-4 h-4 rounded border-2 border-gray-300 text-indigo-600"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {teacher.name}
                          </span>
                        </label>
                      ))}
                  </div>
                  {(!Array.isArray(filteredTeachers) ||
                    filteredTeachers.length === 0) && (
                    <div className="text-center text-gray-500 py-8 text-sm">
                      <div className="text-2xl mb-2">🔍</div>
                      <div>No teachers found</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Show Update Preview when students are selected and preview exists, otherwise show Preview */}
                {adjustmentType === "waive_absence" &&
                showPreview &&
                previewData.length > 0 ? (
                  <button
                    onClick={() => {
                      previewAdjustments(
                        selectedStudents.length > 0
                          ? selectedStudents
                          : undefined
                      );
                    }}
                    disabled={
                      loading ||
                      !dateRange.startDate ||
                      !dateRange.endDate ||
                      selectedTeachers.length === 0
                    }
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <FiRefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <FiRefreshCw className="h-4 w-4" />
                    )}
                    Update Preview
                    {selectedStudents.length > 0 && (
                      <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                        {selectedStudents.length} selected
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => previewAdjustments()}
                    disabled={
                      loading ||
                      !dateRange.startDate ||
                      !dateRange.endDate ||
                      selectedTeachers.length === 0
                    }
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <FiRefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <FiSearch className="h-4 w-4" />
                    )}
                    Preview Adjustments
                  </button>
                )}

                {/* Show Apply button only when preview exists and not updating */}
                {showPreview && previewData.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (loading) {
                        toast({
                          title: "Please Wait",
                          description: "An adjustment is already in progress",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (previewData.length === 0) {
                        toast({
                          title: "No Preview Data",
                          description: "Please preview adjustments first",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (!reason.trim()) {
                        toast({
                          title: "Missing Reason",
                          description:
                            "Please provide a reason for the adjustment",
                          variant: "destructive",
                        });
                        return;
                      }
                      handleAdjustment();
                    }}
                    disabled={
                      loading || previewData.length === 0 || !reason.trim()
                    }
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <FiCheck className="h-4 w-4" />
                    Apply Adjustments
                    {previewData.length > 0 && (
                      <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                        {previewData.length}
                      </span>
                    )}
                  </button>
                )}
              </div>
              {previewData.length > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {previewData.length}
                  </span>{" "}
                  records •{" "}
                  <span className="font-semibold text-green-600">
                    {previewSummary.totalAmount || 0} ETB
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="space-y-6">
              {/* Update Preview Button - Above Preview List */}
              {adjustmentType === "waive_absence" && previewData.length > 0 && (
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border-2 border-teal-300 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-500 rounded-lg">
                        <FiRefreshCw className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-teal-900 text-sm">
                          {selectedStudents.length > 0
                            ? `${selectedStudents.length} student${
                                selectedStudents.length !== 1 ? "s" : ""
                              } selected`
                            : "All students selected"}
                        </div>
                        <div className="text-xs text-teal-700 font-normal mt-0.5">
                          Click to update preview with current selection
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        previewAdjustments(
                          selectedStudents.length > 0
                            ? selectedStudents
                            : undefined
                        );
                      }}
                      disabled={loading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg text-sm font-semibold hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 transition-all shadow-md"
                    >
                      <FiRefreshCw
                        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                      />
                      {loading ? "Updating..." : "Update Preview"}
                    </button>
                  </div>
                </div>
              )}

              {/* Preview Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                      <FiSearch className="h-6 w-6" />
                      Preview Results
                    </h3>
                    <p className="text-blue-100">
                      {previewData.length} records found • Total:{" "}
                      <span className="font-bold text-white text-lg">
                        {previewSummary.totalAmount || 0} ETB
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {previewData.length > 0 ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {previewSummary.totalRecords}
                      </div>
                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        Records
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {previewSummary.totalTeachers}
                      </div>
                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        Teachers
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {previewSummary.totalLatenessAmount || 0}
                      </div>
                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        Lateness ETB
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200 text-center">
                      <div className="text-2xl font-bold text-red-600 mb-1">
                        {previewSummary.totalAbsenceAmount || 0}
                      </div>
                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        Absence ETB
                      </div>
                    </div>
                  </div>

                  {/* Records Table */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                          <tr>
                            <th className="text-left p-3 font-semibold text-gray-700 text-xs uppercase">
                              Teacher
                            </th>
                            <th className="text-left p-3 font-semibold text-gray-700 text-xs uppercase">
                              Date
                            </th>
                            <th className="text-left p-3 font-semibold text-gray-700 text-xs uppercase">
                              Type
                            </th>
                            <th className="text-left p-3 font-semibold text-gray-700 text-xs uppercase">
                              Student
                            </th>
                            <th className="text-left p-3 font-semibold text-gray-700 text-xs uppercase">
                              Details
                            </th>
                            <th className="text-right p-3 font-semibold text-gray-700 text-xs uppercase">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(previewData) &&
                            previewData.map((record, index) => (
                              <tr
                                key={index}
                                className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"
                              >
                                <td className="p-3 font-medium text-gray-900">
                                  {record.teacherName}
                                </td>
                                <td className="p-3 text-gray-600 text-xs">
                                  {new Date(record.date).toLocaleDateString()}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${
                                      record.type === "Lateness"
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {record.type}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="font-medium text-gray-900 text-sm">
                                    {record.studentName || "N/A"}
                                  </div>
                                  {record.studentPackage && (
                                    <div className="text-xs text-gray-500">
                                      {record.studentPackage}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 text-xs text-gray-600">
                                  {record.type === "Lateness" ? (
                                    <div>
                                      <div>{record.timeSlot || "N/A"}</div>
                                      <div className="text-orange-600 font-medium">
                                        {record.latenessMinutes || 0} min late
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      {record.permitted
                                        ? "Permitted"
                                        : "Unpermitted"}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 text-right font-semibold text-green-600">
                                  {record.deduction} ETB
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Enhanced Teacher Breakdown */}
                  {previewSummary.teacherBreakdown &&
                    Array.isArray(previewSummary.teacherBreakdown) &&
                    previewSummary.teacherBreakdown.length > 0 && (
                      <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border-0">
                        <h4 className="font-bold text-gray-800 mb-6 text-xl flex items-center gap-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <FiUsers className="h-5 w-5 text-green-600" />
                          </div>
                          👥 Per-Teacher Impact:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {previewSummary.teacherBreakdown.map(
                            (teacher: any, index: number) => (
                              <div
                                key={index}
                                className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300"
                              >
                                <span className="font-semibold text-base text-gray-900">
                                  {teacher.teacherName}
                                </span>
                                <span className="font-bold text-green-600 text-lg">
                                  +{teacher.totalDeduction} ETB
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </>
              ) : (
                <div className="text-center py-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-dashed border-green-300">
                  <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <FiCheck className="h-10 w-10 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-3">
                    No Records Found
                  </h4>
                  <p className="text-lg text-gray-700 font-medium mb-4">
                    No deduction records match your criteria. This could mean:
                  </p>
                  <ul className="text-base text-gray-600 space-y-2 max-w-md mx-auto">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      No deductions exist for the selected date range
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Selected teachers had no deductions
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Deductions were already waived previously
                    </li>
                  </ul>
                </div>
              )}

              {/* Student Selection Summary - Show after preview */}
              {adjustmentType === "waive_absence" &&
                showPreview &&
                previewData.length > 0 && (
                  <div className="mt-6 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-xl p-4 border-2 border-teal-300 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-500 rounded-lg shadow-md">
                        <FiUsers className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-teal-900 text-sm">
                          {selectedStudents.length === 0 ? (
                            <>
                              <span className="text-orange-600">
                                ⚠️ All Students Selected
                              </span>
                              <div className="text-xs text-teal-700 font-normal mt-0.5">
                                All {previewData.length} deduction records will
                                be adjusted
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="text-teal-700">
                                ✓ {selectedStudents.length} Student
                                {selectedStudents.length !== 1 ? "s" : ""}{" "}
                                Selected
                              </span>
                              <div className="text-xs text-teal-700 font-normal mt-0.5">
                                Only selected students will be adjusted
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-teal-300">
                      <p className="text-xs text-teal-800 font-medium">
                        💡 <strong>Tip:</strong> Change student selection in the
                        form above, then use <strong>"Update Preview"</strong>{" "}
                        button above the preview list to see the updated
                        results.
                      </p>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Success Review Section - Show after applying */}
          {showSuccessReview && lastAppliedAdjustment && (
            <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-8 border-4 border-green-400 shadow-2xl mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-green-500 rounded-2xl shadow-lg">
                    <FiCheck className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-green-900 mb-1">
                      ✅ Adjustment Applied Successfully!
                    </h3>
                    <p className="text-green-700 font-medium">
                      Your deduction adjustment has been processed and is now
                      active
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSuccessReview(false);
                    setLastAppliedAdjustment(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-xl hover:bg-white/50 transition-all duration-300"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FiFileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-sm font-semibold text-gray-600">
                      Records Adjusted
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-blue-600 mb-1">
                    {lastAppliedAdjustment.recordsAffected}
                  </div>
                  <div className="text-xs text-gray-500">
                    Deduction record
                    {lastAppliedAdjustment.recordsAffected !== 1
                      ? "s"
                      : ""}{" "}
                    waived
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FiDollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-sm font-semibold text-gray-600">
                      Amount Returned
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-green-600 mb-1">
                    {lastAppliedAdjustment.totalAmountWaived.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    ETB added to salaries
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FiUsers className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-sm font-semibold text-gray-600">
                      Teachers Affected
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-purple-600 mb-1">
                    {lastAppliedAdjustment.selectedTeachers.length}
                  </div>
                  <div className="text-xs text-gray-500">
                    Teacher
                    {lastAppliedAdjustment.selectedTeachers.length !== 1
                      ? "s"
                      : ""}{" "}
                    received adjustment
                  </div>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-200 mb-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiSettings className="h-5 w-5 text-blue-600" />
                  Adjustment Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Adjustment Type
                    </div>
                    <div className="text-base font-bold text-gray-900">
                      {lastAppliedAdjustment.adjustmentType === "waive_absence"
                        ? "❌ Absence Deduction Waiver"
                        : "⏰ Lateness Deduction Waiver"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Date Range
                    </div>
                    <div className="text-base font-bold text-gray-900">
                      {new Date(
                        lastAppliedAdjustment.dateRange.startDate
                      ).toLocaleDateString()}{" "}
                      to{" "}
                      {new Date(
                        lastAppliedAdjustment.dateRange.endDate
                      ).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Teachers
                    </div>
                    <div className="text-base font-medium text-gray-900">
                      {lastAppliedAdjustment.selectedTeachers.join(", ")}
                    </div>
                  </div>
                  {lastAppliedAdjustment.adjustmentType === "waive_absence" && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        Students Selected
                      </div>
                      <div className="text-base font-medium text-gray-900">
                        {lastAppliedAdjustment.selectedStudents > 0
                          ? `${
                              lastAppliedAdjustment.selectedStudents
                            } specific student${
                              lastAppliedAdjustment.selectedStudents !== 1
                                ? "s"
                                : ""
                            }`
                          : "All students"}
                      </div>
                    </div>
                  )}
                  {lastAppliedAdjustment.adjustmentType ===
                    "waive_lateness" && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        Time Slots Selected
                      </div>
                      <div className="text-base font-medium text-gray-900">
                        {lastAppliedAdjustment.selectedTimeSlots > 0
                          ? `${
                              lastAppliedAdjustment.selectedTimeSlots
                            } specific time slot${
                              lastAppliedAdjustment.selectedTimeSlots !== 1
                                ? "s"
                                : ""
                            }`
                          : "All time slots"}
                      </div>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Reason
                    </div>
                    <div className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {lastAppliedAdjustment.reason}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Link
                    href="/admin/teacher-payments"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <FiExternalLink className="h-4 w-4" />
                    View Teacher Payments
                  </Link>
                  <button
                    onClick={() => {
                      setShowHistory(true);
                      setShowSuccessReview(false);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <FiFileText className="h-4 w-4" />
                    View Full History
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  Applied at:{" "}
                  {new Date(lastAppliedAdjustment.appliedAt).toLocaleString()}
                </div>
              </div>

              {/* Important Notice */}
              <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <div className="font-bold mb-1">
                      ✅ Changes Are Now Live
                    </div>
                    <div>
                      The adjusted amounts have been automatically added back to
                      teacher salaries. You can verify this in the{" "}
                      <Link
                        href="/admin/teacher-payments"
                        className="font-semibold underline hover:text-blue-700"
                      >
                        Teacher Payments
                      </Link>{" "}
                      page. All salary calculations have been updated
                      immediately.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Waiver History Section */}
          {showHistory && (
            <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-2xl p-8 border-0 shadow-xl mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiSearch className="h-6 w-6 text-purple-600" />
                  </div>
                  📋 Waiver History ({waiverHistory.length} records)
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-all duration-300"
                >
                  ✕ Close
                </button>
              </div>

              {waiverHistory.length > 0 ? (
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg border-0">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-base">
                      <thead className="bg-gradient-to-r from-gray-100 to-purple-100 sticky top-0">
                        <tr>
                          <th className="text-left p-4 font-bold text-gray-800">
                            Applied
                          </th>
                          <th className="text-left p-4 font-bold text-gray-800">
                            Teacher
                          </th>
                          <th className="text-left p-4 font-bold text-gray-800">
                            Type
                          </th>
                          <th className="text-left p-4 font-bold text-gray-800">
                            Deduction Date
                          </th>
                          <th className="text-right p-4 font-bold text-gray-800">
                            Amount
                          </th>
                          <th className="text-left p-4 font-bold text-gray-800">
                            Admin
                          </th>
                          <th className="text-left p-4 font-bold text-gray-800">
                            Reason & Details
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(waiverHistory) &&
                          waiverHistory.map((waiver, index) => (
                            <tr
                              key={index}
                              className="border-b border-gray-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300"
                            >
                              <td className="p-4">
                                <div className="text-sm">
                                  <div className="font-semibold text-gray-900">
                                    {new Date(
                                      waiver.createdAt
                                    ).toLocaleDateString()}
                                  </div>
                                  <div className="text-gray-600">
                                    {new Date(
                                      waiver.createdAt
                                    ).toLocaleTimeString()}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="text-sm">
                                  <div className="font-semibold text-gray-900">
                                    {waiver.teacherName}
                                  </div>
                                  <div className="text-gray-600">
                                    ID: {waiver.teacherId}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span
                                  className={`px-3 py-2 rounded-xl text-sm font-bold ${
                                    waiver.deductionType === "lateness"
                                      ? "bg-orange-100 text-orange-800 border border-orange-200"
                                      : "bg-red-100 text-red-800 border border-red-200"
                                  }`}
                                >
                                  {waiver.deductionType === "lateness"
                                    ? "⏰ Lateness"
                                    : "❌ Absence"}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="text-sm">
                                  <div className="font-semibold text-gray-900">
                                    {new Date(
                                      waiver.deductionDate
                                    ).toLocaleDateString()}
                                  </div>
                                  <div className="text-gray-600">
                                    {new Date(
                                      waiver.deductionDate
                                    ).toLocaleDateString("en-US", {
                                      weekday: "short",
                                    })}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                <div className="text-sm">
                                  <div className="font-mono font-bold text-green-600 text-lg">
                                    +{waiver.originalAmount}
                                  </div>
                                  <div className="text-gray-600">ETB</div>
                                </div>
                              </td>
                              <td className="p-4 text-sm">
                                <div className="font-semibold text-blue-600">
                                  {waiver.adminId}
                                </div>
                                <div className="text-gray-600">Admin</div>
                              </td>
                              <td className="p-4 text-sm max-w-sm">
                                <div className="space-y-2">
                                  <div className="font-semibold text-gray-900 line-clamp-2">
                                    {waiver.reason.split("|")[0]?.trim() ||
                                      waiver.reason}
                                  </div>
                                  {waiver.reason.includes("|") && (
                                    <div className="text-gray-600 text-xs bg-gray-50 p-2 rounded-lg border border-gray-200">
                                      {waiver.reason.split("|")[1]?.trim()}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-dashed border-blue-300">
                  <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <FiSearch className="h-10 w-10 text-blue-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-3">
                    No Waiver History
                  </h4>
                  <p className="text-lg text-gray-700 font-medium">
                    No deduction waivers have been applied yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Debug Logs Section - SIMPLIFIED - Always visible */}
          <div className="mt-8 bg-gray-900 rounded-2xl shadow-xl overflow-hidden border-2 border-yellow-500">
            <div className="px-4 py-3 bg-yellow-900/50 text-yellow-200 flex items-center justify-between">
              <span className="font-bold">
                🔍 Debug Logs ({debugLogs.length} entries)
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDebug}
                  onChange={(e) => setShowDebug(e.target.checked)}
                  className="w-5 h-5 cursor-pointer"
                />
                <span className="text-sm">{showDebug ? "Hide" : "Show"}</span>
              </label>
            </div>

            {showDebug && (
              <div className="p-6 bg-gray-900 max-h-[600px] overflow-y-auto">
                {debugLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-lg font-bold mb-2">No debug logs yet</p>
                    <p className="text-sm">
                      Apply an adjustment to see debug logs
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 font-mono text-xs">
                    {debugLogs.map((log, index) => {
                      const isSuccess = log.includes("✓");
                      const isWarning =
                        log.includes("⚠") || log.includes("WARNING");
                      const isError =
                        log.includes("✗") || log.includes("Error");

                      let bgColor = "bg-gray-800";
                      let textColor = "text-gray-300";

                      if (isSuccess) {
                        bgColor = "bg-green-900/30";
                        textColor = "text-green-300";
                      } else if (isWarning) {
                        bgColor = "bg-yellow-900/30";
                        textColor = "text-yellow-300";
                      } else if (isError) {
                        bgColor = "bg-red-900/30";
                        textColor = "text-red-300";
                      }

                      return (
                        <div
                          key={index}
                          className={`${bgColor} ${textColor} p-2 rounded border border-gray-700`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 text-xs min-w-[40px]">
                              [{index + 1}]
                            </span>
                            <pre className="whitespace-pre-wrap break-words flex-1 text-xs">
                              {log}
                            </pre>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {debugLogs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700 flex gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const logText = debugLogs.join("\n");
                        navigator.clipboard.writeText(logText);
                        toast({
                          title: "Copied!",
                          description: "Debug logs copied to clipboard",
                        });
                      }}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      Copy All Logs
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDebugLogs([]);
                        setShowDebug(false);
                      }}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      Clear Logs
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
