"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  FiList,
  FiCheckCircle,
  FiSettings,
  FiInfo,
  FiTarget,
} from "react-icons/fi";
import AdminQualityConfigPage from "./config-ui";
import AdminQualityReviewPage from "./review/page";

export default function AdminQualityTabsPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const [tab, setTab] = useState<"config" | "review">("config");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Enhanced Header with School Branding */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-4 sm:p-6 lg:p-8 xl:p-10">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-50/30 via-transparent to-purple-50/30 rounded-3xl" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+PC9zdmc+')] opacity-30" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg">
              <FiTarget className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              {/* Status & School Info */}
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center gap-2 text-green-600 font-medium text-sm bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  System Online
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md font-medium">
                  School: {schoolSlug}
                </span>
              </div>

              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
                Quality Management
              </h1>
              <p className="text-gray-600 text-lg font-medium">
                Configure feedback categories and review teacher performance for {schoolSlug}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-gray-50 rounded-2xl p-2 border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                className={`flex-1 flex flex-col sm:flex-col items-center px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold transition-all duration-200 ${
                  tab === "config"
                    ? "bg-black text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
                onClick={() => setTab("config")}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <FiList className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-base sm:text-lg">
                    Quality Categories
                  </span>
                </div>
                <span className="text-xs sm:text-sm opacity-80 text-center">
                  Manage feedback options
                </span>
              </button>
              <button
                className={`flex-1 flex flex-col sm:flex-col items-center px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold transition-all duration-200 ${
                  tab === "review"
                    ? "bg-black text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
                onClick={() => setTab("review")}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <FiCheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-base sm:text-lg">Review Board</span>
                </div>
                <span className="text-xs sm:text-sm opacity-80 text-center">
                  Approve & manage quality
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-4 sm:p-6 lg:p-8 xl:p-10">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-xl self-start">
              <FiInfo className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              {tab === "config" ? (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-black mb-2 sm:mb-3">
                    Quality Categories
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base lg:text-lg leading-relaxed">
                    Add, edit, or remove the positive and negative feedback
                    categories that controllers can use when evaluating
                    teachers. These categories will appear in the controller
                    feedback form.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-black mb-2 sm:mb-3">
                    Review Board
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base lg:text-lg leading-relaxed">
                    Review, approve, or override weekly teacher quality ratings.
                    You can also allocate bonuses for exceptional performance.
                    Teachers with "Bad" quality will appear in a special section
                    for review/removal.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
            {tab === "config" ? (
              <AdminQualityConfigPage schoolSlug={schoolSlug} />
            ) : (
              <AdminQualityReviewPage schoolSlug={schoolSlug} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
