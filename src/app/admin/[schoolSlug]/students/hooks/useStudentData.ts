"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";

interface Student {
  id: number;
  name: string;
  status: string;
  startDate: string | null;
  ustazName?: string;
  phone?: string;
  email?: string;
  registrationDate?: string;
  package?: string | null;
  subject?: string | null;
  daypackages?: string | null;
  classfee?: number | null;
  classfeeCurrency?: string | null;
  country?: string | null;
  progress?: string | null;
  chatId?: string | null;
  ustaz?: string | null;
  controller?: string | null;
  controllerCode?: string | null;
}

interface StatsAPI {
  overview: {
    totalStudents: number;
    totalActive: number;
    totalNotYet: number;
    activeRate: string;
  };
  monthly: {
    registered: number;
    started: number;
    left: number;
    conversionRate: string;
    retentionRate: string;
  };
  lifecycle: {
    prospects: number;
    active: number;
    churned: number;
    conversionRate: string;
  };
  trends: {
    registrations: Array<{ month: string; monthName: string; count: number }>;
    activations: Array<{ month: string; monthName: string; count: number }>;
  };
  breakdowns: {
    packages: Array<{ name: string; count: number; percentage: string }>;
  };
  payments: {
    currentMonth: {
      totalStudents: number;
      paidStudents: number;
      pendingStudents: number;
    };
  };
  attendance: {
    monthly: {
      present: number;
      absent: number;
      excused: number;
      total: number;
      attendanceRate: string;
    };
  };
  engagement: {
    withPhone: number;
    withTelegram: number;
    withReferral: number;
    contactRate: string;
    telegramRate: string;
    referralRate: string;
  };
  assignments: {
    assigned: number;
    unassigned: number;
    assignmentRate: string;
  };
}

export const useStudentData = () => {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;

  // Students state
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Stats state
  const [stats, setStats] = useState<StatsAPI | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/${schoolSlug}/students?${queryParams}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [schoolSlug, page, limit, searchQuery, statusFilter]);

  // Fetch stats
  const fetchGlobalStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await fetch(`/api/admin/${schoolSlug}/students/stats`, {
        credentials: "include",
        cache: "no-store",
      });
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Failed to fetch global stats:", err);
      toast.error("Failed to load analytics");
    } finally {
      setStatsLoading(false);
    }
  }, [schoolSlug]);

  // Effects
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchGlobalStats();
  }, [fetchGlobalStats]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  return {
    // Students data
    students,
    loading,
    page,
    setPage,
    totalPages,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    refetchStudents: fetchStudents,

    // Stats data
    stats,
    statsLoading,
    refetchStats: fetchGlobalStats,
  };
};






