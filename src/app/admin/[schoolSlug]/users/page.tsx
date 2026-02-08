"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
} from "react-icons/fi";
import Modal from "@/app/components/Modal";
import ConfirmModal from "@/app/components/ConfirmModal";
import { useDebounce } from "use-debounce";

// Schedule Generator Component
const ScheduleGenerator = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
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
      <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FiCalendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Manual Time Entry</h3>
            <p className="text-sm text-gray-600">Enter times manually or select from prayer slots below</p>
          </div>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Example: 6:00 AM, 2:30 PM, 8:00 PM"
          className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm transition-all duration-200 text-base"
        />
      </div>

      {/* Select All / Deselect All Buttons */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={selectAllTimes}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-4 rounded-xl font-bold transition-all hover:scale-105 hover:shadow-lg flex items-center justify-center gap-3"
          >
            <FiCheck className="h-5 w-5" />
            Select All Prayer Time Slots
          </button>
          <button
            type="button"
            onClick={deselectAllTimes}
            className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 px-6 py-4 rounded-xl font-bold transition-all hover:scale-105 hover:shadow-lg flex items-center justify-center gap-3"
          >
            <FiX className="h-5 w-5" />
            Clear All Selections
          </button>
        </div>
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
                className={`p-6 rounded-2xl border-2 ${
                  prayerColors[prayer as keyof typeof prayerColors]
                } shadow-sm hover:shadow-md transition-all duration-200`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg"></div>
                    <div>
                      <h4 className="font-bold text-xl text-gray-800">
                        {prayer} Period
                      </h4>
                      <p className="text-sm text-gray-600 font-medium">
                        {prayerPeriods[prayer as keyof typeof prayerPeriods]}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectPrayerPeriod(prayer)}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-xl transition-all hover:scale-105 hover:shadow-lg flex items-center gap-2 self-start sm:self-center"
                    title={`Select all ${prayer} time slots`}
                  >
                    <FiCheck className="h-4 w-4" />
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {prayerSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleTime(slot.time)}
                      className={`p-3 text-sm rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                        selectedTimes.includes(slot.time12)
                          ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-600 shadow-xl transform scale-105"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-700"
                      }`}
                    >
                      <div className="font-bold text-base mb-1">{slot.time12}</div>
                      <div className="text-xs opacity-80 font-medium">{slot.time}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          }
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiInfo className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 mb-1">How to Use</h4>
            <p className="text-sm text-blue-800 leading-relaxed">
              Select from prayer-based time slots with 30-minute intervals. Times are shown in both 12-hour (AM/PM) and 24-hour formats.
              You can manually enter times above or use the prayer period buttons to quickly select entire time ranges.
            </p>
          </div>
        </div>
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
  createdAt?: string;
}

