"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiTrash2,
  FiChevronDown,
  FiChevronRight as FiChevronRightIcon,
  FiCopy,
  FiRefreshCw,
  FiUsers,
  FiFilter,
  FiUserPlus,
  FiAlertCircle,
  FiCalendar,
  FiPhone,
  FiShield,
  FiSettings,
  FiAward,
  FiX,
  FiUser,
  FiCheck,
  FiInfo,
  FiActivity,
  FiClock,
  FiHeart,
} from "react-icons/fi";
import Modal from "@/app/components/Modal";
import ConfirmModal from "@/app/components/ConfirmModal";
import { useDebounce } from "use-debounce";
import { useBranding } from "../layout";

// Schedule Generator Component
const ScheduleGenerator = ({
  value,
  onChange,
  primaryColor,
  secondaryColor,
}: {
  value: string;
  onChange: (value: string) => void;
  primaryColor: string;
  secondaryColor: string;
}) => {
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);

  useEffect(() => {
    if (value) {
      const times = value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => {
          // If it's already in 12-hour format, keep it
          if (t.includes("AM") || t.includes("PM")) {
            return t;
          }
          // If it's in 24-hour format, convert to 12-hour
          return formatTo12Hour(t);
        });
      setSelectedTimes(times);
    }
  }, [value]);

  const formatTo12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hours12.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${period}`;
  };

  const generateTimeSlots = () => {
    const slots = [];

    // New prayer time ranges
    const prayerTimes = {
      Midnight: { start: 0, end: 5 * 60 + 30 }, // 12:00 AM to 5:30 AM
      Fajr: { start: 6 * 60, end: 12 * 60 + 30 }, // 6:00 AM to 12:30 PM
      Zuhur: { start: 13 * 60, end: 15 * 60 + 30 }, // 1:00 PM to 3:30 PM
      Asr: { start: 16 * 60, end: 18 * 60 + 30 }, // 4:00 PM to 6:30 PM
      Maghrib: { start: 19 * 60, end: 20 * 60 }, // 7:00 PM to 8:00 PM
      Isha: { start: 20 * 60 + 30, end: 23 * 60 + 30 }, // 8:30 PM to 11:30 PM
    };

    // Generate all 30-minute intervals for full 24 hours
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        const time12 = formatTo12Hour(timeStr);
        const currentTime = hour * 60 + minute;

        // Determine prayer period
        let category = "General";

        if (
          currentTime >= prayerTimes.Midnight.start &&
          currentTime <= prayerTimes.Midnight.end
        ) {
          category = "Midnight";
        } else if (
          currentTime >= prayerTimes.Fajr.start &&
          currentTime <= prayerTimes.Fajr.end
        ) {
          category = "Fajr";
        } else if (
          currentTime >= prayerTimes.Zuhur.start &&
          currentTime <= prayerTimes.Zuhur.end
        ) {
          category = "Zuhur";
        } else if (
          currentTime >= prayerTimes.Asr.start &&
          currentTime <= prayerTimes.Asr.end
        ) {
          category = "Asr";
        } else if (
          currentTime >= prayerTimes.Maghrib.start &&
          currentTime <= prayerTimes.Maghrib.end
        ) {
          category = "Maghrib";
        } else if (
          currentTime >= prayerTimes.Isha.start &&
          currentTime <= prayerTimes.Isha.end
        ) {
          category = "Isha";
        }

        // Only add slots that belong to prayer periods
        if (category !== "General") {
          slots.push({
            time: timeStr,
            time12: time12,
            prayer: category,
          });
        }
      }
    }

    return slots;
  };

  const toggleTime = (time: string) => {
    // Convert 24-hour format to 12-hour format with AM/PM
    const time12Hour = formatTo12Hour(time);

    const newTimes = selectedTimes.includes(time12Hour)
      ? selectedTimes.filter((t) => t !== time12Hour)
      : [...selectedTimes, time12Hour].sort((a, b) => {
          // Sort by converting back to 24-hour for proper ordering
          const convertTo24 = (time12: string) => {
            const [time, period] = time12.split(" ");
            const [hours, minutes] = time.split(":").map(Number);
            let hour24 = hours;
            if (period === "AM" && hours === 12) hour24 = 0;
            if (period === "PM" && hours !== 12) hour24 = hours + 12;
            return hour24 * 60 + minutes;
          };
          return convertTo24(a) - convertTo24(b);
        });

    setSelectedTimes(newTimes);
    onChange(newTimes.join(", "));
  };

  const selectAllTimes = () => {
    const timeSlots = generateTimeSlots();
    const allTime12Hours = timeSlots
      .map((slot) => slot.time12)
      .sort((a, b) => {
        // Sort by converting back to 24-hour for proper ordering
        const convertTo24 = (time12: string) => {
          const [time, period] = time12.split(" ");
          const [hours, minutes] = time.split(":").map(Number);
          let hour24 = hours;
          if (period === "AM" && hours === 12) hour24 = 0;
          if (period === "PM" && hours !== 12) hour24 = hours + 12;
          return hour24 * 60 + minutes;
        };
        return convertTo24(a) - convertTo24(b);
      });
    setSelectedTimes(allTime12Hours);
    onChange(allTime12Hours.join(", "));
  };

  const deselectAllTimes = () => {
    setSelectedTimes([]);
    onChange("");
  };

  const selectPrayerPeriod = (prayer: string) => {
    const timeSlots = generateTimeSlots();
    const prayerSlots = timeSlots.filter((slot) => slot.prayer === prayer);
    const prayerTime12Hours = prayerSlots
      .map((slot) => slot.time12)
      .sort((a, b) => {
        // Sort by converting back to 24-hour for proper ordering
        const convertTo24 = (time12: string) => {
          const [time, period] = time12.split(" ");
          const [hours, minutes] = time.split(":").map(Number);
          let hour24 = hours;
          if (period === "AM" && hours === 12) hour24 = 0;
          if (period === "PM" && hours !== 12) hour24 = hours + 12;
          return hour24 * 60 + minutes;
        };
        return convertTo24(a) - convertTo24(b);
      });

    // Merge with existing selected times, avoiding duplicates
    const mergedTimes = [
      ...new Set([...selectedTimes, ...prayerTime12Hours]),
    ].sort((a, b) => {
      const convertTo24 = (time12: string) => {
        const [time, period] = time12.split(" ");
        const [hours, minutes] = time.split(":").map(Number);
        let hour24 = hours;
        if (period === "AM" && hours === 12) hour24 = 0;
        if (period === "PM" && hours !== 12) hour24 = hours + 12;
        return hour24 * 60 + minutes;
      };
      return convertTo24(a) - convertTo24(b);
    });

    setSelectedTimes(mergedTimes);
    onChange(mergedTimes.join(", "));
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-gray-300">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter manually with AM/PM: 6:00 AM, 2:30 PM, 8:00 PM or select from slots below"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900"
          style={{
            boxShadow: `0 0 0 2px ${primaryColor}40`,
          }}
        />
      </div>

      {/* Select All / Deselect All Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={selectAllTimes}
          className="flex-1 text-white px-4 py-3 rounded-xl font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          style={{
            background: 'linear-gradient(135deg, ' + primaryColor + ', ' + secondaryColor + ')',
          }}
        >
          <FiCheck className="h-4 w-4" />
          Select All Time Slots
        </button>
        <button
          type="button"
          onClick={deselectAllTimes}
          className="flex-1 bg-white hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-xl font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2 border border-gray-200"
        >
          <FiX className="h-4 w-4" />
          Deselect All
        </button>
      </div>

      <div className="space-y-4">
        {["Midnight", "Fajr", "Zuhur", "Asr", "Maghrib", "Isha"].map(
          (prayer) => {
            const prayerSlots = timeSlots.filter(
              (slot) => slot.prayer === prayer
            );
            const prayerColors = {
              Midnight: "border-gray-200 bg-gray-50",
              Subhi: "border-gray-200 bg-gray-50",
              Dhuhr: "border-gray-200 bg-gray-50",
              Asr: "border-gray-200 bg-gray-50",
              Maghrib: "border-gray-200 bg-gray-50",
              Isha: "border-gray-200 bg-gray-50",
            };

            const prayerPeriods = {
              Midnight: "Midnight (12:00 AM - 5:30 AM)",
              Fajr: "Fajr (6:00 AM - 12:30 PM)",
              Zuhur: "Zuhur (1:00 PM - 3:30 PM)",
              Asr: "Asr (4:00 PM - 6:30 PM)",
              Maghrib: "Maghrib (7:00 PM - 8:00 PM)",
              Isha: "Isha (8:30 PM - 11:30 PM)",
            };

            return (
              <div
                key={prayer}
                className={`p-4 rounded-xl border-2 ${
                  prayerColors[prayer as keyof typeof prayerColors]
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                    <h4 className="font-bold text-lg text-gray-800">
                      {prayer} Period
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectPrayerPeriod(prayer)}
                    className="px-3 py-1.5 text-white text-xs font-semibold rounded-lg transition-all hover:scale-105 flex items-center gap-1"
                    style={{
                      background: 'linear-gradient(135deg, ' + primaryColor + ', ' + secondaryColor + ')',
                    }}
                    title={`Select all ${prayer} time slots`}
                  >
                    <FiCheck className="h-3 w-3" />
                    Select All
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-3 font-medium">
                  {prayerPeriods[prayer as keyof typeof prayerPeriods]}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {prayerSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleTime(slot.time)}
                      className={`p-2 text-sm rounded-lg border transition-all duration-200 hover:scale-105 ${
                        selectedTimes.includes(slot.time12)
                          ? "bg-black text-white border-black shadow-lg"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                      }`}
                    >
                      <div className="font-bold">{slot.time12}</div>
                      <div className="text-xs opacity-75">{slot.time}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          }
        )}
      </div>

      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-700 font-medium">
          💡 Select from prayer-based time slots with 30-minute intervals. Times
          shown in both 12-hour and 24-hour formats.
        </p>
      </div>
    </div>
  );
};

