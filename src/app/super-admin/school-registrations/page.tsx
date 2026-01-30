"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SchoolRegistrationDetails from "@/components/super-admin/SchoolRegistrationDetails";

interface SchoolRegistration {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  registrationStatus: string;
  isSelfRegistered: boolean;
  createdAt: string;
  registrationData?: {
    adminName: string;
    adminEmail: string;
    adminPhone?: string;
    expectedStudents?: number;
    schoolType?: string;
    additionalNotes?: string;
    submittedAt: string;
  };
  _count?: {
    students: number;
    teachers: number;
    admins: number;
  };
}

export default function SchoolRegistrationsPage() {
  const [registrations, setRegistrations] = useState<SchoolRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRegistration, setSelectedRegistration] = useState<SchoolRegistration | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    registration: SchoolRegistration | null;
    action: "approve" | "reject" | null;
  }>({
    open: false,
    registration: null,
    action: null,
  });

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/super-admin/school-registrations?${params}`);
      const data = await response.json();

      if (data.success) {
        setRegistrations(data.registrations);
      }
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [searchTerm, statusFilter]);

  const handleAction = async (registrationId: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`/api/super-admin/school-registrations/${registrationId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the registrations list
        fetchRegistrations();
        setActionDialog({ open: false, registration: null, action: null });
      }
    } catch (error) {
      console.error("Failed to perform action:", error);
    }
  };

  const getStatusBadge = (status: string, registrationStatus: string) => {
    if (registrationStatus === "pending") {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
    } else if (registrationStatus === "approved") {
      return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    } else if (registrationStatus === "rejected") {
      return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const filteredRegistrations = registrations.filter(registration => {
    const matchesSearch = registration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         registration.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || registration.registrationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Registrations</h1>
          <p className="text-gray-600 mt-1">Review and manage school self-registration requests</p>
        </div>
        <Button
          onClick={fetchRegistrations}
          variant="outline"
          className="flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search schools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrations List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "School registration requests will appear here"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredRegistrations.map((registration) => (
            <motion.div
              key={registration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {registration.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {registration.name}
                        </h3>
                        {getStatusBadge(registration.status, registration.registrationStatus)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {registration.email}
                        </div>
                        {registration.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {registration.phone}
                          </div>
                        )}
                        {registration.address && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            {registration.address}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {new Date(registration.createdAt).toLocaleDateString()}
                        </div>
                        {registration.registrationData?.expectedStudents && (
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2 text-gray-400" />
                            {registration.registrationData.expectedStudents} expected students
                          </div>
                        )}
                        {registration.registrationData?.adminName && (
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-gray-400" />
                            Admin: {registration.registrationData.adminName}
                          </div>
                        )}
                      </div>

                      {registration.registrationData?.additionalNotes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-700">
                            <strong>Notes:</strong> {registration.registrationData.additionalNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRegistration(registration);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>

                    {registration.registrationStatus === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-700 border-green-300 hover:bg-green-50"
                          onClick={() => setActionDialog({
                            open: true,
                            registration,
                            action: "approve"
                          })}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-700 border-red-300 hover:bg-red-50"
                          onClick={() => setActionDialog({
                            open: true,
                            registration,
                            action: "reject"
                          })}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Registration Details Panel */}
      <SchoolRegistrationDetails
        registration={selectedRegistration}
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedRegistration(null);
        }}
      />

      {/* Action Confirmation Dialog */}
      <AlertDialog
        open={actionDialog.open}
        onOpenChange={(open) => setActionDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.action === "approve" ? "Approve Registration" : "Reject Registration"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionDialog.action} the registration for{" "}
              <strong>{actionDialog.registration?.name}</strong>?
              {actionDialog.action === "approve" && (
                <span className="block mt-2 text-green-700">
                  This will activate the school and enable the admin account.
                </span>
              )}
              {actionDialog.action === "reject" && (
                <span className="block mt-2 text-red-700">
                  This will mark the registration as rejected. The school admin will be notified.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (actionDialog.registration && actionDialog.action) {
                  handleAction(actionDialog.registration.id, actionDialog.action);
                }
              }}
              className={
                actionDialog.action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {actionDialog.action === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