const RoleBadge = ({ role }: { role: UserRole }) => {
  const roleStyles: Record<UserRole, string> = {
    admin: "bg-purple-100 text-purple-800",
    controller: "bg-blue-100 text-blue-800",
    teacher: "bg-green-100 text-green-800",
    registral: "bg-orange-100 text-orange-800",
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

// Utility function to apply school branding colors
const getBrandedColor = (color: string, fallback: string, schoolBranding: any) => {
  if (color === 'primary' && schoolBranding.primaryColor) {
    return schoolBranding.primaryColor;
  }
  if (color === 'secondary' && schoolBranding.secondaryColor) {
    return schoolBranding.secondaryColor;
  }
  return fallback;
};

export default function UserManagementPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([] as User[]);
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
  const [controllers, setControllers] = useState<User[]>([] as User[]);
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
  const [schoolBranding, setSchoolBranding] = useState<{
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    name?: string;
  }>({});

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
      setUsers(data.users || []);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchQuery, roleFilter]);

  useEffect(() => {
    fetchUsers();
    fetchTotalCounts();
    fetchSchoolBranding();
  }, [fetchUsers]);

  const fetchTotalCounts = async () => {
    try {
      const res = await fetch(`/api/admin/${schoolSlug}/users/counts`);
      if (!res.ok) throw new Error("Failed to fetch counts");
      const data = await res.json();
      setTotalCounts(data.counts || {
        admin: 0,
        controller: 0,
        teacher: 0,
        registral: 0,
      });
      setTotalUsers(data.total || 0);
    } catch (err: any) {
      console.error("Error fetching counts:", err);
    }
  };

  const fetchSchoolBranding = async () => {
    try {
      const res = await fetch(`/api/admin/${schoolSlug}/branding`);
      if (!res.ok) throw new Error("Failed to fetch branding");
      const data = await res.json();
      setSchoolBranding(data.branding || {});
    } catch (err: any) {
      console.error("Error fetching branding:", err);
    }
  };

  const fetchControllers = async () => {
    if (status !== "authenticated") {
      console.log("Waiting for authentication before fetching controllers");
      return;
    }

    try {
      console.log("Fetching controllers for authenticated user");
      const res = await fetch(`/api/admin/${schoolSlug}/users?role=controller&limit=100`);
      if (!res.ok) {
        console.error(`Failed to fetch controllers: ${res.status} ${res.statusText}`);
        if (res.status === 401) {
          console.error("Authentication failed for fetching controllers");
          setError("Authentication required. Please log in again.");
        } else if (res.status === 403) {
          console.error("Access denied to this school's controllers");
          setError("You don't have access to manage users for this school.");
        }
        throw new Error(`Failed to fetch controllers: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      console.log("Controllers loaded:", data.users?.length || 0);
      setControllers(data.users || []);
    } catch (err: any) {
      console.error("Error fetching controllers:", err);
      setError("Failed to load controllers. Please refresh the page.");
    }
  };

  useEffect(() => {
    if (schoolSlug && status === "authenticated") {
      fetchControllers();
    }
  }, [schoolSlug, status]);

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

    console.log('Sending user creation request:', { method, payload });

    try {
      const res = await fetch(`/api/admin/${schoolSlug}/users`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log('API response status:', res.status);

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
    acc[role] = (users || []).filter((user) => user.role === role);
    return acc;
  }, {} as Record<UserRole, User[]>);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${getBrandedColor('primary', '#f9fafb', schoolBranding)} 0%, ${getBrandedColor('secondary', '#f3f4f6', schoolBranding)} 100%)`
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center border border-gray-100/50">
          <div className="relative mb-8">
            <div
              className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 mx-auto"
              style={{
                borderTopColor: getBrandedColor('primary', '#2563eb', schoolBranding)
              }}
            ></div>
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent animate-spin mx-auto"
              style={{
                animationDirection: 'reverse',
                animationDuration: '1.5s',
                borderTopColor: getBrandedColor('secondary', '#7c3aed', schoolBranding)
              }}
            ></div>
            {/* School Logo in center if available */}
            {schoolBranding.logoUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={schoolBranding.logoUrl}
                  alt="Loading..."
                  className="w-8 h-8 rounded-lg opacity-20"
                />
              </div>
            )}
          </div>
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: getBrandedColor('primary', '#111827', schoolBranding) }}
          >
            Loading Users
          </h2>
          <p
            className="text-lg"
            style={{ color: `${getBrandedColor('primary', '#6b7280', schoolBranding)}cc` }}
          >
            {schoolBranding.name ? `Loading ${schoolBranding.name} user data` : 'Please wait while we fetch the data'}
          </p>
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              <div
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: getBrandedColor('primary', '#2563eb', schoolBranding) }}
              ></div>
              <div
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ animationDelay: '0.1s', backgroundColor: getBrandedColor('secondary', '#7c3aed', schoolBranding) }}
              ></div>
              <div
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ animationDelay: '0.2s', backgroundColor: getBrandedColor('primary', '#06b6d4', schoolBranding) }}
              ></div>
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
        background: `linear-gradient(135deg, ${getBrandedColor('primary', '#f9fafb', schoolBranding)} 0%, ${getBrandedColor('secondary', '#f3f4f6', schoolBranding)}20 50%, ${getBrandedColor('primary', '#f9fafb', schoolBranding)} 100%)`
      }}
    >
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Modern Header with School Branding */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100/50 p-8 lg:p-10 backdrop-blur-sm">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              background: `linear-gradient(135deg, ${getBrandedColor('primary', '#667eea', schoolBranding)} 0%, ${getBrandedColor('secondary', '#764ba2', schoolBranding)} 100%)`
            }}></div>
          </div>

          <div className="relative flex flex-col lg:flex-row lg:items-center gap-8 mb-8">
            <div className="flex items-center gap-6">
              {/* School Logo or Default Icon */}
              {schoolBranding.logoUrl ? (
                <div className="p-1 bg-white rounded-2xl shadow-lg border-4 border-white">
                  <img
                    src={schoolBranding.logoUrl}
                    alt={`${schoolBranding.name} Logo`}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                </div>
              ) : (
                <div
                  className="p-4 rounded-2xl shadow-lg border-4 border-white"
                  style={{
                    background: `linear-gradient(135deg, ${getBrandedColor('primary', '#1f2937', schoolBranding)}, ${getBrandedColor('secondary', '#374151', schoolBranding)})`
                  }}
                >
                  <FiUsers className="h-8 w-8 text-white" />
                </div>
              )}
              <div>
                <h1
                  className="text-4xl lg:text-5xl font-bold mb-2"
                  style={{
                    background: `linear-gradient(135deg, ${getBrandedColor('primary', '#1f2937', schoolBranding)}, ${getBrandedColor('secondary', '#374151', schoolBranding)})`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  User Management
                </h1>
                <p className="text-gray-600 text-lg lg:text-xl font-medium">
                  {schoolBranding.name ? `${schoolBranding.name} - ` : ''}Manage system users, roles, and permissions
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Controls with Branding */}
          <div
            className="rounded-2xl p-8 border border-gray-100/50 shadow-lg backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, ${getBrandedColor('primary', '#f9fafb', schoolBranding)}10 0%, ${getBrandedColor('secondary', '#f3f4f6', schoolBranding)}10 100%)`
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              <div className="lg:col-span-4">
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: `${getBrandedColor('primary', '#6b7280', schoolBranding)}20` }}
                  >
                    <FiSearch
                      className="h-4 w-4"
                      style={{ color: getBrandedColor('primary', '#374151', schoolBranding) }}
                    />
                  </div>
                  <span style={{ color: getBrandedColor('primary', '#111827', schoolBranding) }}>
                    Search Users
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 bg-white text-gray-900 shadow-sm transition-all duration-200 text-base hover:shadow-md"
                  style={{
                    borderColor: `${getBrandedColor('primary', '#d1d5db', schoolBranding)}50`,
                    focusRingColor: getBrandedColor('primary', '#000000', schoolBranding)
                  }}
                />
              </div>
              <div className="lg:col-span-4">
                <label className="block text-sm font-bold mb-3 flex items-center gap-2">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: `${getBrandedColor('secondary', '#6b7280', schoolBranding)}20` }}
                  >
                    <FiFilter
                      className="h-4 w-4"
                      style={{ color: getBrandedColor('secondary', '#374151', schoolBranding) }}
                    />
                  </div>
                  <span style={{ color: getBrandedColor('secondary', '#111827', schoolBranding) }}>
                    Filter by Role
                  </span>
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 bg-white text-gray-900 shadow-sm transition-all duration-200 text-base hover:shadow-md"
                  style={{
                    borderColor: `${getBrandedColor('secondary', '#d1d5db', schoolBranding)}50`,
                    focusRingColor: getBrandedColor('secondary', '#000000', schoolBranding)
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
                    className="flex-1 px-4 py-4 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    style={{
                      backgroundColor: '#f3f4f6',
                      color: '#374151'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  >
                    <FiRefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                  <button
                    onClick={openCreateModal}
                    className="flex-1 px-4 py-4 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-white"
                    style={{
                      background: `linear-gradient(135deg, ${getBrandedColor('primary', '#000000', schoolBranding)}, ${getBrandedColor('secondary', '#1f2937', schoolBranding)})`
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

            // Dynamic role colors based on school branding
            const roleColors = {
              admin: {
                bg: getBrandedColor('primary', '#fef3c7', schoolBranding),
                border: getBrandedColor('primary', '#f59e0b', schoolBranding),
                icon: getBrandedColor('primary', '#d97706', schoolBranding),
                text: getBrandedColor('primary', '#92400e', schoolBranding)
              },
              controller: {
                bg: getBrandedColor('secondary', '#dbeafe', schoolBranding),
                border: getBrandedColor('secondary', '#3b82f6', schoolBranding),
                icon: getBrandedColor('secondary', '#2563eb', schoolBranding),
                text: getBrandedColor('secondary', '#1e40af', schoolBranding)
              },
              teacher: {
                bg: '#f0fdf4',
                border: '#22c55e',
                icon: '#16a34a',
                text: '#15803d'
              },
              registral: {
                bg: '#fef3c7',
                border: '#f59e0b',
                icon: '#d97706',
                text: '#92400e'
              }
            };

            return (
              <div
                key={role}
                className="bg-white rounded-2xl shadow-lg border overflow-hidden backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
                style={{
                  borderColor: `${roleColors[role].border}30`,
                  boxShadow: `0 10px 25px -5px ${roleColors[role].border}20`
                }}
              >
                <div
                  className="cursor-pointer transition-all duration-300 group"
                  style={{
                    background: `linear-gradient(135deg, ${roleColors[role].bg} 0%, rgba(255,255,255,0.9) 100%)`,
                    borderBottom: `1px solid ${roleColors[role].border}20`
                  }}
                  onClick={() => toggleRoleExpansion(role)}
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div
                          className="p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${roleColors[role].icon}, ${roleColors[role].text})`
                          }}
                        >
                          <RoleIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2
                            className="text-2xl font-bold transition-colors group-hover:scale-105"
                            style={{
                              color: roleColors[role].text,
                              textShadow: `0 1px 2px ${roleColors[role].border}20`
                            }}
                          >
                            {roleLabels[role]}
                          </h2>
                          <p
                            className="font-medium"
                            style={{ color: `${roleColors[role].text}cc` }}
                          >
                            {roleUsers.length} users
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <RoleBadge role={role} />
                        <div
                          className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                          style={{
                            backgroundColor: `${roleColors[role].icon}15`,
                            color: roleColors[role].icon
                          }}
                        >
                          {expandedRoles[role] ? (
                            <FiChevronDown className="h-6 w-6" />
                          ) : (
                            <FiChevronRightIcon className="h-6 w-6" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {expandedRoles[role] && (
                  <div className="p-6">
                    {roleUsers.length === 0 ? (
                      <div className="text-center py-20 px-6">
                        <div className="relative mb-10">
                          <div className="p-10 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 rounded-3xl w-fit mx-auto shadow-2xl">
                            <RoleIcon className="h-20 w-20 text-gray-600" />
                          </div>
                          <div className="absolute -top-3 -right-3 p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg">
                            <FiInfo className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <h3 className="text-4xl font-bold text-gray-900 mb-6">
                          No {roleLabels[role]} Yet
                        </h3>
                        <p className="text-gray-600 text-xl font-medium mb-4">
                          No users found with this role.
                        </p>
                        <p className="text-gray-500 text-base mb-8">
                          Click "Add User" to create the first one and get started
                        </p>
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all hover:scale-105 hover:shadow-xl">
                          <FiUserPlus className="h-5 w-5" />
                          Create First {roleLabels[role].slice(0, -1)}
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full text-sm divide-y divide-gray-200">
                          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                              <th className="px-6 py-5 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                                User
                              </th>
                              <th className="px-6 py-5 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                                Details
                              </th>
                              {role === "teacher" && (
                                <>
                                  <th className="px-6 py-5 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                                    Controller
                                  </th>
                                  <th className="px-6 py-5 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                                    Schedule
                                  </th>
                                </>
                              )}
                              <th className="px-6 py-5 text-right text-sm font-bold text-gray-900 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {roleUsers.map((user, index) => (
                              <tr
                                key={user.id}
                                className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200 group"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                                      <span className="text-white font-bold">
                                        {user.name
                                          ? user.name.charAt(0).toUpperCase()
                                          : "?"}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="font-bold text-black">
                                        {user.name || "Unknown User"}
                                      </div>
                                      {user.username && (
                                        <div className="text-sm text-gray-500">
                                          @{user.username}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-1">
                                    {user.phone && (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FiPhone className="h-4 w-4" />
                                        <span>{user.phone}</span>
                                        <button
                                          onClick={() =>
                                            copyToClipboard(user.phone!)
                                          }
                                          className="p-1 hover:bg-gray-200 rounded"
                                          title="Copy phone"
                                        >
                                          <FiCopy className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                    {user.code && (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                          #{user.code}
                                        </span>
                                        <button
                                          onClick={() =>
                                            copyToClipboard(user.code!)
                                          }
                                          className="p-1 hover:bg-gray-200 rounded"
                                          title="Copy code"
                                        >
                                          <FiCopy className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                {role === "teacher" && (
                                  <>
                                    <td className="px-6 py-4">
                                      <div className="text-gray-700">
                                        {user.controlId
                                          ? controllers.find(
                                              (c) =>
                                                c && c.id === user.controlId
                                            )?.name || "Unknown"
                                          : "Not assigned"}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div
                                        className="text-gray-700 max-w-xs truncate"
                                        title={user.schedule}
                                      >
                                        {user.schedule || "No schedule"}
                                      </div>
                                    </td>
                                  </>
                                )}
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <button
                                      onClick={() => openEditModal(user)}
                                      className="p-3 border-2 border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-400 transition-all hover:scale-110 hover:shadow-lg group"
                                      title="Edit user"
                                    >
                                      <FiEdit className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                    </button>
                                    <button
                                      onClick={() => openDeleteModal(user)}
                                      className="p-3 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-400 transition-all hover:scale-110 hover:shadow-lg group"
                                      title="Delete user"
                                    >
                                      <FiTrash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
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
                  className="p-4 border border-gray-200 rounded-xl bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <FiChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-4 border border-gray-200 rounded-xl bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <FiChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modern Side Drawer Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className={`absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity duration-500 ${
                isModalOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setIsModalOpen(false)}
            />

            {/* Drawer */}
            <div
              className={`relative ml-auto h-full w-full max-w-5xl bg-white shadow-2xl transform transition-transform duration-500 ease-out overflow-hidden ${
                isModalOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="flex h-full">
                {/* Left Sidebar */}
                <div className="w-80 bg-gradient-to-b from-slate-900 via-gray-900 to-black p-6 flex flex-col border-r border-gray-200/20">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                        <FiUserPlus className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          {editingUser ? "Edit User" : "New User"}
                        </h2>
                        <p className="text-sm text-white/70 mt-1">
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

                  {/* Role Selection Sidebar */}
                  {!editingUser && (
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                        <FiShield className="h-4 w-4" />
                        Select Role
                      </h3>
                      <div className="space-y-3">
                        {roleOrder.map((role) => {
                          const RoleIcon = roleIcons[role];
                          return (
                            <label
                              key={role}
                              className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 ${
                                newUserRole === role
                                  ? "bg-white text-gray-900 shadow-lg"
                                  : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
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
                              <div className={`p-2 rounded-lg ${
                                newUserRole === role ? "bg-gray-100" : "bg-white/20"
                              }`}>
                                <RoleIcon className="h-4 w-4" />
                              </div>
                              <span className="font-medium flex-1">
                                {roleLabels[role]}
                              </span>
                              {newUserRole === role && (
                                <FiCheck className="h-5 w-5" />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Edit User Info for Editing Mode */}
                  {editingUser && (
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                        <FiInfo className="h-4 w-4" />
                        User Info
                      </h3>
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                            <span className="text-gray-900 font-bold">
                              {editingUser.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-white font-semibold">
                              {editingUser.name}
                            </div>
                            <div className="text-white/70 text-sm">
                              {roleLabels[editingUser.role]}
                            </div>
                          </div>
                        </div>
                        {editingUser.username && (
                          <div className="text-white/70 text-sm">
                            @{editingUser.username}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Enhanced Header with Branding */}
                  <div
                    className="p-10 border-b bg-gradient-to-r"
                    style={{
                      background: `linear-gradient(135deg, ${getBrandedColor('primary', '#eff6ff', schoolBranding)} 0%, ${getBrandedColor('secondary', '#e0e7ff', schoolBranding)} 100%)`,
                      borderBottomColor: `${getBrandedColor('primary', '#e5e7eb', schoolBranding)}50`
                    }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className="p-3 rounded-2xl shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${getBrandedColor('primary', '#2563eb', schoolBranding)}, ${getBrandedColor('secondary', '#7c3aed', schoolBranding)})`
                        }}
                      >
                        <FiUserPlus className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h1
                          className="text-4xl font-bold mb-2"
                          style={{
                            background: `linear-gradient(135deg, ${getBrandedColor('primary', '#1f2937', schoolBranding)}, ${getBrandedColor('secondary', '#374151', schoolBranding)})`,
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}
                        >
                          {editingUser
                            ? "Update User Information"
                            : "Create New User Account"}
                        </h1>
                        <p
                          className="text-xl font-medium"
                          style={{ color: `${getBrandedColor('primary', '#4b5563', schoolBranding)}dd` }}
                        >
                          {editingUser
                            ? "Modify user details and permissions below"
                            : "Fill in the details to create a new user account"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form Content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-8">
                      <form
                        id="user-form"
                        onSubmit={handleFormSubmit}
                        className="space-y-8"
                      >
                        {/* Basic Information */}
                        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-3xl p-10 border border-gray-200 shadow-lg">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                              <FiUser className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900">
                                Basic Information
                              </h3>
                              <p className="text-gray-600 font-medium">Enter the user's personal details</p>
                            </div>
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
                                className="w-full px-6 py-5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-base font-medium shadow-sm hover:shadow-md"
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
                                  className="w-full px-6 py-5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-base font-medium shadow-sm hover:shadow-md"
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
                                  className="w-full px-6 py-5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-base font-medium shadow-sm hover:shadow-md"
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
                      <div className="bg-gradient-to-br from-white to-green-50/30 rounded-3xl p-8 border border-green-200 shadow-lg">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg">
                            <FiUsers className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                              Controller Assignment
                            </h3>
                            <p className="text-gray-600 font-medium">Assign a controller to supervise this teacher</p>
                          </div>
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
                              className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 transition-all font-medium shadow-sm hover:shadow-md"
                              required
                            >
                              <option value="">Select Controller</option>
                              {(controllers || [])
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
                              className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 transition-all font-medium shadow-sm hover:shadow-md"
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
                      <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-3xl p-8 border border-purple-200 shadow-lg">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                            <FiCalendar className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                              Teaching Schedule
                            </h3>
                            <p className="text-gray-600 font-medium">Configure available time slots for this teacher</p>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-purple-50/50 rounded-2xl p-8 border border-purple-200 shadow-inner">
                          <ScheduleGenerator
                            value={teacherSchedule}
                            onChange={setTeacherSchedule}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </form>
              </div>

                        {/* Footer Actions */}
                        <div className="p-8 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm">
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
                                className="px-8 py-3 text-white rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                                style={{
                                  background: `linear-gradient(135deg, ${getBrandedColor('primary', '#2563eb', schoolBranding)}, ${getBrandedColor('secondary', '#7c3aed', schoolBranding)})`
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
        </Modal>

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
              <div
                className="p-4 rounded-2xl w-fit mx-auto mb-6 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${getBrandedColor('primary', '#10b981', schoolBranding)}, ${getBrandedColor('secondary', '#059669', schoolBranding)})`
                }}
              >
                <FiCheck className="h-8 w-8 text-white" />
              </div>
              <h2
                className="text-3xl font-bold mb-3"
                style={{ color: getBrandedColor('primary', '#111827', schoolBranding) }}
              >
                {newUserRole === 'teacher' ? 'Teacher' : 'User'} Created Successfully!
              </h2>
              <p
                className="text-lg"
                style={{ color: `${getBrandedColor('primary', '#6b7280', schoolBranding)}cc` }}
              >
                {newUserRole === 'teacher' ? 'Here are the auto-generated credentials:' : 'User account has been created successfully.'}
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
                    className="px-4 py-3 text-white rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${getBrandedColor('primary', '#2563eb', schoolBranding)}, ${getBrandedColor('secondary', '#1d4ed8', schoolBranding)})`
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
                    className="px-4 py-3 text-white rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${getBrandedColor('secondary', '#7c3aed', schoolBranding)}, ${getBrandedColor('primary', '#6d28d9', schoolBranding)})`
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
              className="w-full mt-8 px-6 py-4 text-white rounded-xl transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${getBrandedColor('primary', '#10b981', schoolBranding)}, ${getBrandedColor('secondary', '#059669', schoolBranding)})`
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
