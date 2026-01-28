"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { FiStar, FiUsers, FiTrendingUp, FiAward } from "react-icons/fi";

interface TeacherRating {
  id: number;
  teacherId: number;
  teacherName: string;
  averageRating: number;
  totalReviews: number;
  recentRating: number;
  ratingTrend: "up" | "down" | "stable";
  topStrengths: string[];
}

export default function ControllerRatingsPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;

  const [ratings, setRatings] = useState<TeacherRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for teacher ratings
    const mockRatings: TeacherRating[] = [
      {
        id: 1,
        teacherId: 101,
        teacherName: "Ahmed Hassan",
        averageRating: 4.8,
        totalReviews: 45,
        recentRating: 4.9,
        ratingTrend: "up",
        topStrengths: ["Engaging Teaching", "Patient", "Knowledgeable"],
      },
      {
        id: 2,
        teacherId: 102,
        teacherName: "Fatima Al-Zahra",
        averageRating: 4.6,
        totalReviews: 38,
        recentRating: 4.7,
        ratingTrend: "up",
        topStrengths: ["Clear Communication", "Structured Lessons", "Supportive"],
      },
      {
        id: 3,
        teacherId: 103,
        teacherName: "Omar Khalid",
        averageRating: 4.4,
        totalReviews: 29,
        recentRating: 4.3,
        ratingTrend: "stable",
        topStrengths: ["Experienced", "Methodical", "Dedicated"],
      },
      {
        id: 4,
        teacherId: 104,
        teacherName: "Aisha Mahmoud",
        averageRating: 4.2,
        totalReviews: 22,
        recentRating: 4.1,
        ratingTrend: "down",
        topStrengths: ["Caring", "Patient", "Encouraging"],
      },
    ];

    setTimeout(() => {
      setRatings(mockRatings);
      setLoading(false);
    }, 1000);
  }, [schoolSlug]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <FiTrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <FiTrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-400"></div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-md">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
              Teacher Ratings & Reviews
            </h1>
            <p className="text-gray-600">
              Monitor teacher performance and feedback from students and parents for {schoolSlug}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <FiAward className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Average Rating</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {(ratings.reduce((sum, r) => sum + r.averageRating, 0) / ratings.length).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <FiUsers className="h-6 w-6 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Total Reviews</p>
                  <p className="text-2xl font-bold text-green-900">
                    {ratings.reduce((sum, r) => sum + r.totalReviews, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <FiTrendingUp className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-900">Top Performers</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {ratings.filter(r => r.averageRating >= 4.5).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {ratings.map((rating) => (
              <motion.div
                key={rating.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {rating.teacherName}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(rating.ratingTrend)}
                        <span className="text-xs text-gray-500">
                          {rating.ratingTrend === "up" ? "Improving" :
                           rating.ratingTrend === "down" ? "Declining" : "Stable"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                        {renderStars(Math.round(rating.averageRating))}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Recent Rating</p>
                        {renderStars(Math.round(rating.recentRating))}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {rating.totalReviews}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-2">Top Strengths:</p>
                      <div className="flex flex-wrap gap-2">
                        {rating.topStrengths.map((strength, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                          >
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

















