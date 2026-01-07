"use client";

import { useEffect, useState, useRef } from "react";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
dayjs.extend(weekday);
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import {
  FiUsers,
  FiCheckCircle,
  FiAlertTriangle,
  FiAward,
  FiDownload,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";
import JSConfetti from "js-confetti";
import ActiveMeetingsPanel from "@/components/teacher/ActiveMeetingsPanel";
import { useParams } from "next/navigation";

type QualityData = {
  rating: string;
  ratingColor: string;
  strengths: { title: string; note: string; rating?: number }[];
  focuses: { title: string; note: string; rating?: number }[];
  studentsPassed: number;
  studentsTotal: number;
  avgExaminerRating: number;
  bonusAmount?: number;
  advice: string;
  examinerNotes?: string;
};

export default function TeacherDashboard() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;

  const { user, isLoading: authLoading } = useAuth({
    requiredRole: "teacher",
    redirectTo: `/${schoolSlug}/teachers/login`,
  });
  const confettiRef = useRef<JSConfetti | null>(null);

  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [quality, setQuality] = useState<QualityData | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [positiveFeedbackOpen, setPositiveFeedbackOpen] = useState(false);
  const [negativeFeedbackOpen, setNegativeFeedbackOpen] = useState(false);
  const [todayClasses, setTodayClasses] = useState<
    {
      time: string;
      daypackage: string;
      studentId: number;
      studentName: string;
      subject: string;
    }[]
  >([]);
  const [monthWeeks, setMonthWeeks] = useState<string[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  // Fetch school information
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        const res = await fetch(`/api/${schoolSlug}/school`);
        if (res.ok) {
          const data = await res.json();
          setSchoolInfo(data);
        }
      } catch (error) {
        console.error("Error fetching school info:", error);
      }
    };
    fetchSchoolInfo();
  }, [schoolSlug]);

  useEffect(() => {
    confettiRef.current = new JSConfetti();
    return () => {
      confettiRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!user) return; // Wait for authentication

    async function loadToday() {
      try {
        const res = await fetch(`/api/${schoolSlug}/teachers/today-classes`, {
          cache: "no-store",
        });
        if (!res.ok) {
          console.error(
            "Failed to load today classes:",
            res.status,
            res.statusText
          );
          return;
        }
        const data = await res.json();
        console.log("Today classes data:", data);
        setTodayClasses(data.classes || []);
      } catch (error) {
        console.error("Error loading today classes:", error);
      }
    }
    loadToday();
  }, [schoolSlug, user]);

  useEffect(() => {
    // Calculate all Mondays (or week starts) in the current month
    const now = dayjs();
    const startOfMonth = now.startOf("month");
    const endOfMonth = now.endOf("month");
    let weekStart = startOfMonth.startOf("week").add(1, "day"); // Monday
    const weeks: string[] = [];
    while (weekStart.isBefore(endOfMonth)) {
      if (weekStart.month() === now.month()) {
        weeks.push(weekStart.format("YYYY-MM-DD"));
      }
      weekStart = weekStart.add(1, "week");
    }
    setMonthWeeks(weeks);
  }, []);

  useEffect(() => {
    // Set the current week as default when monthWeeks are calculated
    if (monthWeeks.length > 0) {
      const currentWeekStart = dayjs()
        .startOf("week")
        .add(1, "day")
        .format("YYYY-MM-DD");
      const currentWeekIndex = monthWeeks.findIndex(
        (w) => w === currentWeekStart
      );
      if (currentWeekIndex !== -1) {
        setSelectedWeek(monthWeeks[currentWeekIndex]);
      } else {
        // If current week not found, select the last week of the month
        setSelectedWeek(monthWeeks[monthWeeks.length - 1]);
      }
    }
  }, [monthWeeks]);

  useEffect(() => {
    if (!selectedWeek || !user) return;
    async function fetchQuality() {
      try {
        setQualityLoading(true);
        setError(null);
        let res = await fetch(
          `/api/${schoolSlug}/teachers/quality?weekStart=${selectedWeek}`
        );
        console.log("Quality API response:", res.status, res.statusText);

        if (res.status === 404) {
          const sundayStart = dayjs(selectedWeek)
            .subtract(1, "day")
            .format("YYYY-MM-DD");
          console.log("Trying Sunday start:", sundayStart);
          res = await fetch(
            `/api/${schoolSlug}/teachers/quality?weekStart=${sundayStart}`
          );
          console.log("Sunday API response:", res.status, res.statusText);
        }

        if (res.status === 404) {
          console.log("No quality data found");
          setQuality(null);
          return;
        }
        if (!res.ok) {
          console.error("Quality API failed:", res.status, res.statusText);
          throw new Error("Failed to fetch quality data");
        }

        const data = await res.json();
        console.log("Quality data:", data);
        const assessment = data.teachers.find(
          (t: any) => t.teacherId === user?.id
        );
        if (assessment) {
          const strengths = (assessment.controllerFeedback?.positive || []).map(
            (item: any) => ({
              title: item.description || item.title || "Strength",
              note: item.note || "",
              rating: item.rating,
            })
          );
          const focuses = (assessment.controllerFeedback?.negative || []).map(
            (item: any) => ({
              title: item.description || item.title || "Focus",
              note: item.note || "",
              rating: item.rating,
            })
          );
          const ratingColorMap: Record<string, string> = {
            Bad: "red",
            Good: "yellow",
            Better: "blue",
            Excellent: "green",
            Exceptional: "teal",
          };
          const qualityData = {
            rating: assessment.overallQuality || "N/A",
            ratingColor: ratingColorMap[assessment.overallQuality] || "gray",
            strengths,
            focuses,
            studentsPassed: assessment.examPassRate ?? 0,
            studentsTotal: assessment.studentsTotal ?? 0,
            avgExaminerRating: assessment.examinerRating || 0,
            bonusAmount: assessment.bonusAwarded,
            advice: assessment.overrideNotes || "",
            examinerNotes: assessment.examinerNotes || "",
          };
          setQuality(qualityData);
          setError(null);

          if (assessment.bonusAwarded) {
            confettiRef.current?.addConfetti({
              emojis: ["🎉", "🏆", "💰"],
              emojiSize: 30,
              confettiNumber: 100,
            });
          }
        } else {
          setQuality(null);
        }
      } catch (err) {
        setQuality(null);
        setError("Unable to load quality data. Please try again later.");
      } finally {
        setQualityLoading(false);
      }
    }
    fetchQuality();
  }, [selectedWeek, user, schoolSlug]);

  useEffect(() => {
    if (!user) return; // Wait for authentication

    async function fetchStudentCount() {
      try {
        const res = await fetch(`/api/${schoolSlug}/teachers/students`);
        if (!res.ok) {
          console.error(
            "Failed to fetch student count:",
            res.status,
            res.statusText
          );
          throw new Error("Failed to fetch student count");
        }
        const data = await res.json();
        console.log("Student count data:", data);
        setStudentCount(data.count || 0);
      } catch (err) {
        console.error("Error fetching student count:", err);
        setError("Unable to load student count. Please try again later.");
      }
    }
    fetchStudentCount();
  }, [schoolSlug, user]);

  const downloadReport = () => {
    if (!quality) return;
    const reportContent = `
Teacher Quality Report
Week: ${dayjs(selectedWeek).format("MMM D, YYYY")}
Teacher: ${user?.name} (ID: ${user?.id})

Quality Rating: ${quality.rating}
Students Passed: ${quality.studentsPassed}/${quality.studentsTotal}
Average Examiner Rating: ${quality.avgExaminerRating}/10
Bonus: ${quality.bonusAmount ? `${quality.bonusAmount} ETB` : "None"}

Strengths:
${quality.strengths.map((s) => `- ${s.title}: ${s.note}`).join("\n")}

Focuses:
${quality.focuses.map((f) => `- ${f.title}: ${f.note}`).join("\n")}

Advice:
${quality.advice || "No advice provided."}

Examiner Notes:
${quality.examinerNotes || "No notes provided."}
    `;
    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Teacher_Quality_Report_${selectedWeek}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return <PageLoading />;
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-red-600 font-bold animate-slide-in">
        <FiAlertTriangle className="inline-block mr-2 h-6 w-6" />
        User not found or not authorized. Please contact support.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome Header */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden ${
          schoolInfo?.primaryColor
            ? ""
            : "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"
        }`}
        style={
          schoolInfo?.primaryColor
            ? {
                background: `linear-gradient(135deg, ${
                  schoolInfo.primaryColor
                }, ${schoolInfo.secondaryColor || schoolInfo.primaryColor}dd, ${
                  schoolInfo.primaryColor
                }aa)`,
                boxShadow: `0 25px 50px -12px ${schoolInfo.primaryColor}40, 0 20px 25px -5px rgba(0, 0, 0, 0.1)`,
              }
            : {}
        }
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-15">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.8) 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        {/* Brand color accent overlay */}
        {schoolInfo?.primaryColor && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${
                schoolInfo.primaryColor
              }60 0%, transparent 50%), radial-gradient(circle at 70% 80%, ${
                schoolInfo.secondaryColor || schoolInfo.primaryColor
              }40 0%, transparent 50%)`,
            }}
          />
        )}

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1
                className={`text-2xl sm:text-3xl font-bold mb-2 ${
                  schoolInfo?.primaryColor
                    ? ""
                    : "text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-100"
                }`}
                style={
                  schoolInfo?.primaryColor
                    ? {
                        color: "white",
                        textShadow: `0 2px 4px ${schoolInfo.primaryColor}40`,
                      }
                    : {}
                }
              >
                Welcome back, {user?.name?.split(" ")[0] || "Teacher"}! 👋
              </h1>
              <p
                className={`text-lg ${
                  schoolInfo?.primaryColor ? "text-white/90" : "text-blue-100"
                }`}
                style={schoolInfo?.primaryColor ? {} : {}}
              >
                Here's your teaching overview for today
              </p>
            </div>
            <div className="hidden sm:block">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm ${
                  schoolInfo?.primaryColor ? "bg-white/20" : "bg-white/20"
                }`}
                style={
                  schoolInfo?.primaryColor
                    ? {
                        backgroundColor: `${schoolInfo.primaryColor}20`,
                        backdropFilter: "blur(8px)",
                      }
                    : {}
                }
              >
                <FiUsers className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
                  <FiUsers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">
                    Total Students
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {studentCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
                  <FiCheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">
                    Today's Classes
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {todayClasses.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
                  <FiAward className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">
                    Quality Rating
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {quality?.rating || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-xl">
              <FiAlertTriangle className="text-red-600 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-red-800 font-semibold">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Classes - Enhanced */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6 overflow-hidden">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
            <FiCheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Today's Classes
            </h2>
            <p className="text-gray-600">Your scheduled classes for today</p>
          </div>
        </div>

        {todayClasses.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FiUsers className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Classes Today
            </h3>
            <p className="text-gray-500">Enjoy your day off! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayClasses.map((c, i) => (
              <div
                key={i}
                className="group bg-gradient-to-r from-gray-50 to-blue-50/30 border border-gray-200/50 rounded-2xl p-4 hover:shadow-lg hover:border-blue-200/50 transition-all duration-300 hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Student Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white font-bold text-sm">
                        {c.studentName.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg truncate">
                        {c.studentName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                          {c.subject || "General"}
                        </span>
                        <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-lg font-medium">
                          {c.daypackage}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Time Badge */}
                  <div className="flex-shrink-0 ml-4">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-2xl font-bold text-sm shadow-lg">
                      {(() => {
                        const [hours, minutes] = c.time.split(":");
                        const hour = parseInt(hours);
                        const ampm = hour >= 12 ? "PM" : "AM";
                        const displayHour = hour % 12 || 12;
                        return `${displayHour}:${minutes} ${ampm}`;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Week Selector & Performance Overview */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-2xl shadow-lg">
            <FiAward className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Performance Overview
            </h2>
            <p className="text-gray-600">
              Select a week to view your quality metrics
            </p>
          </div>
        </div>

        {/* Week Selector */}
        <div className="mb-6">
          <label className="font-semibold text-gray-900 text-lg mb-3 block">
            Select Week
          </label>
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {monthWeeks.map((week, idx) => {
              const isCurrentWeek =
                week ===
                dayjs().startOf("week").add(1, "day").format("YYYY-MM-DD");
              const isSelected = selectedWeek === week;
              return (
                <button
                  key={week}
                  className={`flex-shrink-0 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 hover:scale-105 ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105"
                      : isCurrentWeek
                      ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-2 border-blue-200 shadow-md"
                      : "bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                  onClick={() => setSelectedWeek(week)}
                >
                  <div className="text-center">
                    <div className="font-bold">W{idx + 1}</div>
                    {isCurrentWeek && (
                      <div className="text-xs opacity-90">(Current)</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Performance Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            icon={<FiUsers className="w-6 h-6" />}
            label="Total Students"
            value={studentCount}
            color="blue"
            bgGradient="from-blue-500 to-cyan-500"
          />
          <StatsCard
            icon={<FiCheckCircle className="w-6 h-6" />}
            label="Pass Rate"
            value={
              quality
                ? Math.round(
                    ((quality.studentsPassed || 0) /
                      (quality.studentsTotal || 1)) *
                      100
                  )
                : 0
            }
            color="green"
            unit="%"
            bgGradient="from-green-500 to-emerald-500"
          />
          <StatsCard
            icon={<FiAward className="w-6 h-6" />}
            label="Examiner Rating"
            value={quality?.avgExaminerRating || 0}
            color="yellow"
            unit="/10"
            bgGradient="from-yellow-500 to-orange-500"
          />
          <StatsCard
            icon={<FiAward className="w-6 h-6" />}
            label="Bonus Earned"
            value={quality?.bonusAmount || 0}
            color="purple"
            unit=" ETB"
            bgGradient="from-purple-500 to-pink-500"
          />
        </div>

        {/* Download Report Button */}
        {quality && (
          <div className="flex justify-center">
            <Button
              onClick={downloadReport}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
            >
              <FiDownload className="w-5 h-5" />
              Download Performance Report
            </Button>
          </div>
        )}
      </div>

      {/* Quality Overview */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6">
        {qualityLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading quality data...</p>
          </div>
        ) : quality ? (
          <div className="space-y-6">
            {/* Quality Header */}
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                <FiCheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Quality Assessment
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-600">Overall Rating:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      quality.rating === "Exceptional"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : quality.rating === "Excellent"
                        ? "bg-gradient-to-r from-green-500 to-teal-500 text-white"
                        : quality.rating === "Better"
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                        : quality.rating === "Good"
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                        : "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                    }`}
                  >
                    {quality.rating}
                  </span>
                </div>
              </div>
            </div>

            {/* Bonus Section */}
            {quality.bonusAmount ? (
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-6 rounded-3xl text-center text-white shadow-2xl relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `radial-gradient(circle at 3px 3px, white 2px, transparent 0)`,
                      backgroundSize: "30px 30px",
                    }}
                  />
                </div>

                <div className="relative">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <FiAward className="w-8 h-8" />
                    <h3 className="text-2xl font-bold">Bonus Awarded!</h3>
                  </div>

                  <p className="text-5xl font-bold mb-3 text-yellow-200">
                    {quality.bonusAmount.toLocaleString()} ETB
                  </p>

                  <p className="text-lg opacity-90 mb-6">
                    🎉 Congratulations on your outstanding performance!
                  </p>

                  <Button
                    onClick={() =>
                      confettiRef.current?.addConfetti({
                        emojis: ["🎉", "🏆", "💰", "⭐", "🌟"],
                        emojiSize: 40,
                        confettiNumber: 150,
                      })
                    }
                    className="bg-white text-purple-600 hover:bg-yellow-50 font-bold py-3 px-8 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    🎊 Celebrate! 🎊
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 rounded-2xl text-center border border-gray-200">
                <div className="bg-gray-200 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FiAward className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-gray-600 font-medium text-lg">
                  No bonus this week
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Keep up the great work for next time!
                </p>
              </div>
            )}

            {/* Feedback Sections */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Strengths */}
              <div className="bg-white/80 backdrop-blur-sm border border-green-200/50 rounded-2xl overflow-hidden shadow-lg">
                <button
                  onClick={() => setPositiveFeedbackOpen(!positiveFeedbackOpen)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-green-50/50 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FiCheckCircle className="text-white h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Strengths
                      </h3>
                      <p className="text-sm text-gray-600">
                        {quality.strengths.length} areas identified
                      </p>
                    </div>
                  </div>
                  <div
                    className={`transform transition-transform duration-300 ${
                      positiveFeedbackOpen ? "rotate-180" : ""
                    }`}
                  >
                    <FiChevronDown className="text-gray-400 h-5 w-5" />
                  </div>
                </button>

                {positiveFeedbackOpen && (
                  <div className="px-5 pb-5 animate-fade-in-up">
                    {quality.strengths.length > 0 ? (
                      <div className="space-y-3">
                        {quality.strengths.map((s, i) => (
                          <div
                            key={i}
                            className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl p-4 hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="bg-green-100 p-2 rounded-lg mt-0.5">
                                <FiCheckCircle className="text-green-600 h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-green-800 text-base mb-1">
                                  {s.title}
                                </div>
                                {s.note && (
                                  <div className="text-sm text-gray-700 leading-relaxed">
                                    {s.note}
                                  </div>
                                )}
                                {typeof s.rating === "number" && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="text-xs text-gray-600">
                                      Rating:
                                    </div>
                                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">
                                      {s.rating}/10
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="bg-green-100 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <FiCheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-gray-600 font-medium">
                          No strengths recorded yet
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          Great performance areas will appear here
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Areas for Improvement */}
              <div className="bg-white/80 backdrop-blur-sm border border-orange-200/50 rounded-2xl overflow-hidden shadow-lg">
                <button
                  onClick={() => setNegativeFeedbackOpen(!negativeFeedbackOpen)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-orange-50/50 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FiAlertTriangle className="text-white h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Areas for Improvement
                      </h3>
                      <p className="text-sm text-gray-600">
                        {quality.focuses.length} areas identified
                      </p>
                    </div>
                  </div>
                  <div
                    className={`transform transition-transform duration-300 ${
                      negativeFeedbackOpen ? "rotate-180" : ""
                    }`}
                  >
                    <FiChevronDown className="text-gray-400 h-5 w-5" />
                  </div>
                </button>

                {negativeFeedbackOpen && (
                  <div className="px-5 pb-5 animate-fade-in-up">
                    {quality.focuses.length > 0 ? (
                      <div className="space-y-3">
                        {quality.focuses.map((f, i) => (
                          <div
                            key={i}
                            className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200/50 rounded-xl p-4 hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="bg-orange-100 p-2 rounded-lg mt-0.5">
                                <FiAlertTriangle className="text-orange-600 h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-orange-800 text-base mb-1">
                                  {f.title}
                                </div>
                                {f.note && (
                                  <div className="text-sm text-gray-700 leading-relaxed">
                                    {f.note}
                                  </div>
                                )}
                                {typeof f.rating === "number" && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="text-xs text-gray-600">
                                      Rating:
                                    </div>
                                    <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs font-bold">
                                      {f.rating}/10
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="bg-orange-100 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <FiAlertTriangle className="w-6 h-6 text-orange-600" />
                        </div>
                        <p className="text-gray-600 font-medium">
                          No improvement areas recorded
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          Areas for growth will appear here
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Examiner Notes */}
            {quality.examinerNotes && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-5 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-xl shadow-lg">
                    <FiAward className="text-white h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 text-lg mb-2">
                      Examiner Notes
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {quality.examinerNotes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Advice Section */}
            {quality.advice && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 rounded-2xl p-5 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl shadow-lg">
                    <FiCheckCircle className="text-white h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-purple-900 text-lg mb-2">
                      Advice & Recommendations
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {quality.advice}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiAward className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No Quality Data Yet
            </h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
              Quality assessment data will appear here once your performance
              review is complete for the selected week.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <FiAlertTriangle className="w-4 h-4" />
              <span>Please check back later or select a different week</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatsCard({
  icon,
  label,
  value,
  color,
  unit = "",
  bgGradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  unit?: string;
  bgGradient?: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; shadow: string }> =
    {
      blue: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        shadow: "shadow-blue-500/20",
      },
      green: {
        bg: "bg-green-50",
        text: "text-green-700",
        shadow: "shadow-green-500/20",
      },
      yellow: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        shadow: "shadow-yellow-500/20",
      },
      purple: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        shadow: "shadow-purple-500/20",
      },
    };
  const classes = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 hover:scale-105 group ${classes.shadow}`}
    >
      <div className="flex items-center gap-4">
        {/* Icon with gradient background */}
        <div
          className={`p-3 rounded-2xl flex-shrink-0 ${
            bgGradient ? `bg-gradient-to-r ${bgGradient}` : classes.bg
          } shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          <div className="text-white">{icon}</div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-600 mb-1 truncate">
            {label}
          </h3>
          <p
            className={`text-2xl font-bold ${classes.text} truncate flex items-baseline gap-1`}
          >
            {typeof value === "number" ? value.toLocaleString() : value}
            <span className="text-sm font-normal opacity-75">{unit}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
