"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Ban,
  AlertCircle,
  XCircle,
  Loader2,
  Save,
  Users,
  CheckSquare,
  Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface School {
  id: string;
  name: string;
  slug: string;
  status: 'trial' | 'active' | 'inactive' | 'suspended' | 'expired' | 'cancelled';
  statusReason?: string;
}

interface BulkStatusChangeProps {
  isOpen: boolean;
  onClose: () => void;
  schools: School[];
  selectedSchoolIds: string[];
  onSuccess: () => void;
}

const statusOptions = [
  {
    value: 'trial',
    label: 'Trial',
    description: 'Set schools to trial period with limited access',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    value: 'active',
    label: 'Active',
    description: 'Activate schools for full operation',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    value: 'inactive',
    label: 'Inactive',
    description: 'Temporarily disable schools',
    icon: AlertCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  {
    value: 'suspended',
    label: 'Suspended',
    description: 'Suspend schools due to policy violations',
    icon: Ban,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  {
    value: 'expired',
    label: 'Expired',
    description: 'Mark schools as expired (trial ended)',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    description: 'Cancel school accounts',
    icon: XCircle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
];

export function BulkStatusChange({ isOpen, onClose, schools, selectedSchoolIds, onSuccess }: BulkStatusChangeProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSchools = schools.filter(school => selectedSchoolIds.includes(school.id));

  const handleBulkUpdate = async () => {
    if (!selectedStatus || selectedSchools.length === 0) return;

    // Validate reason for certain statuses
    if ((selectedStatus === 'suspended' || selectedStatus === 'cancelled') && !reason.trim()) {
      setError('Reason is required for suspended or cancelled status');
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const response = await fetch('/api/super-admin/schools/bulk-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolIds: selectedSchoolIds,
          status: selectedStatus,
          reason: reason.trim() || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to update school statuses');
      }
    } catch (error) {
      setError('An error occurred while updating school statuses');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: School['status']) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'trial':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Group schools by current status for summary
  const statusSummary = selectedSchools.reduce((acc, school) => {
    acc[school.status] = (acc[school.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Bulk Status Change</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Update status for {selectedSchools.length} school{selectedSchools.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Selected Schools Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <span>Selected Schools</span>
                  </CardTitle>
                  <CardDescription>
                    Current status distribution of selected schools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(statusSummary).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between p-3 border rounded-lg">
                        <Badge className={`${getStatusColor(status as School['status'])} border font-medium`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                        <span className="text-sm font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Schools to be updated:</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {selectedSchools.slice(0, 10).map((school) => (
                        <div key={school.id} className="flex items-center space-x-2 text-sm">
                          <CheckSquare className="w-4 h-4 text-green-500" />
                          <span className="truncate">{school.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {school.status}
                          </Badge>
                        </div>
                      ))}
                      {selectedSchools.length > 10 && (
                        <div className="text-xs text-gray-500 pl-6">
                          ... and {selectedSchools.length - 10} more schools
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select New Status</CardTitle>
                  <CardDescription>
                    Choose the new status to apply to all selected schools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statusOptions.map((option) => {
                      const Icon = option.icon;

                      return (
                        <button
                          key={option.value}
                          onClick={() => setSelectedStatus(option.value)}
                          className={`w-full text-left flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedStatus === option.value
                              ? `${option.borderColor} ${option.bgColor}`
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Icon className={`w-5 h-5 ${option.color}`} />
                              <span className="font-medium">{option.label}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Reason Input */}
              {(selectedStatus === 'suspended' || selectedStatus === 'cancelled') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span>Reason Required</span>
                    </CardTitle>
                    <CardDescription>
                      Please provide a detailed reason for this bulk status change. This will be applied to all selected schools.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="bulk-reason">Reason for status change *</Label>
                      <Textarea
                        id="bulk-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Explain why these schools are being suspended/cancelled..."
                        rows={4}
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Optional Reason */}
              {(selectedStatus !== 'suspended' && selectedStatus !== 'cancelled' && selectedStatus) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Optional Reason</CardTitle>
                    <CardDescription>
                      You can provide a reason for this bulk status change (recommended for audit purposes).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="bulk-reason">Reason for status change (optional)</Label>
                      <Textarea
                        id="bulk-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Optional reason for the bulk status change..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkUpdate}
                  disabled={updating || !selectedStatus}
                  className="min-w-40"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating {selectedSchools.length} Schools...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update {selectedSchools.length} School{selectedSchools.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
