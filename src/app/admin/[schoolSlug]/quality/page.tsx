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
import { FeatureGate } from "@/components/features";
import AdminQualityConfigPage from "./config-ui";
import AdminQualityReviewPage from "./review/page";

export default function AdminQualityTabsPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const [tab, setTab] = useState<"config" | "review">("config");

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-4 sm:p-6 lg:p-8 xl:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="p-3 sm:p-4 bg-black rounded-2xl shadow-lg">
              <FiTarget className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-black mb-1 sm:mb-2">
                Quality Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg xl:text-xl">
                Configure feedback categories and review weekly teacher quality
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
              <FeatureGate
                feature="advanced_analytics"
                fallback={
                  <button
                    className="flex-1 flex flex-col sm:flex-col items-center px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold transition-all duration-200 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-2 border-yellow-300 cursor-pointer hover:from-yellow-200 hover:to-orange-200"
                    onClick={() => setTab("review")}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <FiCheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-base sm:text-lg">Review Board ⭐</span>
                    </div>
                    <span className="text-xs sm:text-sm opacity-80 text-center">
                      Premium Feature - Upgrade Required
                    </span>
                  </button>
                }
              >
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
                    <span className="text-base sm:text-lg">Review Board ⭐</span>
                  </div>
                  <span className="text-xs sm:text-sm opacity-80 text-center">
                    Approve & manage quality
                  </span>
                </button>
              </FeatureGate>
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
              <AdminQualityConfigPage />
            ) : (
              <FeatureGate
                feature="advanced_analytics"
                fallback={
                  <div className="text-center py-12">
                    <div className="max-w-md mx-auto">
                      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-8 border-2 border-yellow-300">
                        <FiTarget className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-yellow-800 mb-2">
                          Premium Feature Required
                        </h3>
                        <p className="text-yellow-700 mb-4">
                          Quality Review Board is a premium feature that helps you manage teacher quality and performance reviews.
                        </p>
                        <div className="bg-white rounded-lg p-4 border border-yellow-200">
                          <h4 className="font-semibold text-yellow-800 mb-2">What you'll get:</h4>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Weekly quality assessments</li>
                            <li>• Performance-based bonuses</li>
                            <li>• Teacher improvement tracking</li>
                            <li>• Quality metrics dashboard</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              >
                <AdminQualityReviewPage />
              </FeatureGate>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
