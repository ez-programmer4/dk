"use client";

import React from "react";
import { FiBarChart3 } from "react-icons/fi";

interface StudentKPIDashboardProps {
  stats: any;
}

const StudentKPIDashboard: React.FC<StudentKPIDashboardProps> = ({ stats }) => {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <FiBarChart3 className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Student KPI Dashboard</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats?.overview?.totalStudents || 0}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats?.overview?.totalActive || 0}</div>
          <div className="text-sm text-gray-600">Active Students</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{stats?.lifecycle?.conversionRate || "0"}%</div>
          <div className="text-sm text-gray-600">Conversion Rate</div>
        </div>
      </div>
    </div>
  );
};

export default StudentKPIDashboard;


















