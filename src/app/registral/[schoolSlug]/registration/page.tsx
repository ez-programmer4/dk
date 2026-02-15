"use client";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiInfo,
  FiUser,
  FiPhone,
  FiCalendar,
  FiDollarSign,
  FiGlobe,
  FiBook,
  FiTag,
  FiBookOpen,
  FiFlag,
  FiUserCheck,
  FiStar,
  FiClock,
  FiRefreshCw,
  FiSettings,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import { useSession } from "next-auth/react";
import { TimePicker } from "@/components/ui/TimePicker";
import {
  to24Hour,
  validateTime,
  fromDbFormat,
  getPrayerRanges,
} from "@/utils/timeUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBranding } from "../layout";

interface FormData {
  fullName?: string;
  phoneNumber?: string;
  parentPhone?: string;
  classfee?: number;
  classfeeCurrency?: string;
  startdate?: string;
  registrationdate?: string;
  status?: string;
  subject?: string | string[];
  country?: string;
  rigistral?: string;
  daypackages?: string;
  package?: string;
  refer?: string;
  chatId?: string;
  reason?: string;
  subscriptionPackageConfigId?: number;
}

interface TimeSlot {
  id: number;
  time: string;
  category: string;
}

interface Teacher {
  ustazid: string;
  ustazname: string;
  control?: { code: string }; // Made optional
  schedule?: string; // Added schedule field
}

interface TimeSlotResponse {
  timeSlots: TimeSlot[];
}

interface TeacherResponse {
  teachers: Teacher[];
}

interface Country {
  name: { common: string };
}

const convertTo12Hour = (time: string): string => {
  try {
    if (time.includes("AM") || time.includes("PM")) {
      return time.trim();
    }
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(time)) {
      throw new Error(
        `Invalid time format: ${time}. Expected HH:MM or HH:MM:SS`
      );
    }
    const [hour, minute] = time
      .split(":")
      .map((part) => parseInt(part.trim(), 10));

    // Fix: Determine AM/PM first, then adjust hour
    const period = hour >= 12 ? "PM" : "AM";
    let adjustedHour = hour;

    // Convert 24-hour to 12-hour format
    if (hour === 0) {
      adjustedHour = 12; // 00:xx becomes 12:xx AM
    } else if (hour > 12) {
      adjustedHour = hour - 12; // 13:xx becomes 1:xx PM, 14:xx becomes 2:xx PM, etc.
    }
    // hour 12 stays as 12 PM, hours 1-11 stay the same

    return `${adjustedHour}:${minute.toString().padStart(2, "0")} ${period}`;
  } catch (error) {
    return "Invalid Time";
  }
};

