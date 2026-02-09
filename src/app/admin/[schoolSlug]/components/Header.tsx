"use client";

import { useState, useEffect } from "react";
import { FiLogOut, FiUser, FiMenu, FiBell } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useRef } from "react";

interface User {
  name: string;
}

interface HeaderProps {
  pageTitle: string;
  userName: string;
  onMenuClick: () => void;
}

export default function Header({
  pageTitle,
  userName,
  onMenuClick,
}: HeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Temporarily disable notifications due to database schema mismatch
    // async function fetchUnread() {
    //   const res = await fetch("/api/admin/notifications?unread=1");
    //   if (res.ok) {
    //     const data = await res.json();
    //     setUnreadCount(Array.isArray(data) ? data.length : 0);
    //   }
    // }
    // fetchUnread();
    // const interval = setInterval(fetchUnread, 30000); // Poll every 30s
    // return () => clearInterval(interval);
    setUnreadCount(0); // Set to 0 temporarily
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (!notifOpen) return;
    // Temporarily disable notifications due to database schema mismatch
    // setNotifLoading(true);
    // fetch("/api/admin/notifications?limit=10")
    //   .then((res) => (res.ok ? res.json() : []))
    //   .then((data) => setNotifications(Array.isArray(data) ? data : []))
    //   .finally(() => setNotifLoading(false));
    setNotifications([]); // Set to empty array temporarily
    setNotifLoading(false);
  }, [notifOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return;
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  async function markAsRead(id: string) {
    await fetch(`/api/admin/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllAsRead() {
    await fetch(`/api/admin/notifications`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: `${window.location.origin}/login` });
    } catch (error) {
      }
  };

  return (
    <header className="flex-shrink-0 bg-white/95 backdrop-blur-xl border-b border-white/20 shadow-lg sticky top-0 z-30 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-indigo-50/30" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

      <div className="relative flex items-center justify-between px-6 py-4 sm:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <FiMenu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              {pageTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Welcome Message */}
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <FiUser className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-700">Welcome back</span>
              <span className="text-xs text-gray-500 font-medium">
                {session?.user?.name || userName}
              </span>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-xl transition-all duration-200 hover:scale-105"
              onClick={() => setNotifOpen((o) => !o)}
              aria-label="Notifications"
            >
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full px-2 py-0.5 font-bold border-2 border-white shadow-lg animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-3 w-96 bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <FiBell className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-gray-900">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-semibold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    Mark all read
                  </button>
                </div>

                {/* Content */}
                <div className="max-h-80 overflow-y-auto">
                  {notifLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-500 mx-auto mb-3"></div>
                      <p className="text-gray-600 font-medium">Loading notifications...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-3">
                        <FiBell className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No notifications yet</p>
                      <p className="text-sm text-gray-400 mt-1">We'll notify you when there's something new</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100/50">
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          className={`w-full text-left px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 group ${
                            n.read ? "" : "bg-gradient-to-r from-blue-50/30 to-indigo-50/30 border-l-4 border-blue-500"
                          }`}
                          onClick={() => markAsRead(n.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg mt-0.5 ${
                              n.read
                                ? 'bg-gray-100 text-gray-500'
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              <FiBell className="h-3 w-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-sm leading-tight ${
                                n.read ? "text-gray-700" : "text-gray-900"
                              }`}>
                                {n.title || n.message || "Notification"}
                              </p>
                              {n.createdAt && (
                                <p className="text-xs text-gray-500 mt-1 font-medium">
                                  {new Date(n.createdAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
