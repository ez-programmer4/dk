"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FiBell, FiCheck, FiClock, FiAlertTriangle, FiInfo } from "react-icons/fi";
import { useParams } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export default function TeacherNotificationsPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      try {
        const res = await fetch(`/api/teachers/notifications?schoolSlug=${schoolSlug}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [schoolSlug]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/teachers/notifications/${notificationId}/read`, {
        method: "POST",
      });
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "permission_request":
        return <FiClock className="w-5 h-5 text-blue-600" />;
      case "system_alert":
        return <FiAlertTriangle className="w-5 h-5 text-red-600" />;
      case "info":
        return <FiInfo className="w-5 h-5 text-green-600" />;
      default:
        return <FiBell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "permission_request":
        return "border-blue-200 bg-blue-50";
      case "system_alert":
        return "border-red-200 bg-red-50";
      case "info":
        return "border-green-200 bg-green-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with important announcements and requests</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {notifications.filter(n => !n.read).length} unread
        </Badge>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <FiBell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
              <p className="text-gray-600">You're all caught up! No new notifications at this time.</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`${getNotificationColor(notification.type)} ${
                notification.read ? "opacity-75" : "ring-1 ring-blue-200"
              } transition-all`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getNotificationIcon(notification.type)}
                    <div>
                      <CardTitle className="text-base capitalize">
                        {notification.type.replace("_", " ")}
                      </CardTitle>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {!notification.read && (
                    <Badge variant="default" className="text-xs">
                      New
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-4">
                  <p className="text-gray-700">{notification.message}</p>
                </div>
                {!notification.read && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAsRead(notification.id)}
                    className="flex items-center gap-2"
                  >
                    <FiCheck className="w-4 h-4" />
                    Mark as Read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {notifications.length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {notifications.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {notifications.filter(n => !n.read).length}
                </div>
                <div className="text-sm text-gray-600">Unread</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.read).length}
                </div>
                <div className="text-sm text-gray-600">Read</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}