function RegistrationContent() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const branding = useBranding();
  const logoUrl = branding?.logoUrl;
  const searchParams = useSearchParams();
  const editId = searchParams.get("id") || searchParams.get("studentId");
  const isEditMode = searchParams.get("edit") === "true" || !!editId;
  const initialStep = parseInt(searchParams.get("step") || "1", 10);
  const [editTimeTeacher, setEditTimeTeacher] = useState(false);
  const { data: session, status } = useSession();

  // Use branding colors and info
  const primaryColor = branding?.primaryColor || "#0f766e";
  const secondaryColor = branding?.secondaryColor || "#06b6d4";
  const schoolName = branding?.name || "Quran Academy";
  const supportEmail = branding?.supportEmail || "support@quranacademy.com";

  const [step, setStep] = useState<number>(
    isEditMode ? 3 : Math.min(Math.max(initialStep, 1), 3)
  );

  // Debug current step
  useEffect(() => {}, [step]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedTeacherSchedule, setSelectedTeacherSchedule] =
    useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
    clearErrors,
  } = useForm<FormData>({
    defaultValues: {
      daypackages: "All days",
      package: "",
      status: "On Progress",
      classfeeCurrency: "ETB",
    },
  });

  const selectedDayPackage = watch("daypackages");
  const selectedCurrency = watch("classfeeCurrency");

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]); // Ensure initialized as empty array
  const [dayPackages, setDayPackages] = useState<string[]>([
    "All days",
    "MWF",
    "TTS",
  ]); // Default fallback
  const [loadingDayPackages, setLoadingDayPackages] = useState<boolean>(false);
  const currencyOptions = ["ETB", "USD", "EUR", "GBP", "SAR", "AED", "CAD"];
  const currencySymbols: Record<string, string> = {
    ETB: "ETB",
    USD: "$",
    EUR: "€",
    GBP: "£",
    SAR: "SAR",
    AED: "AED",
    CAD: "$",
  };

  const [error, setError] = useState<string | null>(null);
  const [editingTeacherName, setEditingTeacherName] = useState<string>("");

  const [availableTimeSlots, setAvailableTimeSlots] = useState<{
    [time: string]: boolean;
  }>({});

  const [occupiedTimes, setOccupiedTimes] = useState<any[]>([]);
  const [teacherAvailability, setTeacherAvailability] = useState<{
    [ustazId: string]: boolean;
  }>({});
  const [loadingAvailability, setLoadingAvailability] =
    useState<boolean>(false);
  const availabilityCheckRef = useRef<string | null>(null);

  // Add state for controllers
  const [controllers, setControllers] = useState<
    { username: string; name: string; code: string }[]
  >([]);
  const [loadingControllers, setLoadingControllers] = useState(false);
  const [controllersError, setControllersError] = useState<string | null>(null);

  // Dynamic student configurations
  const [studentConfigs, setStudentConfigs] = useState<{
    statuses: string[];
    packages: string[];
    subjects: string[];
  }>({ statuses: [], packages: [], subjects: [] });
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  // Subscription package configs
  const [subscriptionConfigs, setSubscriptionConfigs] = useState<
    Array<{ id: number; name: string; description: string | null }>
  >([]);
  const [loadingSubscriptionConfigs, setLoadingSubscriptionConfigs] =
    useState(false);

  // --- ENHANCEMENT: Confirmation modal for unsaved changes ---
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<
    null | (() => void)
  >(null);
  const [formTouched, setFormTouched] = useState(false);

  // Mark form as touched on any change
  useEffect(() => {
    if (!formTouched) {
      const handler = () => setFormTouched(true);
      window.addEventListener("input", handler, true);
      return () => window.removeEventListener("input", handler, true);
    }
  }, [formTouched]);

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (formTouched) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [formTouched]);

  const handleNavigateAway = (cb: () => void) => {
    if (formTouched) {
      setShowLeaveConfirm(true);
      setPendingNavigation(() => cb);
    } else {
      cb();
    }
  };

  const confirmLeave = () => {
    setShowLeaveConfirm(false);
    setFormTouched(false);
    if (pendingNavigation) pendingNavigation();
  };
  const cancelLeave = () => {
    setShowLeaveConfirm(false);
    setPendingNavigation(null);
  };

  // --- ENHANCEMENT: ARIA live region for error/success messages ---
  const [ariaMessage, setAriaMessage] = useState("");
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setAriaMessage(
        "There are errors in the form. Please review and correct them."
      );
    }
  }, [errors]);

  // 🆕 Fetch dynamic daypackages from database
  useEffect(() => {
    const fetchDayPackages = async () => {
      setLoadingDayPackages(true);
      try {
        const res = await fetch(`/api/day-packages?schoolSlug=${schoolSlug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.dayPackages && data.dayPackages.length > 0) {
            setDayPackages(data.dayPackages);
          }
          // If no daypackages, keep default fallback
        }
      } catch (error) {
        console.error("Error fetching day packages:", error);
        // Keep default fallback on error
      } finally {
        setLoadingDayPackages(false);
      }
    };
    fetchDayPackages();
  }, []);

  // Fetch dynamic student configurations
  useEffect(() => {
    const fetchConfigurations = async () => {
      setLoadingConfigs(true);
      try {
        const res = await fetch(
          `/api/student-configs?schoolSlug=${schoolSlug}`
        );
        if (res.ok) {
          const data = await res.json();
          setStudentConfigs({
            statuses: data.statuses?.map((s: any) => s.name) || [
              "Active",
              "Not yet",
              "Leave",
              "Completed",
              "On Progress",
            ],
            packages: data.packages?.map((p: any) => p.name) || [
              "0 Fee",
              "3 days",
              "5 days",
              "Europe",
            ],
            subjects: data.subjects?.map((s: any) => s.name) || [],
          });
        } else {
          // Fallback to defaults
          setStudentConfigs({
            statuses: [
              "Active",
              "Not yet",
              "Leave",
              "Completed",
              "On Progress",
            ],
            packages: ["0 Fee", "3 days", "5 days", "Europe"],
            subjects: [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch student configurations:", error);
        // Fallback to defaults
        setStudentConfigs({
          statuses: ["Active", "Not yet", "Leave", "Completed", "On Progress"],
          packages: ["0 Fee", "3 days", "5 days", "Europe"],
          subjects: [],
        });
      } finally {
        setLoadingConfigs(false);
      }
    };

    fetchConfigurations();
  }, []);

  // Normalize status value to match dropdown options after configs are loaded
  useEffect(() => {
    if (!editId || loadingConfigs) return;

    const currentStatusValue = watch("status");
    if (currentStatusValue) {
      // Normalize function
      const normalizeStatus = (status: string) => {
        if (!status) return null;
        return status.trim().replace(/\s+/g, " ");
      };

      const normalized = normalizeStatus(currentStatusValue);

      // Try to find exact match first
      const allAvailableStatuses = [
        ...studentConfigs.statuses,
        "Not yet",
        "On Progress",
        "Active",
        "Not succeed",
        "Leave",
      ];

      // Find exact match first
      let matchedStatus = allAvailableStatuses.find(
        (s) => normalizeStatus(s) === normalized
      );

      // If no exact match, try case-insensitive
      if (!matchedStatus) {
        matchedStatus = allAvailableStatuses.find(
          (s) => normalizeStatus(s)?.toLowerCase() === normalized?.toLowerCase()
        );
      }

      // If match found, use the exact value from the list to ensure dropdown selection works
      if (matchedStatus && normalizeStatus(matchedStatus) !== normalized) {
        setValue(
          "status",
          normalizeStatus(matchedStatus) || currentStatusValue
        );
      } else if (normalized && normalized !== currentStatusValue) {
        // Normalize the current value
        setValue("status", normalized);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingConfigs, editId, studentConfigs.statuses]);

  // Fetch subscription package configs (for registrars and admins)
  useEffect(() => {
    const fetchSubscriptionConfigs = async () => {
      // Only fetch if user is registral, admin, or controller
      if (
        session?.user?.role !== "registral" &&
        session?.user?.role !== "admin" &&
        session?.user?.role !== "controller"
      ) {
        return;
      }

      setLoadingSubscriptionConfigs(true);
      try {
        const res = await fetch(
          `/api/admin/${schoolSlug}/subscription-package-configs`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.configs) {
            // Only show active configs
            setSubscriptionConfigs(
              data.configs
                .filter((c: any) => c.isActive)
                .map((c: any) => ({
                  id: c.id,
                  name: c.name,
                  description: c.description,
                }))
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch subscription package configs:", error);
      } finally {
        setLoadingSubscriptionConfigs(false);
      }
    };
    fetchSubscriptionConfigs();
  }, [session]);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      setFetchError(null);

      // Comprehensive fallback list
      const fallbackCountries = [
        "Afghanistan",
        "Albania",
        "Algeria",
        "Argentina",
        "Australia",
        "Austria",
        "Bangladesh",
        "Belgium",
        "Brazil",
        "Canada",
        "China",
        "Denmark",
        "Egypt",
        "Ethiopia",
        "Finland",
        "France",
        "Germany",
        "Ghana",
        "India",
        "Indonesia",
        "Iran",
        "Iraq",
        "Italy",
        "Japan",
        "Jordan",
        "Kenya",
        "Kuwait",
        "Lebanon",
        "Malaysia",
        "Morocco",
        "Netherlands",
        "Nigeria",
        "Norway",
        "Pakistan",
        "Philippines",
        "Qatar",
        "Russia",
        "Saudi Arabia",
        "Somalia",
        "South Africa",
        "Spain",
        "Sudan",
        "Sweden",
        "Switzerland",
        "Syria",
        "Turkey",
        "UAE",
        "UK",
        "USA",
        "USA-huzeyfa",
        "Yemen",
      ];

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(
          "https://restcountries.com/v3.1/all?fields=name",
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: Country[] = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("Invalid API response format");
        }

        const countryNames = data
          .map((country) => country?.name?.common)
          .filter(Boolean)
          .sort();

        // Add custom country option
        countryNames.push("USA-huzeyfa");
        countryNames.sort();

        if (countryNames.length > 0) {
          setCountries(countryNames);
        } else {
          throw new Error("No valid country names found");
        }
      } catch (err) {
        console.warn("Countries API failed:", err);
        setFetchError("Using offline country list");
        setCountries(fallbackCountries);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [timeResponse] = await Promise.all([
          fetch(`/api/time-slots?schoolSlug=${schoolSlug}`),
        ]);

        if (!timeResponse.ok)
          throw new Error(
            `Time slots fetch failed: ${timeResponse.statusText}`
          );

        const timeData: TimeSlotResponse = await timeResponse.json();
        setTimeSlots(timeData.timeSlots);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
      }
    };
    fetchData();
  }, []);

  const fetchTeachers = useCallback(async () => {
    if (!selectedTime || !selectedDayPackage) {
      setTeachers([]);
      return;
    }
    try {
      const response = await fetch(
        `/api/teachers-by-time?selectedTime=${encodeURIComponent(
          selectedTime
        )}&selectedDayPackage=${encodeURIComponent(
          selectedDayPackage
        )}&schoolSlug=${schoolSlug}`
      );
      const data = await response.json();
      // Log raw response to confirm
      if (!response.ok) {
        throw new Error(
          data.message || `Teachers fetch failed: ${response.statusText}`
        );
      }
      // Handle both { teachers: [...] } and [...] directly
      const teacherData = Array.isArray(data) ? { teachers: data } : data;

      // Filter out teachers who are already occupied for this time slot
      const availableTeachers = (teacherData.teachers || []).filter(
        (t: Teacher) => {
          const hasControl = t.control && t.control.code;
          if (!hasControl) return false;

          // Check if this teacher is occupied for the selected time slot and day package
          const isOccupied = occupiedTimes.some(
            (occupied) =>
              occupied.ustaz_id === t.ustazid &&
              occupied.time_slot === selectedTime &&
              occupied.daypackage === selectedDayPackage
          );

          return !isOccupied;
        }
      );

      if (
        selectedTeacher &&
        !availableTeachers.some((t: Teacher) => t.ustazid === selectedTeacher)
      ) {
        setSelectedTeacher("");
      }

      setTeachers(availableTeachers);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setTeachers([]);
    }
  }, [
    selectedTime,
    selectedDayPackage,
    selectedTeacher,
    occupiedTimes,
    schoolSlug,
  ]);

  const fetchAllTeachers = useCallback(async () => {
    try {
      const response = await fetch(`/api/teachers?schoolSlug=${schoolSlug}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch teachers: ${response.statusText}`);
      }
      const data = await response.json();
      setTeachers(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setTeachers([]);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return; // Wait for session to load

    if (step === 2) {
      if ((session as any)?.role === "registral") {
        fetchAllTeachers();
      } else {
        fetchTeachers();
      }
    }
  }, [
    step,
    fetchTeachers,
    fetchAllTeachers,
    occupiedTimes,
    (session as any)?.role,
    status,
  ]);

  // Handle pre-filled data from US students
  const [isUsStudent, setIsUsStudent] = useState(false);
  const isUsStudentRef = useRef(false);

  // Update ref when state changes
  useEffect(() => {
    isUsStudentRef.current = isUsStudent;
    if (isUsStudent) {
      clearErrors(["classfee", "country"]);
    }
  }, [isUsStudent, clearErrors]);

  useEffect(() => {
    const prefilled = searchParams.get("prefilled");
    const name = searchParams.get("name");
    const email = searchParams.get("email");
    const phoneno = searchParams.get("phoneno");
    const country = searchParams.get("country");
    const usStudentId = searchParams.get("usStudentId");

    if (prefilled === "true" && name) {
      setIsUsStudent(true);
      isUsStudentRef.current = true;
      setValue("fullName", name);
      if (phoneno) setValue("phoneNumber", phoneno);
      // Set country to USA for US students (hidden field)
      setValue("country", "USA");
      setValue("classfeeCurrency", "USD");
      // Set default class fee to null for US students
      setValue("classfee", undefined);
      // Store email and usStudentId for later use
      if (email) {
        sessionStorage.setItem("usStudentEmail", email);
      }
      if (usStudentId) {
        sessionStorage.setItem("usStudentId", usStudentId);
      }
    }
  }, [searchParams, setValue]);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!editId) return;
      if (editId) {
        try {
          const response = await fetch(
            `/api/registral/${schoolSlug}/registration?id=${editId}`
          );
          if (!response.ok) {
            throw new Error(
              `Failed to fetch student data: ${response.statusText}`
            );
          }
          const data = await response.json();

          let fetchedSelectedTime = data.selectedTime || "";
          if (
            fetchedSelectedTime &&
            !/^\d{1,2}:\d{2}\s?(AM|PM)?$/.test(fetchedSelectedTime)
          ) {
            const [hour, minute] = fetchedSelectedTime.split(":").map(Number);
            if (!isNaN(hour) && minute !== undefined && !isNaN(minute)) {
              fetchedSelectedTime = `${hour % 12 || 12}:${minute
                .toString()
                .padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
            } else {
              fetchedSelectedTime = "";
            }
          }

          // Check if this is a US student FIRST (has userId field AND country is USA)
          const isEditingUsStudent = !!data.userId && data.country === "USA";
          if (isEditingUsStudent) {
            setIsUsStudent(true);
            isUsStudentRef.current = true;
            // Clear any existing validation errors for US students
            clearErrors(["classfee", "country"]);
          }

          setValue("fullName", data.name || "");
          setValue("phoneNumber", data.phoneno || "");
          setValue("classfee", data.classfee || "");
          setValue("classfeeCurrency", data.classfeeCurrency || "ETB");
          setValue(
            "startdate",
            data.startdate
              ? new Date(data.startdate).toISOString().split("T")[0]
              : ""
          );
          setValue(
            "registrationdate",
            data.registrationdate
              ? new Date(data.registrationdate).toISOString().split("T")[0]
              : ""
          );
          // Normalize status to match dropdown options
          // Store the raw status first, we'll normalize it after configs load
          const rawStatus = data.status || "Active";
          setValue("status", rawStatus.trim());
          setValue("subject", data.subject || "");
          setValue("country", data.country || "");
          setValue("rigistral", data.rigistral || "");
          setValue("daypackages", data.daypackages || "All days");
          setValue("refer", data.refer || "");
          setValue("package", data.package || "");
          setValue("chatId", data.chatId || "");
          setValue("reason", data.reason || "");
          setValue(
            "subscriptionPackageConfigId",
            data.subscriptionPackageConfigId || undefined
          );
          setSelectedTime(fetchedSelectedTime);
          setSelectedTeacher(data.ustaz || "");
          setEditingTeacherName(data.ustaz || "");

          // Handle multiple subjects from comma-separated string
          if (data.subject) {
            const subjectsArray = data.subject
              .split(",")
              .map((s: string) => s.trim())
              .filter((s: string) => s);
            setSelectedSubjects(subjectsArray);
          } else {
            setSelectedSubjects([]);
          }

          await fetchTeachers();
        } catch (error) {
          setFetchError("Failed to load student data for editing.");
        }
        setStep(3);
      }
    };
    fetchStudentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, setValue]);

  // --- ENHANCEMENT: Always re-check teachers when day package changes in edit mode ---
  useEffect(() => {
    if (editId && editTimeTeacher && selectedTime && selectedDayPackage) {
      fetchTeachers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDayPackage, selectedTime, editId, editTimeTeacher]);

  // Update teacher schedule when teacher changes
  useEffect(() => {
    if (selectedTeacher) {
      const teacher = teachers.find((t) => t.ustazid === selectedTeacher);
      const schedule = teacher?.schedule || "";
      setSelectedTeacherSchedule(schedule);
    } else {
      setSelectedTeacherSchedule("");
    }
  }, [selectedTeacher, teachers]);

  // Add robust logging at the top of the Registration component
  useEffect(() => {}, [teachers, selectedTeacher, selectedTeacherSchedule]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);

    try {
      // Validate required fields based on student type (optional for registral users)
      if (session?.user?.role !== "registral" && !isUsStudent) {
        // Only require class fee if package is not "0 Fee"
        if (data.package !== "0 Fee" && !data.classfee && data.classfee !== 0) {
          throw new Error("Class Fee is required");
        }
        if (!data.country) {
          throw new Error("Country is required");
        }
      }

      // Only require teacher if not skipped (status is not "On Progress") and not registral user
      if (
        session?.user?.role !== "registral" &&
        (!editId || editTimeTeacher) &&
        (!selectedTeacher || selectedTeacher.trim() === "") &&
        data.status !== "On Progress"
      ) {
        throw new Error("Teacher is required");
      }

      // Require at least one subject (only if subjects are available and not registral user)
      if (
        session?.user?.role !== "registral" &&
        studentConfigs.subjects.length > 0 &&
        (!selectedSubjects || selectedSubjects.length === 0)
      ) {
        throw new Error("At least one subject is required");
      }

      // Require reason when status is "Leave"
      if (
        data.status &&
        (data.status.toLowerCase() === "leave" || data.status === "Leave")
      ) {
        if (!data.reason || data.reason.trim() === "") {
          throw new Error("Reason is required when status is Leave");
        }
      }

      const isoStartDate = data.startdate
        ? new Date(`${data.startdate}T00:00:00.000Z`).toISOString()
        : undefined;

      const isoRegistrationDate = data.registrationdate
        ? new Date(`${data.registrationdate}T00:00:00.000Z`).toISOString()
        : undefined;

      const selectedUstaz = teachers.find((t) => t.ustazid === selectedTeacher);
      const control = selectedUstaz?.control?.code || null;

      // Get US student data from session storage
      const usStudentEmail = sessionStorage.getItem("usStudentEmail");
      const usStudentId = sessionStorage.getItem("usStudentId");

      const payload = {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        parentPhone: data.parentPhone || null,
        classfee:
          data.classfee !== undefined && data.classfee !== null
            ? parseFloat(data.classfee as any)
            : null,
        classfeeCurrency: data.classfeeCurrency || "ETB",
        startdate: isoStartDate,
        control: control, // Automatically set based on selected ustaz's controlId
        status: data.status || "pending",
        ustaz:
          !editId || editTimeTeacher
            ? selectedTeacher || null
            : editingTeacherName || selectedTeacher,
        package: data.package, // region
        subject:
          selectedSubjects.length > 0 ? selectedSubjects.join(", ") : null,
        country: data.country || null,
        rigistral: data.rigistral || null,
        daypackages: data.daypackages, // day package
        refer: data.refer || null,
        selectedTime:
          !editId || editTimeTeacher ? selectedTime || null : selectedTime,
        registrationdate: isoRegistrationDate,
        // Add US student data
        email: usStudentEmail || null,
        usStudentId: usStudentId ?? null,
        // Add new fields
        chatId: data.chatId || null,
        reason: data.reason || null,
        subscriptionPackageConfigId: data.subscriptionPackageConfigId || null,
      };

      const url = editId
        ? `/api/registral/${schoolSlug}/registration?id=${editId}`
        : `/api/registral/${schoolSlug}/registration`;
      const method = editId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setAriaMessage(
          errorData.message ||
            (editId ? "Update failed" : "Registration failed")
        );
        throw new Error(
          errorData.message ||
            (editId ? "Update failed" : "Registration failed")
        );
      }

      const result = await response.json();

      // US student is now automatically linked via userId field in registration
      setAriaMessage(
        result.message ||
          (editId
            ? "Registration updated successfully"
            : "Registration successful")
      );
      setSummaryData({
        name: data.fullName,
        phone: data.phoneNumber,
        time: selectedTime,
        teacher:
          teachers.find((t) => t.ustazid === selectedTeacher)?.ustazname ||
          editingTeacherName,
        package: data.package,
        daypackage: data.daypackages,
        status: data.status,
        subject: selectedSubjects.join(", "),
        country: data.country,
        currency: data.classfeeCurrency || "ETB",
        classfee: data.classfee,
      });
      setShowSummary(true);
      setFormTouched(false);

      // Clean up session storage
      sessionStorage.removeItem("usStudentEmail");
      sessionStorage.removeItem("usStudentId");

      setTimeout(() => {
        // Redirect registral back to registral dashboard after registration
        const userRole = session?.user?.role;
        const redirectUrl =
          userRole === "registral"
            ? `/registral/${schoolSlug}/dashboard`
            : userRole === "admin"
            ? `/admin/${schoolSlug}/dashboard`
            : "/dashboard";

        window.location.href = redirectUrl;
      }, 1500);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : editId
          ? "Update failed. Please try again."
          : "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deduplicate time slots based on normalized time values
  const deduplicatedTimeSlots = timeSlots.reduce((acc, slot) => {
    const normalizedTime = convertTo12Hour(slot.time);
    const existingSlot = acc.find(
      (s) =>
        convertTo12Hour(s.time) === normalizedTime &&
        s.category === slot.category
    );
    if (!existingSlot) {
      acc.push(slot);
    }
    return acc;
  }, [] as TimeSlot[]);

  const groupedTimeSlots = deduplicatedTimeSlots.reduce((acc, slot) => {
    acc[slot.category] = acc[slot.category] || [];
    acc[slot.category].push(slot);
    return acc;
  }, {} as { [key: string]: TimeSlot[] });

  const today = new Date().toISOString().split("T")[0];

  const groupedCountries = countries.reduce((acc, country) => {
    const firstLetter = country[0].toUpperCase();
    acc[firstLetter] = acc[firstLetter] || [];
    acc[firstLetter].push(country);
    return acc;
  }, {} as { [key: string]: string[] });

  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      // Check if registral is accessing their correct school
      const userSchoolSlug = (session.user as any).schoolSlug || "darulkubra";
      if (schoolSlug !== userSchoolSlug) {
        console.log('Registral accessing wrong school in registration, redirecting', {
          requested: schoolSlug,
          userSchool: userSchoolSlug
        });
        router.replace(`/registral/${userSchoolSlug}/registration`);
        return;
      }
    }
  }, [status, session, router, schoolSlug]);

  const fetchOccupiedTimes = useCallback(async () => {
    if (!selectedDayPackage) return;

    try {
      const res = await fetch(
        `/api/occupied-times?schoolSlug=${schoolSlug}&dayPackage=${encodeURIComponent(
          selectedDayPackage
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        setOccupiedTimes(data.occupiedTimes || []);
      }
    } catch (error) {
      console.error("Error fetching occupied times:", error);
      setOccupiedTimes([]);
    }
  }, [schoolSlug, selectedDayPackage]);

  const checkAvailability = useCallback(async () => {
    const checkId = `${selectedDayPackage}-${timeSlots.length}-${occupiedTimes.length}`;
    if (!selectedDayPackage || timeSlots.length === 0 || loadingAvailability || availabilityCheckRef.current === checkId) return;

    availabilityCheckRef.current = checkId;
    setLoadingAvailability(true);
    const availability: { [time: string]: boolean } = {};

    try {
      await Promise.all(
        timeSlots.map(async (slot) => {
          try {
            const res = await fetch(
              `/api/teachers-by-time?selectedTime=${encodeURIComponent(
                slot.time
              )}&selectedDayPackage=${encodeURIComponent(
                selectedDayPackage
              )}&schoolSlug=${schoolSlug}&_t=${Date.now()}`
            );
            if (!res.ok) {
              availability[slot.time] = false;
              return;
            }
            const data = await res.json();
            const teachers = Array.isArray(data) ? data : data.teachers;
            const isAvailable = teachers && teachers.length > 0;

            // Check if this time slot is already occupied
            const isOccupied = occupiedTimes.some(
              (occupied) =>
                occupied.time_slot === slot.time &&
                occupied.daypackage === selectedDayPackage
            );

            availability[slot.time] = isAvailable && !isOccupied;
          } catch (error) {
            availability[slot.time] = false;
          }
        })
      );

      setAvailableTimeSlots(availability);
    } finally {
      setLoadingAvailability(false);
      availabilityCheckRef.current = null;
    }
  }, [selectedDayPackage, timeSlots.length, occupiedTimes.length, schoolSlug, loadingAvailability]);

  // Combined effect to fetch occupied times and check availability
  useEffect(() => {
    const initializeAvailability = async () => {
      if (!selectedDayPackage || timeSlots.length === 0) return;

      // Fetch occupied times first
      await fetchOccupiedTimes();

      // Small delay to ensure occupied times are set
      setTimeout(() => {
        if (!loadingAvailability) {
          checkAvailability();
        }
      }, 100);
    };

    initializeAvailability();
  }, [selectedDayPackage, timeSlots.length]); // Simplified dependencies

  // Availability is already handled by the main useEffect above, no need for separate refresh logic

  useEffect(() => {
    setSelectedTime("");
    // Reset availability check ref when day package changes
    availabilityCheckRef.current = null;
  }, [selectedDayPackage]);

  // Fetch controllers for refer dropdown
  useEffect(() => {
    if (session?.user?.role === "registral") {
      setLoadingControllers(true);
      setControllersError(null);
      fetch(`/api/control-options?schoolSlug=${schoolSlug}`)
        .then((res) => res.json())
        .then((data) => {
          setControllers(data.controllers || []);
        })
        .catch(() => setControllersError("Failed to load controllers"))
        .finally(() => setLoadingControllers(false));
    }
  }, [session]);

  // --- ENHANCEMENT: Stepper clickable navigation ---
  const canGoToStep = (targetStep: number) => {
    if (targetStep === 1) return true;
    if (targetStep === 2) {
      return (
        (!editId || (editId && editTimeTeacher)) &&
        selectedTime &&
        selectedDayPackage
      );
    }
    if (targetStep === 3) {
      return (
        (!editId || (editId && editTimeTeacher)) &&
        selectedTeacher &&
        selectedTime &&
        selectedDayPackage
      );
    }
    return false;
  };

  // --- ENHANCEMENT: Auto-scroll to first error field on validation error ---
  const formRef = useRef<HTMLFormElement | null>(null);
  useEffect(() => {
    if (Object.keys(errors).length > 0 && formRef.current) {
      const firstErrorField = formRef.current.querySelector(
        ".border-red-500, [aria-invalid='true']"
      );
      if (
        firstErrorField &&
        typeof (firstErrorField as HTMLElement).scrollIntoView === "function"
      ) {
        (firstErrorField as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        (firstErrorField as HTMLElement).focus();
      }
    }
  }, [errors]);

  // --- ENHANCEMENT: Add ARIA labels and improve focus/active states ---
  // Add aria-labels to major sections and buttons, and add focus:ring classes to all major buttons/inputs
  // Example for a button:
  // className="... focus:outline-none focus:ring-2 focus:ring-teal-400 ..."
  // Example for a section:
  // <section aria-label="Student Details"> ... </section>
  // --- ENHANCEMENT: Ensure no horizontal scroll on small screens ---
  // Add overflow-x-hidden to main container and ensure all cards use w-full and max-w-full where appropriate

  // --- ENHANCEMENT: Keyboard navigation for major elements ---
  // Add tabIndex={0} and key handlers to stepper, teacher/time selection, etc.
  // Example for a stepper button:
  // <button
  //   type="button"
  //   aria-label={`Go to step ${i}`}
  //   disabled={step === i || !canGoToStep(i)}
  //   onClick={() => canGoToStep(i) && setStep(i)}
  //   className={`h-3 w-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
  //     step >= i ? "bg-teal-300 shadow-md" : "bg-white/40"
  //   } ${step === i ? "ring-2 ring-teal-500" : ""}`}
  //   style={{
  //     cursor: canGoToStep(i) ? "pointer" : "not-allowed",
  //   }}
  //   onKeyDown={(e) => {
  //     if (e.key === "Enter" || e.key === " ") {
  //       e.preventDefault();
  //       canGoToStep(i) && setStep(i);
  //     }
  //   }}
  //   tabIndex={step === i ? 0 : -1}
  // />
  // Example for a time slot button:
  // <motion.button
  //   key={slot.id}
  //   type="button"
  //   onClick={() => {
  //     if (availableTimeSlots[slot.time]) {
  //       setSelectedTime(slot.time);
  //       setStep(2);
  //     }
  //   }}
  //   disabled={!availableTimeSlots[slot.time]}
  //   whileHover={
  //     availableTimeSlots[slot.time]
  //       ? { scale: 1.03 }
  //       : {}
  //   }
  //   whileTap={
  //     availableTimeSlots[slot.time]
  //       ? { scale: 0.97 }
  //       : {}
  //   }
  //   className={`w-full text-left p-4 rounded-xl transition-all duration-200 text-sm font-semibold flex items-center shadow-sm ${
  //     selectedTime === slot.time
  //       ? "bg-teal-600 text-white shadow-md"
  //       : availableTimeSlots[slot.time]
  //       ? "bg-white text-gray-800 hover:bg-green-50 border border-gray-200 hover:border-green-300"
  //       : "bg-gray-200 text-gray-400 border border-gray-200 cursor-not-allowed"
  //   }`}
  //   title={
  //     availableTimeSlots[slot.time]
  //       ? ""
  //       : "No teacher available for this time and package"
  //   }
  //   onKeyDown={(e) => {
  //     if (e.key === "Enter" || e.key === " ") {
  //       e.preventDefault();
  //       if (availableTimeSlots[slot.time]) {
  //         setSelectedTime(slot.time);
  //         setStep(2);
  //       }
  //     }
  //   }}
  //   tabIndex={availableTimeSlots[slot.time] ? 0 : -1}
  // />

  // --- ENHANCEMENT: Show summary card and delay before redirect ---
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-teal-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-teal-500 mb-4"></div>
          <p className="text-gray-600">Loading registration form...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-8 font-sans overflow-x-hidden"
      style={{
        background: `linear-gradient(to bottom right, ${primaryColor}10, ${secondaryColor}10)`,
      }}
    >
      {/* ARIA live region for error/success messages */}
      <div aria-live="polite" className="sr-only">
        {ariaMessage}
      </div>
      {/* Confirmation modal for unsaved changes */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-gradient-to-br from-yellow-50 to-white border border-yellow-200 rounded-3xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center relative"
            style={{ fontFamily: "inherit" }}
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 border-4 border-yellow-200 mb-4 shadow">
              <svg
                className="w-8 h-8 text-yellow-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="#fef9c3"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01"
                />
              </svg>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-yellow-700 mb-2 tracking-tight">
              Unsaved Changes
            </h2>
            <p className="mb-6 text-gray-700 text-base md:text-lg text-center font-medium">
              You have unsaved changes. Are you sure you want to leave?
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3 w-full mt-2">
              <button
                onClick={cancelLeave}
                className="px-4 py-3 sm:px-6 sm:py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-sm sm:text-base shadow focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={confirmLeave}
                className="px-4 py-3 sm:px-6 sm:py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm sm:text-base shadow focus:outline-none focus:ring-2 focus:ring-red-400 transition-all w-full sm:w-auto"
              >
                Leave
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Show enhanced success card after registration/edit */}
      {showSummary && summaryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
              type: "spring",
              stiffness: 100,
            }}
            className="relative overflow-hidden bg-gradient-to-br from-white via-green-50 to-emerald-50 border-2 border-emerald-200 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4"
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-green-400/5 animate-pulse" />

            {/* Floating decorative elements */}
            <div className="absolute top-4 right-4 opacity-20">
              <FiUser className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="absolute bottom-4 left-4 opacity-15">
              <FiCheck className="h-6 w-6 text-green-500" />
            </div>

            {/* Success Icon with animation */}
            <div className="relative flex items-center justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 10,
                }}
                className="relative"
              >
                <div className="p-4 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full shadow-lg border-2 border-emerald-200">
                  <FiCheck className="h-12 w-12 text-emerald-600" />
                </div>
                {/* Success pulse animation */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.5,
                  }}
                  className="absolute inset-0 bg-emerald-400 rounded-full"
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="text-center mb-6"
            >
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent mb-2">
                🎉 Registration Successful!
              </h2>
              <p className="text-emerald-600 font-medium text-lg">
                Student has been successfully registered at {schoolName}
              </p>
            </motion.div>

            {/* Student details with staggered animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-inner border border-emerald-100 mb-6"
            >
              <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center">
                <FiUser className="mr-2 h-5 w-5" />
                Student Details
              </h3>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-between items-center py-2 px-3 bg-emerald-50 rounded-lg"
                >
                  <span className="font-semibold text-emerald-700">Name:</span>
                  <span className="text-emerald-900">{summaryData.name}</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 }}
                  className="flex justify-between items-center py-2 px-3 bg-emerald-50 rounded-lg"
                >
                  <span className="font-semibold text-emerald-700">Phone:</span>
                  <span className="text-emerald-900">{summaryData.phone}</span>
                </motion.div>
                {summaryData.time && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-between items-center py-2 px-3 bg-emerald-50 rounded-lg"
                  >
                    <span className="font-semibold text-emerald-700">
                      Time Slot:
                    </span>
                    <span className="text-emerald-900">{summaryData.time}</span>
                  </motion.div>
                )}
                {summaryData.teacher && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.65 }}
                    className="flex justify-between items-center py-2 px-3 bg-emerald-50 rounded-lg"
                  >
                    <span className="font-semibold text-emerald-700">
                      Teacher:
                    </span>
                    <span className="text-emerald-900">
                      {summaryData.teacher}
                    </span>
                  </motion.div>
                )}
                {summaryData.package && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex justify-between items-center py-2 px-3 bg-emerald-50 rounded-lg"
                  >
                    <span className="font-semibold text-emerald-700">
                      Package:
                    </span>
                    <span className="text-emerald-900">
                      {summaryData.package}
                    </span>
                  </motion.div>
                )}
                {summaryData.classfee !== undefined &&
                  summaryData.classfee !== null && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.75 }}
                      className="flex justify-between items-center py-2 px-3 bg-emerald-50 rounded-lg"
                    >
                      <span className="font-semibold text-emerald-700">
                        Class Fee:
                      </span>
                      <span className="text-emerald-900">
                        {summaryData.currency || "ETB"}{" "}
                        {Number(summaryData.classfee).toLocaleString()}
                      </span>
                    </motion.div>
                  )}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex justify-between items-center py-2 px-3 bg-emerald-50 rounded-lg"
                >
                  <span className="font-semibold text-emerald-700">
                    Status:
                  </span>
                  <span className="text-emerald-900">{summaryData.status}</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85 }}
                  className="flex justify-between items-center py-2 px-3 bg-emerald-50 rounded-lg"
                >
                  <span className="font-semibold text-emerald-700">
                    Subject:
                  </span>
                  <span className="text-emerald-900">
                    {summaryData.subject}
                  </span>
                </motion.div>
              </div>
            </motion.div>

            {/* Progress bar and redirect message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.3 }}
              className="w-full"
            >
              <div className="relative mb-4">
                <div className="h-3 rounded-full bg-emerald-100 overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 relative"
                  >
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{
                        duration: 2,
                        ease: "easeInOut",
                        delay: 0.5,
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                  </motion.div>
                </div>
              </div>
              <div className="text-center">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-emerald-700 font-semibold text-lg animate-pulse"
                >
                  🎯 Redirecting to dashboard...
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="text-emerald-600 text-sm mt-1"
                >
                  Student management portal
                </motion.p>
              </div>
            </motion.div>

            {/* Quick action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-emerald-200"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowSummary(false);
                  window.location.href = `/registral/${schoolSlug}/dashboard`;
                }}
                className="flex-1 px-4 py-3 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-base sm:text-sm shadow-md transition-all duration-200"
              >
                Go to Dashboard
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowSummary(false);
                  window.location.href = `/registral/${schoolSlug}/registration`;
                }}
                className="flex-1 px-4 py-3 sm:px-4 sm:py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-semibold text-base sm:text-sm shadow-md transition-all duration-200"
              >
                Register Another
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-3xl md:max-w-5xl lg:max-w-6xl"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-t-4 border-teal-500">
          <div
            className="relative overflow-hidden p-8 text-white"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            }}
          >
            {/* Background pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
            </div>

            <div className="relative flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center"
              >
                <div className="relative">
                  <img
                    src={logoUrl || "https://darelkubra.com/wp-content/uploads/2024/06/cropped-%E1%8B%B3%E1%88%A9%E1%88%8D-%E1%88%8E%E1%8C%8E-150x150.png"}
                    alt={`${schoolName} Logo`}
                    className="h-16 w-16 rounded-full border-3 border-white/90 shadow-lg"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                    <FiCheck className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold tracking-tight mb-1 drop-shadow-lg">
                    {schoolName}
                  </h1>
                  <p className="text-sm text-white/90 font-medium flex items-center">
                    <FiUserCheck className="mr-2 h-4 w-4" />
                    Student Registration Portal
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center gap-4"
              >
                <div
                  className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold flex items-center shadow-lg border border-white/20"
                  aria-label="Step Progress"
                >
                  <span className="mr-4 text-white/90">Progress</span>
                  <span className="text-lg font-bold mr-4">{step} of 3</span>
                  <div className="flex space-x-2">
                    {[1, 2, 3].map((i) => (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Go to step ${i}`}
                        disabled={step === i || !canGoToStep(i)}
                        onClick={() => canGoToStep(i) && setStep(i)}
                        className={`h-4 w-4 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                          step >= i ? "bg-white shadow-md" : "bg-white/30"
                        } ${step === i ? "ring-2 ring-white scale-110" : ""}`}
                        style={{
                          cursor: canGoToStep(i) ? "pointer" : "not-allowed",
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            canGoToStep(i) && setStep(i);
                          }
                        }}
                        tabIndex={step === i ? 0 : -1}
                      />
                    ))}
                  </div>
                </div>

                <div className="w-full bg-white/20 rounded-full h-3 shadow-inner overflow-hidden">
                  <motion.div
                    className="bg-white h-3 rounded-full shadow-md"
                    initial={{ width: 0 }}
                    animate={{ width: `${(step / 3) * 100}%` }}
                    transition={{ duration: 0.9, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            </div>
          </div>

          <div className="p-6 md:p-10 bg-gray-50">
            {editId && (
              <div className="mb-6 flex items-center space-x-3">
                <input
                  id="edit-time-teacher"
                  type="checkbox"
                  checked={editTimeTeacher}
                  onChange={() => {
                    setEditTimeTeacher((v) => !v);
                    setStep((v) => (v === 3 ? 1 : 3));
                  }}
                  className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <label
                  htmlFor="edit-time-teacher"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Edit Time Slot, Package, and Teacher
                </label>
              </div>
            )}
            <AnimatePresence mode="wait">
              {/* Step 1: Day package and time slot selection (no TimePicker, no teacher selection) */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-8"
                >
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Select Preferred Time Slot
                  </h2>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center bg-white rounded-2xl p-4 sm:p-5 shadow-md border border-gray-100 w-full sm:w-auto transition-all duration-300 hover:shadow-lg mb-4">
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-3 md:mb-0 md:mr-5">
                      <FiCalendar className="mr-2 text-teal-600" />
                      Day Package:
                    </label>
                    <div className="relative w-full md:w-auto">
                      {loadingDayPackages ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-2.5 text-sm font-medium text-gray-500 flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-teal-500 mr-2"></div>
                          Loading packages...
                        </div>
                      ) : (
                        <select
                          {...register("daypackages", {
                            required:
                              session?.user?.role === "registral"
                                ? false
                                : "Day package is required",
                          })}
                          className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-2.5 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm font-medium text-gray-800 w-full md:w-64 transition-all duration-200 hover:border-teal-500 appearance-none"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.5em 1.5em',
                            paddingRight: '2.5rem'
                          }}
                        >
                          <option value="" className="text-gray-400">
                            Select a day package
                          </option>
                          {dayPackages.length > 0 ? (
                            dayPackages.map((pkg, index) => (
                              <option
                                key={index}
                                value={pkg}
                                className="text-gray-800 py-1"
                              >
                                {pkg}
                              </option>
                            ))
                          ) : (
                            <option value="" disabled className="text-gray-400">
                              No packages available
                            </option>
                          )}
                        </select>
                      )}
                    </div>
                    {dayPackages.length === 0 && !loadingDayPackages && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-600 text-xs mt-2 ml-2 flex items-center"
                      >
                        <FiInfo className="mr-1" />
                        Day packages not loaded. Please refresh the page.
                      </motion.p>
                    )}
                  </div>
                  {/* Time slot grid */}
                  {(() => {
                    return timeSlots.length > 0;
                  })() && (
                    <>
                      {/* Debug info */}
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 font-medium">Debug Info:</p>
                        <p className="text-blue-600 text-sm">
                          Time slots count: {timeSlots.length}
                        </p>
                        <p className="text-blue-600 text-sm">
                          Categories: {Object.keys(groupedTimeSlots).join(", ")}
                        </p>
                        <p className="text-blue-600 text-sm">
                          Selected day package: {selectedDayPackage}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.keys(groupedTimeSlots).map((category) => {
                          const prayerRanges = getPrayerRanges();
                          const categoryInfo = prayerRanges[category];

                          return (
                            <div
                              key={category}
                              className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
                            >
                              <h3 className="text-xl font-semibold text-teal-600 mb-2 flex items-center">
                                <span className="w-4 h-4 bg-teal-500 rounded-full mr-3 shadow-sm"></span>
                                {category}
                              </h3>
                              {categoryInfo && (
                                <p className="text-sm text-gray-600 mb-4 font-medium">
                                  {categoryInfo.range} -{" "}
                                  {categoryInfo.description}
                                </p>
                              )}
                              <div className="space-y-3">
                                {groupedTimeSlots[category].map((slot) => {
                                  const isAvailable =
                                    availableTimeSlots[slot.time];
                                  const isSelected = selectedTime === slot.time;
                                  const isLoading = loadingAvailability;

                                  // Check if this time slot is occupied
                                  const isOccupied = occupiedTimes.some(
                                    (occupied) =>
                                      occupied.time_slot === slot.time &&
                                      occupied.daypackage === selectedDayPackage
                                  );

                                  const finalAvailable =
                                    isAvailable && !isOccupied;

                                  return (
                                    <motion.button
                                      key={slot.id}
                                      type="button"
                                      onClick={() => {
                                        if (finalAvailable && !isLoading) {
                                          setSelectedTime(slot.time);
                                        }
                                      }}
                                      disabled={!finalAvailable || isLoading}
                                      whileHover={
                                        finalAvailable && !isLoading
                                          ? { scale: 1.03 }
                                          : {}
                                      }
                                      whileTap={
                                        finalAvailable && !isLoading
                                          ? { scale: 0.97 }
                                          : {}
                                      }
                                      className={`w-full text-left p-4 rounded-xl transition-all duration-200 text-sm font-semibold flex flex-col shadow-sm relative ${
                                        isSelected
                                          ? "bg-teal-600 text-white shadow-md"
                                          : isLoading
                                          ? "bg-gray-100 text-gray-500 border border-gray-200 cursor-wait"
                                          : isOccupied
                                          ? "bg-orange-50 text-orange-800 border-2 border-orange-500 cursor-not-allowed"
                                          : finalAvailable
                                          ? "bg-white text-gray-800 hover:bg-green-50 border-2 border-green-500 hover:border-green-600"
                                          : "bg-red-50 text-red-800 border-2 border-red-500 cursor-not-allowed opacity-75"
                                      }`}
                                      title={
                                        isLoading
                                          ? "Checking availability..."
                                          : isOccupied
                                          ? "This time slot is already occupied"
                                          : finalAvailable
                                          ? "Click to select this time slot"
                                          : "No teacher available for this time and package"
                                      }
                                    >
                                      {/* Availability indicator circle */}
                                      <div
                                        className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                                          isLoading
                                            ? "bg-gray-400 animate-pulse"
                                            : isAvailable
                                            ? "bg-green-500"
                                            : "bg-red-500"
                                        }`}
                                      />
                                      <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                          <span className="text-lg font-bold">
                                            {convertTo12Hour(slot.time)}
                                          </span>
                                          <span className="text-xs opacity-75">
                                            {slot.time} (24hr)
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          {isLoading ? (
                                            <Badge className="bg-gray-100 text-gray-600 text-xs">
                                              Checking...
                                            </Badge>
                                          ) : isOccupied ? (
                                            <Badge className="bg-orange-100 text-orange-800 text-xs font-bold">
                                              🕐 Occupied
                                            </Badge>
                                          ) : finalAvailable ? (
                                            <Badge className="bg-green-100 text-green-800 text-xs font-bold">
                                              ✓ Available
                                            </Badge>
                                          ) : (
                                            <Badge className="bg-red-100 text-red-800 text-xs font-bold">
                                              ✗ Full
                                            </Badge>
                                          )}
                                          <FiArrowRight
                                            className={`ml-2 ${
                                              isSelected
                                                ? "text-white"
                                                : isLoading
                                                ? "text-gray-400"
                                                : isOccupied
                                                ? "text-orange-500"
                                                : finalAvailable
                                                ? "text-green-600"
                                                : "text-red-400"
                                            }`}
                                          />
                                        </div>
                                      </div>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary of availability */}
                      <div className="mt-6 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <FiInfo className="mr-2 text-teal-600" />
                          Time Slot Availability Summary
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {
                                Object.values(availableTimeSlots).filter(
                                  (v) => v
                                ).length
                              }
                            </div>
                            <div className="text-sm text-gray-600">
                              Available
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {
                                Object.values(availableTimeSlots).filter(
                                  (v) => !v
                                ).length
                              }
                            </div>
                            <div className="text-sm text-gray-600">
                              Unavailable
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {Object.keys(groupedTimeSlots).length}
                            </div>
                            <div className="text-sm text-gray-600">
                              Categories
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-600">
                              {timeSlots.length}
                            </div>
                            <div className="text-sm text-gray-600">
                              Total Slots
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* No available slots message */}
                      {Object.values(availableTimeSlots).length > 0 &&
                        Object.values(availableTimeSlots).every((v) => !v) && (
                          <div className="text-center py-8">
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl inline-block shadow-sm">
                              <p className="text-yellow-700 font-medium text-lg">
                                No available time slots for the selected day
                                package. Please try a different package.
                              </p>
                            </div>
                          </div>
                        )}
                    </>
                  )}

                  {/* Loading state */}
                  {timeSlots.length === 0 && !loadingAvailability && (
                    <div className="text-center py-8">
                      <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-xl inline-block shadow-sm">
                        <p className="text-gray-700 font-medium text-lg">
                          No time slots available. Please contact admin to add
                          teacher schedules.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
                    <Button
                      onClick={() => checkAvailability()}
                      disabled={loadingAvailability}
                      variant="outline"
                      className="flex items-center justify-center gap-2 px-4 py-3 sm:px-4 sm:py-2 text-sm sm:text-base"
                    >
                      <FiRefreshCw
                        className={`h-4 w-4 ${
                          loadingAvailability ? "animate-spin" : ""
                        }`}
                      />
                      Refresh Availability
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedTime("");
                        setSelectedTeacher("");
                        setStep(3);
                      }}
                      variant="outline"
                      className="px-4 py-3 sm:px-4 sm:py-2 text-sm sm:text-base bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    >
                      Skip Time Slot
                    </Button>
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!selectedDayPackage || !selectedTime}
                      className="px-4 py-3 sm:px-4 sm:py-2 text-sm sm:text-base"
                    >
                      Continue
                    </Button>
                  </div>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-red-50 border-l-4 border-red-500 p-5 rounded-lg shadow-sm"
                    >
                      <p className="text-red-700 font-medium">Error: {error}</p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Teacher selection (filtered by selected time and package) */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-8"
                >
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center text-teal-600 hover:text-teal-800 text-sm font-semibold transition-colors duration-200"
                  >
                    <FiArrowLeft className="mr-2" />
                    Back to Time Selection
                  </button>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                      Available Teachers
                    </h2>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      For{" "}
                      <span className="font-semibold text-teal-600">
                        {selectedTime}
                      </span>{" "}
                      on{" "}
                      <span className="font-semibold text-teal-600">
                        {selectedDayPackage}
                      </span>
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {error ? (
                      <div className="col-span-full py-10 text-center">
                        <div className="bg-red-50 rounded-xl p-8 inline-block shadow-sm">
                          <p className="text-red-700 font-medium">
                            Error: {error}
                          </p>
                        </div>
                      </div>
                    ) : teachers && teachers.length > 0 ? (
                      teachers.map((teacher) => {
                        // Check if this teacher is occupied for the selected time slot
                        const isOccupied = occupiedTimes.some(
                          (occupied) =>
                            occupied.ustaz_id === teacher.ustazid &&
                            occupied.time_slot === selectedTime &&
                            occupied.daypackage === selectedDayPackage
                        );

                        return (
                          <motion.div
                            key={teacher.ustazid}
                            onClick={() =>
                              !isOccupied && setSelectedTeacher(teacher.ustazid)
                            }
                            whileHover={{ y: isOccupied ? 0 : -5 }}
                            className={`p-5 rounded-xl transition-all duration-300 border shadow-sm ${
                              isOccupied
                                ? "border-orange-300 bg-orange-50 cursor-not-allowed opacity-75"
                                : selectedTeacher === teacher.ustazid
                                ? "border-teal-500 bg-teal-50 shadow-md cursor-pointer"
                                : "border-gray-200 hover:border-teal-400 bg-white hover:shadow-md cursor-pointer"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div
                                  className={`h-6 w-6 rounded-full border mr-4 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                                    selectedTeacher === teacher.ustazid
                                      ? "bg-teal-600 border-teal-600"
                                      : isOccupied
                                      ? "bg-orange-400 border-orange-400"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {selectedTeacher === teacher.ustazid ? (
                                    <FiCheck className="h-4 w-4 text-white" />
                                  ) : isOccupied ? (
                                    <FiClock className="h-4 w-4 text-white" />
                                  ) : null}
                                </div>
                                <div>
                                  <p
                                    className={`font-semibold ${
                                      isOccupied
                                        ? "text-gray-600"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {teacher.ustazname}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1.5">
                                    {isOccupied ? (
                                      <span className="text-orange-600 font-medium">
                                        🕐 Occupied for this time slot
                                      </span>
                                    ) : (
                                      <>
                                        Available (Controller:{" "}
                                        {teacher.control?.code || "Unknown"})
                                      </>
                                    )}
                                  </p>
                                </div>
                              </div>
                              {isOccupied && (
                                <div className="text-orange-500">
                                  <FiClock className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-10 text-center">
                        <div className="bg-gray-50 rounded-xl p-8 inline-block shadow-sm">
                          <p className="text-gray-600 font-medium">
                            No teachers are available for{" "}
                            <span className="font-semibold">
                              {selectedTime}
                            </span>{" "}
                            on{" "}
                            <span className="font-semibold">
                              {selectedDayPackage}
                            </span>
                            . Please select a different time slot or package.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-6">
                    <Button
                      onClick={() => {
                        setSelectedTeacher("");
                        setStep(3);
                      }}
                      variant="outline"
                      className="px-4 py-3 sm:px-4 sm:py-2 text-sm sm:text-base bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100 w-full sm:w-auto"
                    >
                      Skip Teacher
                    </Button>
                    <motion.button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={!selectedTeacher}
                      whileHover={selectedTeacher ? { scale: 1.03 } : {}}
                      whileTap={selectedTeacher ? { scale: 0.97 } : {}}
                      className={`px-4 py-3 sm:px-6 sm:py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 flex items-center justify-center ${
                        !selectedTeacher
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-teal-600 hover:bg-teal-700"
                      } w-full sm:w-auto`}
                    >
                      Continue <FiArrowRight className="ml-2" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.form
                  key="step3"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!editId || (editId && editTimeTeacher)) {
                        setStep(2);
                      }
                    }}
                    disabled={!!editId && !editTimeTeacher}
                    title={
                      !!editId && !editTimeTeacher
                        ? "Enable 'Edit Time Slot, Package, and Teacher' to change teacher/time."
                        : ""
                    }
                    className={`flex items-center text-teal-600 hover:text-teal-800 text-sm font-semibold transition-colors duration-200 ${
                      !!editId && !editTimeTeacher
                        ? "opacity-60 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <FiArrowLeft className="mr-2" />
                    Back to Teacher Selection
                  </button>

                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                      {editId
                        ? "Edit Your Registration"
                        : "Complete Your Registration"}
                    </h2>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {editId
                        ? "Update the required details"
                        : "Please fill in the required details"}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 transition-all duration-300 hover:shadow-lg">
                    <h3 className="text-xl font-semibold text-teal-600 mb-4 flex items-center">
                      <FiInfo className="mr-2" />
                      Your Selection
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Time Slot
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {selectedTime || "Not selected"}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Teacher
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {teachers.find((t) => t.ustazid === selectedTeacher)
                            ?.ustazname ||
                            (editId && editingTeacherName) ||
                            "Not selected"}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Day Package
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {selectedDayPackage || "Not selected"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800 flex items-center">
                        <FiUser className="mr-2 text-teal-600" />
                        Full Name *
                      </label>
                      <input
                        {...register("fullName", {
                          required: "Full Name is required",
                          minLength: {
                            value: 2,
                            message: "Full Name must be at least 2 characters",
                          },
                        })}
                        className={`w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm font-medium transition-all duration-200 shadow-sm ${
                          errors.fullName
                            ? "border-red-500"
                            : "border-gray-200 hover:border-teal-300"
                        }`}
                        placeholder="Enter full name"
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-xs text-red-600 font-medium">
                          {errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800 flex items-center">
                        <FiPhone className="mr-2 text-teal-600" />
                        Phone Number *
                      </label>
                      <PhoneInput
                        country={"sd"} // or your preferred default country code
                        value={watch("phoneNumber") || ""}
                        onChange={(value) => setValue("phoneNumber", value)}
                        inputProps={{
                          name: "phoneNumber",
                          required: true,
                          className: `w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm font-medium transition-all duration-200 shadow-sm ${
                            errors.phoneNumber
                              ? "border-red-500"
                              : "border-gray-200 hover:border-teal-300"
                          }`,
                          placeholder: "Enter phone number",
                        }}
                      />
                      {errors.phoneNumber && (
                        <p className="mt-1 text-xs text-red-600 font-medium">
                          {errors.phoneNumber.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800 flex items-center">
                        <FiPhone className="mr-2 text-teal-600" />
                        Parent Phone Number (Optional)
                      </label>
                      <PhoneInput
                        country={"sd"} // or your preferred default country code
                        value={watch("parentPhone") || ""}
                        onChange={(value) => setValue("parentPhone", value)}
                        inputProps={{
                          name: "parentPhone",
                          className: `w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm font-medium transition-all duration-200 shadow-sm ${
                            errors.parentPhone
                              ? "border-red-500"
                              : "border-gray-200 hover:border-teal-300"
                          }`,
                          placeholder: "Enter parent phone number",
                        }}
                      />
                      {errors.parentPhone && (
                        <p className="mt-1 text-xs text-red-600 font-medium">
                          {errors.parentPhone.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        This will allow parents to access the parent portal to
                        view their child's progress
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800 flex items-center">
                        <FiUser className="mr-2 text-teal-600" />
                        Chat ID (Optional)
                      </label>
                      <input
                        {...register("chatId")}
                        className="w-full px-5 py-3 rounded-xl border border-gray-200 hover:border-teal-300 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm font-medium transition-all duration-200 shadow-sm"
                        placeholder="Enter Telegram chat ID"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800 flex items-center">
                        <FiDollarSign className="mr-2 text-teal-600" />
                        Class Fee{" "}
                        {!isUsStudent && watch("package") !== "0 Fee"
                          ? "*"
                          : "(Optional)"}
                      </label>
                      <div className="flex flex-col gap-3">
                        <select
                          {...register("classfeeCurrency")}
                          disabled={isUsStudent}
                          className={`sm:w-32 px-4 py-3 rounded-xl border focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm font-medium transition-all duration-200 shadow-sm ${
                            isUsStudent
                              ? "bg-gray-50 border-gray-200"
                              : "border-gray-200 hover:border-teal-300"
                          }`}
                        >
                          {currencyOptions.map((currency) => (
                            <option key={currency} value={currency}>
                              {currency}
                            </option>
                          ))}
                        </select>
                        <div className="relative flex-1">
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                            {currencySymbols[selectedCurrency || "ETB"] ||
                              "ETB"}
                          </span>
                          <input
                            {...register("classfee", {
                              required: false, // Always optional - we'll handle in onSubmit
                              min: {
                                value: 0,
                                message: "Fee cannot be negative",
                              },
                              valueAsNumber: true,
                            })}
                            className={`w-full pl-16 pr-5 py-3 rounded-xl border focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm font-medium transition-all duration-200 shadow-sm ${
                              errors.classfee
                                ? "border-red-500"
                                : "border-gray-200 hover:border-teal-300"
                            } ${isUsStudent ? "bg-gray-50" : ""}`}
                            placeholder={
                              isUsStudent
                                ? "Optional for US students"
                                : watch("package") === "0 Fee"
                                ? "Optional for 0 Fee package"
                                : "Enter fee amount"
                            }
                            type="number"
                            readOnly={isUsStudent}
                          />
                        </div>
                      </div>
                      {errors.classfee && (
                        <p className="mt-1 text-xs text-red-600 font-medium">
                          {errors.classfee.message}
                        </p>
                      )}
                      {isUsStudent && (
                        <p className="mt-1 text-xs text-blue-600 font-medium">
                          Class fee is not required for US students
                        </p>
                      )}
                      {!isUsStudent && watch("package") === "0 Fee" && (
                        <p className="mt-1 text-xs text-blue-600 font-medium">
                          Class fee is optional for 0 Fee package
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800 flex items-center">
                        <FiCalendar className="mr-2 text-teal-600" />
                        Start Date
                        {session?.user?.role === "registral" ? "" : " *"}
                      </label>
                      <input
                        {...register("startdate", {
                          required:
                            session?.user?.role === "registral"
                              ? false
                              : "Start Date is required",
                        })}
                        className={`w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm font-medium transition-all duration-200 shadow-sm ${
                          errors.startdate
                            ? "border-red-500"
                            : "border-gray-200 hover:border-teal-300"
                        }`}
                        type="date"
                      />
                      {errors.startdate && (
                        <p className="mt-1 text-xs text-red-600 font-medium">
                          {errors.startdate.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800 flex items-center">
                        <FiCalendar className="mr-2 text-teal-600" />
                        Registration Date
                        {session?.user?.role === "registral" ? "" : " *"}
                      </label>
                      <input
                        {...register("registrationdate", {
                          required:
                            session?.user?.role === "registral"
                              ? false
                              : "Registration Date is required",
                        })}
                        className={`w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm font-medium transition-all duration-200 shadow-sm ${
                          errors.registrationdate
                            ? "border-red-500"
                            : "border-gray-200 hover:border-teal-300"
                        }`}
                        type="date"
                      />
                      {errors.registrationdate && (
                        <p className="mt-1 text-xs text-red-600 font-medium">
                          {errors.registrationdate.message}
                        </p>
                      )}
                    </div>

                    {/* Region Package Dropdown */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800 flex items-center">
                        <FiFlag className="mr-2 text-teal-600" />
                        Package (Region)
                      </label>
                      <select
                        {...register("package", {
                          required:
                            session?.user?.role === "registral"
                              ? false
                              : "Package is required",
                        })}
                        className={`w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm font-medium transition-all duration-200 shadow-sm hover:border-teal-300 ${
                          errors.package ? "border-red-500" : "border-gray-200"
                        } ${loadingConfigs ? "bg-gray-50" : ""}`}
                        disabled={loadingConfigs}
                      >
                        <option value="">
                          {loadingConfigs
                            ? "Loading packages..."
                            : "Select package"}
                        </option>
                        {studentConfigs.packages.map((pkg, index) => (
                          <option key={index} value={pkg}>
                            {pkg}
                          </option>
                        ))}
                      </select>
                      {errors.package && (
                        <p className="mt-1 text-xs text-red-600 font-medium">
                          {errors.package.message}
                        </p>
                      )}
                    </div>

                    {/* Status field - show when editing OR when teacher and time selected */}
                    {editId || (selectedTime && selectedTeacher) ? (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-800 flex items-center">
                          <FiUserCheck className="mr-2 text-teal-600" />
                          Status
                          {session?.user?.role === "registral" ? "" : " *"}
                        </label>
                        <select
                          {...register("status", {
                            required:
                              session?.user?.role === "registral"
                                ? false
                                : "Status is required",
                          })}
                          className={`w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm font-medium transition-all duration-200 shadow-sm ${
                            errors.status
                              ? "border-red-500"
                              : "border-gray-200 hover:border-teal-300"
                          } ${loadingConfigs ? "bg-gray-50" : ""}`}
                          disabled={loadingConfigs}
                        >
                          <option value="">
                            {loadingConfigs
                              ? "Loading statuses..."
                              : "Select status"}
                          </option>
                          {(() => {
                            const userRole =
                              (session as any)?.role || session?.user?.role;
                            const currentStatus = watch("status");

                            // Role-based status filtering
                            // Admin: All statuses from config
                            // Registral: Only "Not yet" and "On Progress"
                            // Controller: Only "Not yet", "Active", "Not succeed", "Leave"
                            let allowedStatuses: string[] = [];

                            if (userRole === "admin") {
                              // Admin: All statuses from config (all active statuses)
                              allowedStatuses = Array.isArray(
                                studentConfigs.statuses
                              )
                                ? [...studentConfigs.statuses]
                                : [];
                            } else if (userRole === "registral") {
                              // Registral: Only "Not yet" and "On Progress"
                              allowedStatuses = ["Not yet", "On Progress"];
                            } else if (userRole === "controller") {
                              // Controller: Only "Not yet", "Active", "Not succeed", "Leave"
                              allowedStatuses = [
                                "Not yet",
                                "Active",
                                "Not succeed",
                                "Leave",
                              ];
                            } else {
                              // Default: All statuses for other roles
                              allowedStatuses = Array.isArray(
                                studentConfigs.statuses
                              )
                                ? [...studentConfigs.statuses]
                                : [];
                            }

                            // When editing, always include the current status even if not in allowed list
                            // This ensures that existing statuses that may have been deactivated
                            // or not in the role's allowed list are still visible and selectable
                            const statusesToShow = new Set<string>();

                            // Normalize function to ensure consistent matching
                            const normalizeStatus = (status: string) => {
                              if (!status) return null;
                              // Trim and normalize whitespace
                              return status.trim().replace(/\s+/g, " ");
                            };

                            // Add allowed statuses for this role (normalized)
                            allowedStatuses.forEach((status) => {
                              const normalized = normalizeStatus(status);
                              if (normalized) {
                                statusesToShow.add(normalized);
                              }
                            });

                            // When editing, always include the current status (for all roles)
                            // This ensures users can see and preserve existing statuses
                            // Normalize the current status to match stored format
                            if (editId && currentStatus) {
                              const normalizedCurrent =
                                normalizeStatus(currentStatus);
                              if (normalizedCurrent) {
                                statusesToShow.add(normalizedCurrent);
                              }
                            }

                            // Convert to array (statuses are already normalized)
                            const sortedStatuses = Array.from(statusesToShow);

                            // Normalize current status for matching
                            const currentStatusNormalized =
                              editId && currentStatus
                                ? normalizeStatus(currentStatus)
                                : null;

                            // When editing, move current status to top for better UX
                            if (editId && currentStatusNormalized) {
                              // Find exact match or case-insensitive match
                              const currentIndex = sortedStatuses.findIndex(
                                (s) =>
                                  s === currentStatusNormalized ||
                                  s.toLowerCase() ===
                                    currentStatusNormalized.toLowerCase()
                              );

                              if (currentIndex > 0) {
                                // Use the exact value from sortedStatuses to ensure match
                                const matchedStatus =
                                  sortedStatuses[currentIndex];
                                sortedStatuses.splice(currentIndex, 1);
                                sortedStatuses.unshift(matchedStatus);
                              } else if (currentIndex === -1) {
                                // Current status not found in list, add normalized version at top
                                sortedStatuses.unshift(currentStatusNormalized);
                              } else {
                                // currentIndex === 0, already at top, but ensure exact match
                                // Replace with normalized version if needed
                                if (
                                  sortedStatuses[0] !== currentStatusNormalized
                                ) {
                                  sortedStatuses[0] = currentStatusNormalized;
                                }
                              }
                            }

                            // Sort alphabetically (except current status which is already first)
                            const otherStatuses =
                              currentStatusNormalized &&
                              sortedStatuses.length > 1
                                ? sortedStatuses.slice(1).sort()
                                : sortedStatuses.sort();

                            const finalStatuses =
                              currentStatusNormalized &&
                              sortedStatuses.length > 0 &&
                              sortedStatuses[0] === currentStatusNormalized
                                ? [currentStatusNormalized, ...otherStatuses]
                                : otherStatuses;

                            // Render status options
                            if (finalStatuses.length === 0) {
                              return (
                                <option value="" disabled>
                                  No statuses available
                                </option>
                              );
                            }

                            return finalStatuses.map((status, index) => (
                              <option key={`${status}-${index}`} value={status}>
                                {status}
                              </option>
                            ));
                          })()}
                        </select>
                        {errors.status && (
                          <p className="mt-1 text-xs text-red-600 font-medium">
                            {errors.status.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <input
                        type="hidden"
                        {...register("status")}
                        value="On Progress"
                      />
                    )}

                    {(watch("status")?.toLowerCase() === "leave" ||
                      watch("status") === "Leave") && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-800 flex items-center">
                          <FiInfo className="mr-2 text-teal-600" />
                          Reason for Leave *
                        </label>
                        <textarea
                          {...register("reason", {
                            required:
                              watch("status")?.toLowerCase() === "leave" ||
                              watch("status") === "Leave"
                                ? "Reason is required when status is Leave"
                                : false,
                          })}
                          className={`w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm font-medium transition-all duration-200 shadow-sm resize-none ${
                            errors.reason
                              ? "border-red-500"
                              : "border-gray-200 hover:border-teal-300"
                          }`}
                          placeholder="Please provide reason for leaving"
                          rows={3}
                        />
                        {errors.reason && (
                          <p className="mt-1 text-xs text-red-600 font-medium">
                            {errors.reason.message}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800 flex items-center">
                        <FiBook className="mr-2 text-teal-600" />
                        Subjects * (Select multiple)
                      </label>
                      <select
                        multiple
                        name="subject"
                        value={selectedSubjects}
                        onChange={(e) => {
                          const selectedOptions = Array.from(
                            e.target.selectedOptions,
                            (option) => option.value
                          );
                          setSelectedSubjects(selectedOptions);
                          setValue("subject", selectedOptions.join(", "));
                          clearErrors("subject");
                        }}
                        className={`w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm font-medium transition-all duration-200 shadow-sm min-h-[120px] ${
                          errors.subject ||
                          (selectedSubjects.length === 0 && formTouched)
                            ? "border-red-500"
                            : "border-gray-200 hover:border-teal-300"
                        } ${loadingConfigs ? "bg-gray-50" : ""}`}
                        disabled={loadingConfigs}
                        size={Math.min(
                          Math.max(studentConfigs.subjects.length, 1),
                          6
                        )}
                      >
                        {studentConfigs.subjects.length > 0 ? (
                          studentConfigs.subjects.map((subject, index) => (
                            <option key={index} value={subject}>
                              {subject}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            No subjects available. Please contact admin to add
                            subjects.
                          </option>
                        )}
                      </select>
                      {selectedSubjects.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 font-medium mb-1">
                            Selected subjects:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {selectedSubjects.map((subject, index) => (
                              <Badge
                                key={index}
                                className="bg-teal-100 text-teal-800 text-xs"
                              >
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {errors.subject && (
                        <p className="mt-1 text-xs text-red-600 font-medium">
                          {errors.subject.message}
                        </p>
                      )}
                      {!errors.subject &&
                        selectedSubjects.length === 0 &&
                        formTouched &&
                        studentConfigs.subjects.length > 0 && (
                          <p className="mt-1 text-xs text-red-600 font-medium">
                            At least one subject is required
                          </p>
                        )}
                      {selectedSubjects.length === 0 &&
                        !formTouched &&
                        studentConfigs.subjects.length > 0 && (
                          <p className="mt-1 text-xs text-gray-500">
                            Hold Ctrl/Cmd to select multiple subjects
                          </p>
                        )}
                      {studentConfigs.subjects.length === 0 && (
                        <p className="mt-1 text-xs text-yellow-600 font-medium">
                          No subjects available. Please contact admin to add
                          subjects to the system.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-800 flex items-center">
                        <FiGlobe className="mr-2 text-teal-600" />
                        Country {!isUsStudent ? "*" : ""}
                      </label>
                      {isUsStudent ? (
                        <div className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
                          USA (Pre-selected)
                          <input
                            type="hidden"
                            {...register("country")}
                            value="USA"
                          />
                        </div>
                      ) : (
                        <select
                          {...register("country", {
                            required: false, // Always optional - we'll handle in onSubmit
                          })}
                          className={`w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm font-medium transition-all duration-200 shadow-sm ${
                            errors.country
                              ? "border-red-500"
                              : "border-gray-200 hover:border-teal-300"
                          }`}
                        >
                          <option value="">Select country</option>
                          {Object.keys(groupedCountries)
                            .sort()
                            .map((letter) => (
                              <optgroup key={letter} label={letter}>
                                {groupedCountries[letter]
                                  .sort()
                                  .map((country, index) => (
                                    <option key={index} value={country}>
                                      {country}
                                    </option>
                                  ))}
                              </optgroup>
                            ))}
                        </select>
                      )}
                      {errors.country && (
                        <p className="mt-1 text-xs text-red-600 font-medium">
                          {errors.country.message}
                        </p>
                      )}
                    </div>

                 

                    {/* Subscription Package Config - Optional */}
                   
                    {/* For other roles, hide or auto-fill refer field */}
                    {session?.user?.role !== "registral" && (
                      <input type="hidden" {...register("refer")} />
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full py-4 px-6 sm:px-8 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 mt-8 text-base sm:text-lg ${
                      isSubmitting
                        ? "bg-teal-400"
                        : "bg-teal-600 hover:bg-teal-700"
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </span>
                    ) : editId ? (
                      "Update Registration"
                    ) : (
                      "Complete Registration"
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-10 text-center text-xs text-gray-600 border-t border-gray-200 pt-8">
              <p className="font-medium">
                © 2025 {schoolName}. All rights reserved.
              </p>
              <p className="mt-2">
                Need help? Contact us at{" "}
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-teal-600 hover:underline font-semibold"
                >
                  {supportEmail}
                </a>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Registration({
  params,
}: {
  params: { schoolSlug: string };
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegistrationContent />
    </Suspense>
  );
}