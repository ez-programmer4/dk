"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiPlus,
  FiEdit2,
  FiDollarSign,
} from "react-icons/fi";
import StudentList from "@/app/components/StudentList";
import { useSession } from "next-auth/react";

interface Student {
  id: number;
  name: string;
  phoneno: string;
  classfee: number;
  classfeeCurrency?: string;
  startdate: string;
  status: string;
  ustaz: string;
  ustazname?: string;
  package: string;
  subject: string;
  country: string;
  rigistral: string;
  daypackages: string;
  isTrained: boolean;
  refer: string;
  registrationdate: string;
  exitdate: string | null;
  progress: string;
  chatId: string | null;
}

export default function ControllerStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const schoolSlug = params.schoolSlug as string;

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (schoolSlug) {
      fetchStudents();
    }
  }, [schoolSlug, currentPage]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/controller/${schoolSlug}/students?page=${currentPage}&limit=12`
      );

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setTotalStudents(data.total || 0);
        setTotalPages(data.totalPages || 0);
      } else {
        console.error("Failed to fetch students");
        setStudents([]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    // Redirect to multi-tenant registral registration page
    router.push(`/registral/${schoolSlug}/registration?studentId=${student.id}&edit=true`);
  };

  const handleDeleteStudent = async (studentId: number) => {
    // This could be implemented later if needed
    console.log("Delete student:", studentId);
  };

  const handleStatusUpdate = async (studentId: number, newStatus: string) => {
    // This could be implemented later if needed
    console.log("Update status:", studentId, newStatus);
  };

  const handlePaymentManagement = (student: Student) => {
    // Redirect to payment management page
    router.push(`/controller/${schoolSlug}/students/${student.id}/payment-management`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans">
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Student Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage students assigned to your teachers in {schoolSlug}.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {students.filter(s => s.status === 'Active' || s.status === 'On Progress').length}
                </p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Students Found
              </h3>
              <p className="text-gray-500 mb-6">
                There are no students assigned to your teachers yet.
              </p>
              <button
                onClick={() => router.push(`/controller/${schoolSlug}/teachers`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Teachers
              </button>
            </div>
          ) : (
            <StudentList
              students={students}
              onEdit={handleEditStudent}
              onDelete={handleDeleteStudent}
              onStatusUpdate={handleStatusUpdate}
              onPaymentClick={handlePaymentManagement}
              user={session?.user ? {
                name: session.user.name || "",
                username: session.user.username || "",
                role: session.user.role || ""
              } : null}
              schoolSlug={schoolSlug}
            />
          )}
        </div>
      </div>
    </div>
  );
}
