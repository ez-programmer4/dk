"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  FiArrowLeft,
  FiInfo,
  FiCheckCircle,
  FiCalendar,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiPlus,
  FiLoader,
  FiClock,
} from "react-icons/fi";
import dayjs from "dayjs";
import { useParams } from "next/navigation";

type Permission = {
  id?: string;
  date?: string;
  dates?: string[];
  reason: string;
  details?: string;
  status?: string;
  requestedDate?: string;
  timeSlots?: string;
  reasonCategory?: string;
  reasonDetails?: string;
  createdAt?: string;
};

export default function TeacherPermissions() {
  const { toast } = useToast();
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() =>
    dayjs().format("YYYY-MM")
  );
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: "",
    timeSlots: [] as string[],
    reason: "",
    details: "",
  });

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/${schoolSlug}/teachers/permissions`);
      if (!response.ok) throw new Error("Failed to load permissions");
      const data = await response.json();
      setPermissions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load permissions"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [schoolSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.date ||
      !formData.timeSlots.length ||
      !formData.reason ||
      !formData.details
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/${schoolSlug}/teachers/permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to submit permission request"
        );
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: result.message,
      });

      // Reset form
      setFormData({
        date: "",
        timeSlots: [],
        reason: "",
        details: "",
      });
      setShowForm(false);

      // Reload permissions
      loadPermissions();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to submit request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      case "pending":
      default:
        return "text-yellow-600 bg-yellow-100";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <FiCheckCircle className="w-4 h-4" />;
      case "rejected":
        return <FiX className="w-4 h-4" />;
      case "pending":
      default:
        return <FiClock className="w-4 h-4" />;
    }
  };

  const filteredPermissions = permissions.filter((permission) => {
    if (!permission.requestedDate) return false;
    return dayjs(permission.requestedDate).format("YYYY-MM") === selectedMonth;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Permission Requests
          </h1>
          <p className="text-gray-600">
            Manage your absence and permission requests
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          New Request
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-center gap-2">
            <FiInfo className="text-red-500 w-5 h-5" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Month Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Label htmlFor="month-select">Select Month:</Label>
            <Input
              id="month-select"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="text-sm text-gray-600">
            {filteredPermissions.length} request
            {filteredPermissions.length !== 1 ? "s" : ""} for{" "}
            {dayjs(selectedMonth).format("MMMM YYYY")}
          </div>
        </div>
      </div>

      {/* Permissions List */}
      <div className="space-y-4">
        {filteredPermissions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Requests Found
            </h3>
            <p className="text-gray-600 mb-4">
              You haven't submitted any permission requests for this month.
            </p>
            <Button onClick={() => setShowForm(true)}>
              Submit Your First Request
            </Button>
          </div>
        ) : (
          filteredPermissions.map((permission, index) => (
            <div
              key={permission.id || index}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${getStatusColor(
                      permission.status
                    )}`}
                  >
                    {getStatusIcon(permission.status)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {dayjs(permission.requestedDate).format(
                        "dddd, MMMM D, YYYY"
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {permission.reasonCategory || permission.reason}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    permission.status
                  )}`}
                >
                  {permission.status || "Pending"}
                </div>
              </div>

              {permission.timeSlots && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Time Slots:{" "}
                  </span>
                  <span className="text-sm text-gray-600">
                    {JSON.parse(permission.timeSlots).includes("Whole Day")
                      ? "Whole Day"
                      : JSON.parse(permission.timeSlots).join(", ")}
                  </span>
                </div>
              )}

              {permission.reasonDetails && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Details:{" "}
                  </span>
                  <span className="text-sm text-gray-600">
                    {permission.reasonDetails}
                  </span>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Submitted on{" "}
                {dayjs(permission.createdAt).format("MMM D, YYYY 'at' h:mm A")}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Permission Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  New Permission Request
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    min={dayjs().format("YYYY-MM-DD")}
                    required
                  />
                </div>

                <div>
                  <Label>Time Slots *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {["Whole Day", "Morning", "Afternoon", "Evening"].map(
                      (slot) => (
                        <label key={slot} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.timeSlots.includes(slot)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (slot === "Whole Day") {
                                  setFormData((prev) => ({
                                    ...prev,
                                    timeSlots: ["Whole Day"],
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    timeSlots: [
                                      ...prev.timeSlots.filter(
                                        (s) => s !== "Whole Day"
                                      ),
                                      slot,
                                    ],
                                  }));
                                }
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  timeSlots: prev.timeSlots.filter(
                                    (s) => s !== slot
                                  ),
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{slot}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Reason *</Label>
                  <Select
                    value={formData.reason}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, reason: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="personal">
                        Personal Emergency
                      </SelectItem>
                      <SelectItem value="family">Family Matter</SelectItem>
                      <SelectItem value="religious">
                        Religious Obligation
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="details">Details *</Label>
                  <Textarea
                    id="details"
                    value={formData.details}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        details: e.target.value,
                      }))
                    }
                    placeholder="Please provide more details about your request..."
                    rows={4}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
