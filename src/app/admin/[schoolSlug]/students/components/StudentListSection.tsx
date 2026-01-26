"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiMoreVertical,
  FiUser,
  FiPhone,
  FiMail,
  FiCalendar,
  FiMapPin,
  FiBook,
  FiCheckCircle,
  FiClock,
  FiXCircle,
} from "react-icons/fi";

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

interface StudentListSectionProps {
  students: Student[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
}

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    active: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: FiCheckCircle,
      label: "Active",
    },
    inactive: {
      color: "bg-red-100 text-red-800 border-red-200",
      icon: FiXCircle,
      label: "Inactive",
    },
    pending: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: FiClock,
      label: "Pending",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
};

const StudentRow = ({
  student,
  onView,
  onEdit,
}: {
  student: Student;
  onView: () => void;
  onEdit: () => void;
}) => (
  <motion.tr
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="hover:bg-gray-50/50 transition-colors duration-200"
  >
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
          <FiUser className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{student.name}</div>
          <div className="text-xs text-gray-500">ID: {student.id}</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <StatusBadge status={student.status} />
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      <div className="flex items-center">
        <FiPhone className="h-4 w-4 text-gray-400 mr-2" />
        {student.phone || "N/A"}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      <div className="flex items-center">
        <FiBook className="h-4 w-4 text-gray-400 mr-2" />
        {student.subject || "N/A"}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      <div className="flex items-center">
        <FiUser className="h-4 w-4 text-gray-400 mr-2" />
        {student.ustazName || "Unassigned"}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      <div className="flex items-center">
        <FiCalendar className="h-4 w-4 text-gray-400 mr-2" />
        {student.registrationDate ? new Date(student.registrationDate).toLocaleDateString() : "N/A"}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <div className="flex items-center justify-end gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onView}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <FiEye className="h-4 w-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onEdit}
          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        >
          <FiEdit className="h-4 w-4" />
        </motion.button>
      </div>
    </td>
  </motion.tr>
);

export const StudentListSection: React.FC<StudentListSectionProps> = ({
  students,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onViewStudent,
  onEditStudent,
}) => {
  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Students</h2>
          <span className="text-sm text-gray-500">
            {students.length} students
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/50">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Teacher
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Registered
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white/50 divide-y divide-gray-200/30">
            {students.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                onView={() => onViewStudent(student)}
                onEdit={() => onEditStudent(student)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200/50 bg-gray-50/30">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};










