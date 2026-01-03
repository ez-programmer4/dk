"use client";

import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import ControllerSidebar from "./ControllerSidebar";

export default function ControllerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 text-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 flex z-50 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl">
            <div className="absolute top-0 right-0 -mr-12 pt-3 z-10">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <FiX className="h-6 w-6 text-white" />
              </button>
            </div>
            <ControllerSidebar />
          </div>
          <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <aside className="hidden md:flex md:flex-shrink-0 h-screen sticky top-0">
        <div className="w-72 h-screen sticky top-0 overflow-y-auto shadow-2xl">
          <ControllerSidebar />
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Mobile header */}
        <header className="md:hidden bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="text-gray-600 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 rounded-lg p-2 hover:bg-indigo-50 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <FiMenu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Controller Panel
            </h1>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