type UserRole = "admin" | "controller" | "teacher" | "registral";

interface User {
  id: string;
  name: string;
  username?: string;
  role: UserRole;
  schedule?: string;
  controlId?: string;
  phone?: string;
  code?: string;
}

const RoleBadge = ({ role, primaryColor, secondaryColor }: { role: UserRole; primaryColor: string; secondaryColor: string }) => {
  const roleStyles: Record<UserRole, string> = {
    admin: `bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border-purple-200`,
    controller: `bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200`,
    teacher: `bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200`,
    registral: `bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 border-orange-200`,
  };

  if (!role) return null;

  return (
    <span
      className={`px-3 py-1 text-sm font-semibold rounded-full ${roleStyles[role]}`}
    >
      {role?.charAt(0)?.toUpperCase() + role?.slice(1) || "Unknown"}
    </span>
  );
};

const roleOrder: UserRole[] = ["admin", "controller", "teacher", "registral"];
const roleLabels: Record<UserRole, string> = {
  admin: "Admins",
  controller: "Controllers",
  teacher: "Teachers",
  registral: "Registrals",
};

const roleIcons: Record<UserRole, any> = {
  admin: FiShield,
  controller: FiUsers,
  teacher: FiAward,
  registral: FiSettings,
};

export default function UserManagementPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const branding = useBranding();

  // Use branding colors with fallbacks
  const primaryColor = branding?.primaryColor || "#4F46E5";
  const secondaryColor = branding?.secondaryColor || "#7C3AED";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [newUserRole, setNewUserRole] = useState<UserRole>("controller");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedRoles, setExpandedRoles] = useState<Record<UserRole, boolean>>(
    {
      admin: true,
      controller: true,
      teacher: true,
      registral: true,
    }
  );
  const [controllers, setControllers] = useState<User[]>([]);
  const [teacherSchedule, setTeacherSchedule] = useState("");
  const [teacherControlId, setTeacherControlId] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [generatedUsername, setGeneratedUsername] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);
  const [totalCounts, setTotalCounts] = useState<Record<UserRole, number>>({
    admin: 0,
    controller: 0,
    teacher: 0,
    registral: 0,
  });
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: debouncedSearchQuery,
        role: roleFilter,
      });
      const res = await fetch(`/api/admin/${schoolSlug}/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();
      setUsers(data.users);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchQuery, roleFilter]);

  useEffect(() => {
    fetchUsers();
    fetchTotalCounts();
  }, [fetchUsers]);

  const fetchTotalCounts = async () => {
    try {
      const res = await fetch(`/api/admin/${schoolSlug}/users/counts`);
      if (!res.ok) throw new Error("Failed to fetch counts");
      const data = await res.json();
      setTotalCounts(data.counts);
      setTotalUsers(data.total);
    } catch (err: any) {
      console.error("Error fetching counts:", err);
    }
  };

  const fetchControllers = async () => {
    try {
      const res = await fetch(`/api/admin/${schoolSlug}/users?role=controller&limit=100`);
      if (!res.ok) throw new Error("Failed to fetch controllers");
      const data = await res.json();
      setControllers(data.users);
    } catch (err: any) {
      console.error("Error fetching controllers:", err);
    }
  };

  useEffect(() => {
    fetchControllers();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if ((editingUser ? editingUser.role : newUserRole) === "teacher") {
      if (
        !teacherControlId ||
        teacherControlId === "" ||
        teacherControlId === "0"
      ) {
        setError("Please select a valid controller for the teacher");
        return;
      }

      if (!teacherSchedule.trim()) {
        setError("Please enter a schedule for the teacher");
        return;
      }

      if (!teacherPhone.trim()) {
        setError("Please enter a phone number for the teacher");
        return;
      }

      // Use the already generated password from state
      data.controlId = teacherControlId;
      data.schedule = teacherSchedule.trim();
      data.phone = teacherPhone.trim();
      data.password = generatedPassword;
      data.plainPassword = generatedPassword;
    }

    const payload = {
      ...data,
      id: editingUser?.id,
      role: editingUser ? editingUser.role : newUserRole,
    };

    const method = editingUser ? "PUT" : "POST";

    try {
      const res = await fetch(`/api/admin/${schoolSlug}/users`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Something went wrong");
      }

      const result = await res.json();

      // Show generated credentials for new teachers
      if (
        !editingUser &&
        newUserRole === "teacher" &&
        result.generatedUsername &&
        result.generatedPassword
      ) {
        setGeneratedUsername(result.generatedUsername);
        setGeneratedPassword(result.generatedPassword);
        setShowCredentials(true);
      } else {
        setIsModalOpen(false);
        fetchUsers();
        resetForm();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      const res = await fetch(`/api/admin/${schoolSlug}/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingUser.id, role: deletingUser.role }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Something went wrong");
      }

      setIsConfirmModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setNewUserRole("controller");
    setTeacherSchedule("");
    setTeacherControlId("");
    setTeacherPhone("");
  };

  const openCreateModal = () => {
    resetForm();
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setNewUserRole(user.role);
    setTeacherSchedule(user.schedule || "");
    setTeacherControlId(user.controlId || "");
    setTeacherPhone(user.phone || "");
    setIsModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setDeletingUser(user);
    setIsConfirmModalOpen(true);
  };

  const toggleRoleExpansion = (role: UserRole) => {
    setExpandedRoles((prev) => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const groupedUsers = roleOrder.reduce((acc, role) => {
    acc[role] = users.filter((user) => user.role === role);
    return acc;
  }, {} as Record<UserRole, User[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="relative mb-8">
            <div
              className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 mx-auto"
              style={{
                borderTopColor: primaryColor,
              }}
            ></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Loading Users</h2>
          <p className="text-gray-600 text-lg">
            Please wait while we fetch the data
          </p>
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}08 0%, ${secondaryColor}05 50%, #ffffff 100%)`,
      }}
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Modern Header */}
        <div
          className="bg-white rounded-2xl shadow-lg border border-gray-100/50 p-8 lg:p-10 backdrop-blur-sm"
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
                <FiUsers className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1
                  className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent mb-2"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  User Management
                </h1>
                <p className="text-gray-600 text-lg lg:text-xl font-medium">
                  Manage system users, roles, and permissions
                </p>
              </div>
            </div>
          </div>

          {/* Modern Controls */}
          <div
            className="rounded-2xl p-8 border border-gray-100/50"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}05 0%, ${secondaryColor}03 100%)`,
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              <div className="lg:col-span-4">
                <label className="block text-sm font-bold text-black mb-3">
                  <FiSearch className="inline h-4 w-4 mr-2" />
                  Search Users
                </label>
                <input
                  type="text"
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900 shadow-sm transition-all duration-200 text-base"
                  style={{
                    boxShadow: `0 0 0 2px ${primaryColor}40`,
                  }}
                />
              </div>
              <div className="lg:col-span-4">
                <label className="block text-sm font-bold text-black mb-3">
                  <FiFilter className="inline h-4 w-4 mr-2" />
                  Filter by Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900 shadow-sm transition-all duration-200 text-base"
                  style={{
                    boxShadow: `0 0 0 2px ${primaryColor}40`,
                  }}
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="controller">Controller</option>
                  <option value="teacher">Teacher</option>
                  <option value="registral">Registral</option>
                </select>
              </div>
              <div className="lg:col-span-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-700 px-4 py-4 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 border border-gray-200"
                  >
                    <FiRefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                  <button
                    onClick={openCreateModal}
                    className="flex-1 text-white px-4 py-4 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    style={{
                      background: 'linear-gradient(135deg, ' + primaryColor + ', ' + secondaryColor + ')',
                    }}
                  >
                    <FiUserPlus className="h-4 w-4" />
                    Add User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern User List */}
        <div className="space-y-8">
          {roleOrder.map((role) => {
            const roleUsers = groupedUsers[role] || [];
            const RoleIcon = roleIcons[role];

            return (
              <div
                key={role}
                className="bg-white rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden backdrop-blur-sm"
                style={{
                  background: `linear-gradient(135deg, #ffffff 0%, ${primaryColor}02 100%)`,
                }}
              >
                <div
                  className="p-8 border-b border-gray-100 cursor-pointer hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-300 group"
                  onClick={() => toggleRoleExpansion(role)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div
                        className="p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        }}
                      >
                        <RoleIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                          {roleLabels[role]}
                        </h2>
                        <p className="text-gray-600 font-medium">
                          {roleUsers.length} users
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <RoleBadge role={role} primaryColor={primaryColor} secondaryColor={secondaryColor} />
                      <div className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        {expandedRoles[role] ? (
                          <FiChevronDown className="h-6 w-6 text-gray-400" />
                        ) : (
                          <FiChevronRightIcon className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {expandedRoles[role] && (
                  <div className="p-6">
                    {roleUsers.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="relative mb-8">
                          <div className="p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl w-fit mx-auto shadow-lg">
                            <RoleIcon className="h-16 w-16 text-gray-500" />
                          </div>
                          <div className="absolute -top-2 -right-2 p-2 bg-gray-200 rounded-full">
                            <FiInfo className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">
                          No {roleLabels[role]}
                        </h3>
                        <p className="text-gray-600 text-xl font-medium">
                          No users found with this role.
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                          Click "Add User" to create the first one
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                                User
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                                Details
                              </th>
                              {role === "teacher" && (
                                <>
                                  <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                                    Controller
                                  </th>
                                  <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                                    Schedule
                                  </th>
                                </>
                              )}
                              <th className="px-6 py-4 text-right text-sm font-bold text-black uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {roleUsers.map((user, index) => (
                              <tr
                                key={user.id}
                                className={`hover:bg-gray-50 transition-all duration-200 ${
                                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }`}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                    <div
                                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                                      style={{
                                        background: 'linear-gradient(135deg, ' + primaryColor + ', ' + secondaryColor + ')',
                                      }}
                                    >
                                      <span className="text-white font-bold text-lg">
                                        {user.name
                                          ? user.name.charAt(0).toUpperCase()
                                          : "?"}
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-gray-900 text-base">
                                        {user.name || "Unknown User"}
                                      </div>
                                      {user.username && (
                                        <div className="text-sm text-gray-600 font-medium">
                                          @{user.username}
                                        </div>
                                      )}
                                      {user.role === "teacher" && user.controlId && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          Controller: {controllers.find(c => c && c.id === user.controlId)?.name || "Unknown"}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-2">
                                    {user.phone && (
                                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                        <div className="p-1 bg-blue-100 rounded">
                                          <FiPhone className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{user.phone}</span>
                                        <button
                                          onClick={() =>
                                            copyToClipboard(user.phone!)
                                          }
                                          className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                                          title="Copy phone"
                                        >
                                          <FiCopy className="h-3 w-3 text-gray-500" />
                                        </button>
                                      </div>
                                    )}
                                    {user.code && (
                                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                        <div className="p-1 bg-green-100 rounded">
                                          <FiShield className="h-4 w-4 text-green-600" />
                                        </div>
                                        <span className="font-mono text-sm font-bold text-gray-700 bg-white px-2 py-1 rounded border">
                                          #{user.code}
                                        </span>
                                        <button
                                          onClick={() =>
                                            copyToClipboard(user.code!)
                                          }
                                          className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
                                          title="Copy code"
                                        >
                                          <FiCopy className="h-3 w-3 text-gray-500" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                {role === "teacher" && (
                                  <>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div
                                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                                          style={{
                                            background: user.controlId
                                              ? `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`
                                              : "#f3f4f6",
                                          }}
                                        >
                                          <FiUsers
                                            className={`h-4 w-4 ${
                                              user.controlId ? "" : "text-gray-400"
                                            }`}
                                            style={{
                                              color: user.controlId ? primaryColor : undefined,
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <div className={`text-sm font-medium ${
                                            user.controlId ? "text-gray-900" : "text-gray-500"
                                          }`}>
                                            {user.controlId
                                              ? controllers.find(
                                                  (c) =>
                                                    c && c.id === user.controlId
                                                )?.name || "Unknown"
                                              : "Not assigned"}
                                          </div>
                                          {user.controlId && (
                                            <div className="text-xs text-gray-500">
                                              Controller
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div
                                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                                          style={{
                                            background: user.schedule
                                              ? `linear-gradient(135deg, ${secondaryColor}20, ${primaryColor}20)`
                                              : "#f3f4f6",
                                          }}
                                        >
                                          <FiCalendar
                                            className={`h-4 w-4 ${
                                              user.schedule ? "" : "text-gray-400"
                                            }`}
                                            style={{
                                              color: user.schedule ? secondaryColor : undefined,
                                            }}
                                          />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div
                                            className={`text-sm font-medium truncate max-w-xs ${
                                              user.schedule ? "text-gray-900" : "text-gray-500"
                                            }`}
                                            title={user.schedule}
                                          >
                                            {user.schedule ? (
                                              <span className="bg-white px-2 py-1 rounded border text-xs">
                                                {user.schedule.split(",").length} time slots
                                              </span>
                                            ) : (
                                              "No schedule"
                                            )}
                                          </div>
                                          {user.schedule && (
                                            <div className="text-xs text-gray-500 mt-1">
                                              Teaching schedule
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  </>
                                )}
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <button
                                      onClick={() => openEditModal(user)}
                                      className="p-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                                      style={{
                                        background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`,
                                        border: `1px solid ${primaryColor}20`,
                                        color: primaryColor,
                                      }}
                                      title="Edit user"
                                    >
                                      <FiEdit className="h-5 w-5" />
                                    </button>
                                    <button
                                      onClick={() => openDeleteModal(user)}
                                      className="p-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300"
                                      title="Delete user"
                                    >
                                      <FiTrash2 className="h-5 w-5" />
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
              </div>
            );
          })}
        </div>

        {/* Modern Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100/50 p-8 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FiInfo className="h-5 w-5 text-gray-600" />
                </div>
                <p className="text-lg font-semibold text-gray-700">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-4 border border-gray-200 rounded-xl bg-white text-gray-600 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  style={{
                    borderColor: currentPage === 1 ? undefined : primaryColor + '30',
                  }}
                >
                  <FiChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-4 border border-gray-200 rounded-xl bg-white text-gray-600 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  style={{
                    borderColor: currentPage === totalPages ? undefined : primaryColor + '30',
                  }}
                >
                  <FiChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modern Side Drawer Modal */}
        {isModalOpen && (
          <div className="fixed inset-0">
            {/* Backdrop - covers content area below header */}
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
              style={{
                top: '80px', // Account for header height
              }}
            />

            {/* Drawer - slides in from the right */}
            <div
              className={`absolute right-0 h-full w-full max-w-5xl bg-white shadow-2xl transform transition-transform duration-300 ease-out z-50 rounded-l-2xl ${
                isModalOpen ? "translate-x-0" : "translate-x-full"
              }`}
              style={{
                top: '80px', // Account for header height (h-20 = 80px)
                height: 'calc(100vh - 80px)', // Adjust height to not cover header
              }}
            >
              <div className="flex h-full overflow-hidden">
                {/* Left Sidebar */}
                <div
                  className="w-96 flex flex-col border-r border-white/20 shadow-2xl"
                  style={{
                    background: 'linear-gradient(145deg, ' + primaryColor + '95 0%, ' + primaryColor + '85 25%, ' + secondaryColor + '90 50%, ' + secondaryColor + '85 75%, ' + primaryColor + '90 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* Fixed Header */}
                  <div className="p-6 border-b border-white/20 relative overflow-hidden">
                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div
                        className="absolute top-0 right-0 w-32 h-32 rounded-full"
                        style={{
                          background: `radial-gradient(circle, ${primaryColor}, transparent)`,
                        }}
                      />
                      <div
                        className="absolute bottom-0 left-0 w-24 h-24 rounded-full"
                        style={{
                          background: `radial-gradient(circle, ${secondaryColor}, transparent)`,
                        }}
                      />
                    </div>

                    <div className="relative flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-3 rounded-xl backdrop-blur-sm shadow-lg border border-white/20"
                          style={{
                            background: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}50)`,
                          }}
                        >
                          <FiUserPlus className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-white">
                            {editingUser ? "Edit User" : "New User"}
                          </h2>
                          <p className="text-sm text-white/80 mt-1">
                            {editingUser ? "Update details" : "Create account"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-105"
                      >
                        <FiX className="h-5 w-5 text-white" />
                      </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="p-1 rounded-lg"
                            style={{
                              background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}40)`,
                            }}
                          >
                            <FiUsers className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-xs text-white/80 font-medium">Users</span>
                        </div>
                        <div className="text-xl font-bold text-white">{totalUsers}</div>
                        <div className="text-xs text-white/60">Total registered</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="p-1 rounded-lg"
                            style={{
                              background: `linear-gradient(135deg, ${secondaryColor}30, ${primaryColor}40)`,
                            }}
                          >
                            <FiUser className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-xs text-white/80 font-medium">Teachers</span>
                        </div>
                        <div className="text-xl font-bold text-white">{totalCounts.teacher}</div>
                        <div className="text-xs text-white/60">Active teachers</div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {/* Role Selection Section */}
                    {!editingUser && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className="p-2 rounded-lg"
                              style={{
                                background: 'linear-gradient(135deg, ' + primaryColor + '20, ' + secondaryColor + '25)',
                              }}
                          >
                            <FiShield className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="text-white font-semibold">Select Role</h3>
                        </div>

                        <div className="space-y-3">
                          {roleOrder.map((role) => {
                            const RoleIcon = roleIcons[role];
                            return (
                              <label
                                key={role}
                                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 ${
                                  newUserRole === role
                                    ? "bg-white text-gray-900 shadow-lg"
                                    : "bg-white/10 backdrop-blur-sm hover:bg-white/20"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="role"
                                  value={role}
                                  checked={newUserRole === role}
                                  onChange={(e) =>
                                    setNewUserRole(e.target.value as UserRole)
                                  }
                                  className="sr-only"
                                />
                                <div
                                  className="p-2 rounded-lg"
                                  style={{
                                    background: newUserRole === role
                                      ? "#f3f4f6"
                                      : `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}40)`,
                                  }}
                                >
                                  <RoleIcon className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {roleLabels[role]}
                                  </div>
                                  <div className="text-xs opacity-75 mt-1">
                                    {role === 'admin' && 'Full system access'}
                                    {role === 'controller' && 'Teacher management'}
                                    {role === 'teacher' && 'Teaching & attendance'}
                                    {role === 'registral' && 'Registration & records'}
                                  </div>
                                </div>
                                {newUserRole === role && (
                                  <FiCheck className="h-5 w-5" />
                                )}
                              </label>
                            );
                          })}
                        </div>

                        {/* Role Information */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                          <h4 className="text-white font-medium text-sm mb-3">Role Information</h4>
                          <div className="space-y-2 text-xs text-white/80">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-white/60"></div>
                              <span>Each role has specific permissions and access levels</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-white/60"></div>
                              <span>Teachers require controller assignment</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-white/60"></div>
                              <span>Admins have full system access</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Edit User Info Section */}
                    {editingUser && (
                      <div>Edit User Content</div>
                    )}

                    {/* Edit User Info Section */}
                    {editingUser && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              background: 'linear-gradient(135deg, ' + primaryColor + '20, ' + secondaryColor + '25)',
                            }}
                          >
                            <FiInfo className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="text-white font-semibold">User Information</h3>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <div className="flex items-center gap-4 mb-4">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                              style={{
                                background: 'linear-gradient(135deg, ' + primaryColor + ', ' + secondaryColor + ')',
                              }}
                            >
                              <span className="text-white font-bold text-lg">
                                {editingUser.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-white font-semibold text-base">
                                {editingUser.name}
                              </div>
                              <div className="text-white/70 text-sm">
                                {roleLabels[editingUser.role]}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                          <h4 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                            <FiActivity className="h-4 w-4" />
                            Quick Actions
                          </h4>
                          <div className="space-y-2">
                            <button className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm text-white/80 hover:text-white">
                              View user activity
                            </button>
                            <button className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm text-white/80 hover:text-white">
                              Reset password
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Help & Tips Section */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <h4 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                        <FiHeart className="h-4 w-4" />
                        Tips & Help
                      </h4>
                      <div className="space-y-2 text-xs text-white/80">
                        <div className="flex items-start gap-2">
                          <FiCheck className="h-3 w-3 text-white/60 mt-0.5 flex-shrink-0" />
                          <span>Use strong passwords for admin accounts</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <FiCheck className="h-3 w-3 text-white/60 mt-0.5 flex-shrink-0" />
                          <span>Assign controllers before creating teachers</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <FiCheck className="h-3 w-3 text-white/60 mt-0.5 flex-shrink-0" />
                          <span>Regular backup of user data recommended</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  {/* Header */}
                  <div
                    className="p-8 border-b border-gray-100 flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, ' + primaryColor + '05 0%, ' + secondaryColor + '03 100%)',
                    }}
                  >
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {editingUser
                        ? "Update User Information"
                        : "Create New User Account"}
                    </h1>
                    <p className="text-gray-600 text-lg">
                      {editingUser
                        ? "Modify user details and permissions below"
                        : "Fill in the details to create a new user account"}
                    </p>
                  </div>

                  {/* Form Content */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-8 pb-12">
                      <form
                        id="user-form"
                        onSubmit={handleFormSubmit}
                        className="space-y-8"
                      >
                        {/* Basic Information */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-3 mb-6">
                            <div
                              className="p-2 rounded-lg"
                              style={{
                                background: 'linear-gradient(135deg, ' + primaryColor + '10, ' + secondaryColor + '15)',
                              }}
                            >
                              <FiUser
                                className="h-5 w-5"
                                style={{ color: primaryColor }}
                              />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                              Basic Information
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">
                                Full Name *
                              </label>
                              <input
                                type="text"
                                name="name"
                                defaultValue={editingUser?.name}
                                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all duration-200 text-base"
                                style={{
                                  boxShadow: `0 0 0 2px ${primaryColor}40`,
                                }}
                                placeholder="Enter full name"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">
                                Username *
                              </label>
                              {(editingUser ? editingUser.role : newUserRole) ===
                              "teacher" ? (
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-4 rounded-xl border border-gray-200">
                                  <div className="flex items-center gap-2">
                                    <FiSettings className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-600 text-sm font-medium">
                                      Auto-generated after creation
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  name="username"
                                  defaultValue={editingUser?.username}
                                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all duration-200 text-base"
                                style={{
                                  boxShadow: `0 0 0 2px ${primaryColor}40`,
                                }}
                                  placeholder="Enter username"
                                  required
                                />
                              )}
                            </div>

                            {(editingUser ? editingUser.role : newUserRole) !==
                              "teacher" && (
                              <div className="lg:col-span-2 space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                  Password {editingUser ? "(Optional)" : "*"}
                                </label>
                                <input
                                  type="password"
                                  name="password"
                                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all duration-200 text-base"
                                style={{
                                  boxShadow: `0 0 0 2px ${primaryColor}40`,
                                }}
                                  placeholder={
                                    editingUser
                                      ? "Leave blank to keep current"
                                      : "Enter password"
                                  }
                                  required={!editingUser}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                  {/* Teacher Specific Fields */}
                  {(editingUser ? editingUser.role : newUserRole) ===
                    "teacher" && (
                    <>
                      {/* Controller Assignment */}
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}15)`,
                            }}
                          >
                            <FiUsers
                              className="h-5 w-5"
                              style={{ color: primaryColor }}
                            />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Controller Assignment
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Assigned Controller *
                            </label>
                            <select
                              name="controlId"
                              value={teacherControlId}
                              onChange={(e) =>
                                setTeacherControlId(e.target.value)
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900 transition-all"
                              style={{
                                '--tw-ring-color': primaryColor + '40',
                                borderColor: `var(--tw-ring-color)`,
                              } as React.CSSProperties}
                              required
                            >
                              <option value="">Select Controller</option>
                              {controllers
                                .filter(
                                  (ctrl) =>
                                    ctrl && ctrl.code && ctrl.code !== "0"
                                )
                                .map((ctrl) => (
                                  <option key={ctrl.id} value={ctrl.code}>
                                    {ctrl.name} ({ctrl.code})
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              value={teacherPhone}
                              onChange={(e) => setTeacherPhone(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900 transition-all"
                              style={{
                                '--tw-ring-color': primaryColor + '40',
                                borderColor: `var(--tw-ring-color)`,
                              } as React.CSSProperties}
                              placeholder="e.g. +251912345678"
                              required
                            />
                          </div>
                        </div>

                        {/* Auto-Generated Credentials Info */}
                        <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                              <FiSettings className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-blue-900">
                                Auto-Generated Credentials
                              </h4>
                              <p className="text-blue-700 text-sm">
                                Username and password will be generated
                                automatically
                              </p>
                            </div>
                          </div>
                          <div className="bg-blue-100 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-blue-800 flex items-center gap-2">
                              <FiInfo className="h-4 w-4" />
                              <strong>Format:</strong> Username: U1, U2, U3,
                              etc. (auto-incremented) | Password:
                              [Username][Name]
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Teaching Schedule */}
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}15)`,
                            }}
                          >
                            <FiCalendar
                              className="h-5 w-5"
                              style={{ color: primaryColor }}
                            />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              Teaching Schedule
                            </h3>
                            <span className="text-sm text-gray-500">
                              Configure available time slots
                            </span>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                          <ScheduleGenerator
                            value={teacherSchedule}
                            onChange={setTeacherSchedule}
                            primaryColor={primaryColor}
                            secondaryColor={secondaryColor}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </form>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm p-8">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FiAlertCircle className="h-4 w-4" />
                              <span>* Required fields</span>
                            </div>
                            <div className="flex gap-4">
                              <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-white hover:border-gray-300 transition-all duration-200 font-medium"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                form="user-form"
                                className="px-8 py-3 text-white rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl"
                                style={{
                                  background: 'linear-gradient(135deg, ' + primaryColor + ', ' + secondaryColor + ')',
                                }}
                              >
                                <FiUserPlus className="h-5 w-5" />
                                {editingUser ? "Update" : "Create"} User
                              </button>
                            </div>
                          </div>
                        </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Modern Generated Credentials Modal */}
        <Modal
          isOpen={showCredentials}
          onClose={() => {
            setShowCredentials(false);
            setIsModalOpen(false);
            fetchUsers();
            resetForm();
          }}
        >
          <div className="bg-white rounded-2xl p-8 max-w-lg mx-auto shadow-2xl border border-gray-100/50">
            <div className="text-center mb-8">
              <div className="p-4 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl w-fit mx-auto mb-6 shadow-lg">
                <FiCheck className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Teacher Created Successfully!
              </h2>
              <p className="text-gray-600 text-lg">
                Here are the auto-generated credentials:
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiUser className="h-5 w-5 text-blue-600" />
                  </div>
                  <label className="text-lg font-bold text-blue-900">
                    Username
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={generatedUsername}
                    readOnly
                    className="flex-1 px-4 py-3 bg-white border border-blue-200 rounded-xl font-mono font-bold text-lg shadow-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedUsername)}
                    className="px-4 py-3 text-white rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }}
                  >
                    <FiCopy className="h-5 w-5" />
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiShield className="h-5 w-5 text-purple-600" />
                  </div>
                  <label className="text-lg font-bold text-purple-900">
                    Password
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={generatedPassword}
                    readOnly
                    className="flex-1 px-4 py-3 bg-white border border-purple-200 rounded-xl font-mono font-bold text-lg shadow-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedPassword)}
                    className="px-4 py-3 text-white rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`,
                    }}
                  >
                    <FiCopy className="h-5 w-5" />
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 shadow-sm">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-yellow-900 mb-1">Important</h4>
                  <p className="text-sm text-yellow-800">
                    Please copy and share these credentials with the teacher. They cannot be retrieved later.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowCredentials(false);
                setIsModalOpen(false);
                fetchUsers();
                resetForm();
              }}
              className="w-full mt-8 px-6 py-4 text-white rounded-xl transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
            >
              Done
            </button>
          </div>
        </Modal>

        {/* Confirm Delete Modal */}
        <ConfirmModal
          open={isConfirmModalOpen}
          title="Confirm Deletion"
          message={`Are you sure you want to delete ${deletingUser?.name}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setIsConfirmModalOpen(false)}
        />
      </div>
    </div>
  );
}
