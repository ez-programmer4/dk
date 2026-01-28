"use client";

import { useState, useEffect } from "react";
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
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface School {
  id: string;
  name: string;
  status: 'trial' | 'active' | 'inactive' | 'suspended' | 'expired' | 'cancelled';
  statusReason?: string;
  statusChangedAt?: string;
}

interface SchoolStatusPanelProps {
  isOpen: boolean;
  onClose: () => void;
  school: School | null;
  onSuccess: () => void;
}

const statusOptions = [
  {
    value: 'trial',
    label: 'Trial',
    description: 'School is in trial period with limited access',
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    value: 'active',
    label: 'Active',
    description: 'School is fully operational and paying',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    value: 'inactive',
    label: 'Inactive',
    description: 'School is temporarily disabled',
    icon: AlertCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  {
    value: 'suspended',
    label: 'Suspended',
    description: 'School is suspended due to policy violation',
    icon: Ban,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  {
    value: 'expired',
    label: 'Expired',
    description: 'Trial period has expired',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    description: 'School account has been cancelled',
    icon: XCircle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
];

export function SchoolStatusPanel({ isOpen, onClose, school, onSuccess }: SchoolStatusPanelProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when school changes
  useEffect(() => {
    if (school) {
      setSelectedStatus(school.status);
      setReason('');
      setError(null);
    }
  }, [school]);

  const handleUpdateStatus = async () => {
    if (!school || !selectedStatus) return;

    // Validate reason for certain statuses
    if ((selectedStatus === 'suspended' || selectedStatus === 'cancelled') && !reason.trim()) {
      setError('Reason is required for suspended or cancelled status');
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/schools/${school.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          reason: reason.trim() || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to update status');
      }
    } catch (error) {
      setError('An error occurred while updating the status');
    } finally {
      setUpdating(false);
    }
  };

  const getCurrentStatusOption = () => {
    return statusOptions.find(option => option.value === school?.status);
  };

  if (!school) return null;

  const currentStatusOption = getCurrentStatusOption();
  const selectedStatusOption = statusOptions.find(option => option.value === selectedStatus);

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
                <h2 className="text-xl font-semibold text-gray-900">Change School Status</h2>
                <p className="text-sm text-gray-600 mt-1">{school.name}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Current Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {currentStatusOption && (
                      <>
                        <currentStatusOption.icon className={`w-5 h-5 ${currentStatusOption.color}`} />
                        <span>Current Status</span>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <Badge className={`${currentStatusOption?.bgColor} ${currentStatusOption?.color} border ${currentStatusOption?.borderColor} font-semibold`}>
                      {currentStatusOption?.label}
                    </Badge>
                    {school.statusReason && (
                      <div className="text-sm text-gray-600">
                        <strong>Reason:</strong> {school.statusReason}
                      </div>
                    )}
                  </div>
                  {school.statusChangedAt && (
                    <div className="text-xs text-gray-500 mt-2">
                      Last changed: {new Date(school.statusChangedAt).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select New Status</CardTitle>
                  <CardDescription>
                    Choose the new status for this school. Some statuses require a reason.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                    className="space-y-3"
                  >
                    {statusOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = selectedStatus === option.value;
                      const isCurrent = school.status === option.value;

                      return (
                        <div key={option.value} className="relative">
                          <label
                            htmlFor={option.value}
                            className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected
                                ? `${option.borderColor} ${option.bgColor}`
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <RadioGroupItem
                              value={option.value}
                              id={option.value}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <Icon className={`w-5 h-5 ${option.color}`} />
                                <span className="font-medium">{option.label}</span>
                                {isCurrent && (
                                  <Badge variant="outline" className="text-xs">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </RadioGroup>
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
                      Please provide a detailed reason for this status change. This will be recorded in the audit log.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for status change *</Label>
                      <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Explain why this school is being suspended/cancelled..."
                        rows={4}
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Optional Reason */}
              {(selectedStatus !== 'suspended' && selectedStatus !== 'cancelled') && (
                <Card>
                  <CardHeader>
                    <CardTitle>Optional Reason</CardTitle>
                    <CardDescription>
                      You can provide a reason for this status change (recommended for audit purposes).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for status change (optional)</Label>
                      <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Optional reason for the status change..."
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
                  onClick={handleUpdateStatus}
                  disabled={updating || selectedStatus === school.status}
                  className="min-w-32"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Status
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


