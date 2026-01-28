"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  History,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Ban,
  XCircle,
  ArrowRight,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StatusHistoryEntry {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  reason: string | null;
  changedAt: string;
  changedBy: {
    id: string;
    name: string;
    username: string;
  };
}

interface StatusHistoryProps {
  schoolId: string;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'trial':
      return Clock;
    case 'active':
      return CheckCircle;
    case 'inactive':
      return AlertTriangle;
    case 'suspended':
      return Ban;
    case 'expired':
      return AlertTriangle;
    case 'cancelled':
      return XCircle;
    default:
      return Clock;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'trial':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'inactive':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    case 'suspended':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'expired':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'cancelled':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export function StatusHistory({ schoolId, isOpen, onClose }: StatusHistoryProps) {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && schoolId) {
      fetchStatusHistory();
    }
  }, [isOpen, schoolId]);

  const fetchStatusHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}/status`);
      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
      } else {
        setError(data.error || 'Failed to fetch status history');
      }
    } catch (error) {
      setError('An error occurred while fetching status history');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-40"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <History className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Status History</h2>
              <p className="text-sm text-gray-600">Track all status changes for this school</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading history...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Status Changes</h3>
              <p className="text-gray-600">This school hasn't had any status changes yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => {
                const OldIcon = entry.oldStatus ? getStatusIcon(entry.oldStatus) : null;
                const NewIcon = getStatusIcon(entry.newStatus);

                return (
                  <Card key={entry.id} className="relative">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Status Change Icons */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {OldIcon && (
                            <>
                              <div className={`p-2 rounded-full border ${getStatusColor(entry.oldStatus!)}`}>
                                <OldIcon className="w-4 h-4" />
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            </>
                          )}
                          <div className={`p-2 rounded-full border ${getStatusColor(entry.newStatus)}`}>
                            <NewIcon className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Status Change Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex items-center space-x-2">
                              {entry.oldStatus && (
                                <>
                                  <Badge variant="outline" className={getStatusColor(entry.oldStatus)}>
                                    {entry.oldStatus.charAt(0).toUpperCase() + entry.oldStatus.slice(1)}
                                  </Badge>
                                  <span className="text-gray-400">→</span>
                                </>
                              )}
                              <Badge className={getStatusColor(entry.newStatus)}>
                                {entry.newStatus.charAt(0).toUpperCase() + entry.newStatus.slice(1)}
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(entry.changedAt).toLocaleString()}
                            </span>
                          </div>

                          {/* Changed By */}
                          <div className="flex items-center space-x-2 mb-3">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Changed by <span className="font-medium">{entry.changedBy.name}</span>
                              <span className="text-gray-400"> ({entry.changedBy.username})</span>
                            </span>
                          </div>

                          {/* Reason */}
                          {entry.reason && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-700">
                                <strong>Reason:</strong> {entry.reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>

                    {/* Timeline connector */}
                    {index < history.length - 1 && (
                      <div className="absolute left-8 top-full w-0.5 h-8 bg-gray-200"></div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}


