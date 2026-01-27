"use client";

import React from "react";
import { motion } from "framer-motion";

// Simple Card components for skeleton
const Card = ({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={`rounded-lg border bg-white shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardContent = ({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

const SkeletonPulse = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-md bg-[length:200%_100%] animate-shimmer ${className}`}>
    &nbsp;
  </div>
);

const ModernStatCardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="bg-gradient-to-br from-white/80 via-gray-50/50 to-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl p-8 relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-gray-100/20 to-transparent opacity-0 animate-pulse" />
    <div className="flex items-center justify-between relative z-10">
      <div className="flex-1">
        <div className="flex items-center mb-4">
          <SkeletonPulse className="w-12 h-12 rounded-2xl mr-4" />
          <div className="space-y-2">
            <SkeletonPulse className="h-4 w-24" />
          </div>
        </div>
        <SkeletonPulse className="h-10 w-20 mb-4" />
        <SkeletonPulse className="h-4 w-32 rounded-full" />
      </div>
      <SkeletonPulse className="w-16 h-16 rounded-2xl" />
    </div>
  </motion.div>
);

const ModernChartSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6, delay: 0.2 }}
    className="bg-gradient-to-br from-white/90 via-white/80 to-white/90 backdrop-blur-xl border border-white/20 shadow-xl rounded-3xl p-8 relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 animate-pulse" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <SkeletonPulse className="w-14 h-14 rounded-2xl" />
          <div className="space-y-2">
            <SkeletonPulse className="h-6 w-48" />
            <SkeletonPulse className="h-4 w-32" />
          </div>
        </div>
        <div className="flex space-x-2">
          <SkeletonPulse className="w-8 h-8 rounded-lg" />
          <SkeletonPulse className="w-8 h-8 rounded-lg" />
        </div>
      </div>
      <div className="h-80 rounded-2xl overflow-hidden">
        <SkeletonPulse className="w-full h-full" />
        {/* Chart bars simulation */}
        <div className="absolute inset-0 flex items-end justify-around p-8">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${Math.random() * 60 + 20}%` }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                ease: "easeOut"
              }}
              className="bg-gradient-to-t from-blue-400/50 to-blue-600/50 rounded-t-lg flex-1 mx-1"
            />
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

const ModernActivitySkeleton = () => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.6, delay: 0.3 }}
    className="bg-gradient-to-br from-white/90 via-white/80 to-white/90 backdrop-blur-xl border border-white/20 shadow-xl rounded-3xl p-8 relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 animate-pulse" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <SkeletonPulse className="w-12 h-12 rounded-2xl" />
          <div>
            <SkeletonPulse className="h-6 w-32" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="flex items-start space-x-4 p-4 rounded-xl bg-white/50 border border-white/30"
          >
            <SkeletonPulse className="w-10 h-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-4 w-full" />
              <SkeletonPulse className="h-3 w-3/4" />
              <div className="flex space-x-2 pt-1">
                <SkeletonPulse className="h-3 w-16 rounded-full" />
                <SkeletonPulse className="h-3 w-20 rounded-full" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </motion.div>
);

export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex">
    {/* Sidebar Skeleton */}
    <div className="hidden lg:block w-70 bg-white/80 backdrop-blur-xl shadow-xl">
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center space-x-3">
          <SkeletonPulse className="w-10 h-10 rounded-xl" />
          <SkeletonPulse className="h-6 w-32" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <SkeletonPulse key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>

    {/* Main Content Skeleton */}
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header Skeleton */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 px-6 py-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SkeletonPulse className="w-8 h-8 rounded-lg lg:hidden" />
            <div>
              <SkeletonPulse className="h-8 w-48 mb-2" />
              <SkeletonPulse className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <SkeletonPulse className="w-64 h-10 rounded-xl hidden md:block" />
            <SkeletonPulse className="w-32 h-10 rounded-xl" />
            <SkeletonPulse className="w-10 h-10 rounded-xl" />
            <SkeletonPulse className="w-10 h-10 rounded-xl" />
            <SkeletonPulse className="w-10 h-10 rounded-xl" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <SkeletonPulse className="h-10 w-64 rounded-xl" />
          <div className="flex items-center space-x-4">
            <SkeletonPulse className="w-16 h-6 rounded-full" />
            <SkeletonPulse className="w-24 h-4 rounded" />
          </div>
        </div>
      </header>

      {/* Dashboard Content Skeleton */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Section Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-white/90 via-white/70 to-white/90 backdrop-blur-xl border border-white/20 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <SkeletonPulse className="h-8 w-96 mb-3" />
                <SkeletonPulse className="h-6 w-80 mb-6" />
                <div className="flex flex-wrap gap-4">
                  <SkeletonPulse className="h-12 w-48 rounded-full" />
                  <SkeletonPulse className="h-12 w-52 rounded-full" />
                  <SkeletonPulse className="h-12 w-44 rounded-full" />
                </div>
              </div>
              <SkeletonPulse className="w-32 h-32 rounded-3xl hidden md:block" />
            </div>
          </motion.div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ModernStatCardSkeleton />
            <ModernStatCardSkeleton />
            <ModernStatCardSkeleton />
            <ModernStatCardSkeleton />
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ModernChartSkeleton />
            <ModernChartSkeleton />
          </div>

          {/* Additional Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white/80 via-gray-50/50 to-white/80 backdrop-blur-xl rounded-2xl p-6">
                <CardHeader className="pb-4">
                  <SkeletonPulse className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <SkeletonPulse className="h-12 w-full rounded-xl" />
                  <SkeletonPulse className="h-12 w-full rounded-xl" />
                  <SkeletonPulse className="h-12 w-full rounded-xl" />
                </CardContent>
              </Card>
            </motion.div>

            <ModernActivitySkeleton />

            {/* System Health Skeleton */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-8">
                <CardContent>
                  <div className="grid grid-cols-2 gap-8">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="text-center">
                        <SkeletonPulse className="w-16 h-16 mx-auto mb-4 rounded-2xl" />
                        <SkeletonPulse className="h-5 w-16 mx-auto mb-2" />
                        <SkeletonPulse className="h-4 w-20 mx-auto" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  </div>
);
