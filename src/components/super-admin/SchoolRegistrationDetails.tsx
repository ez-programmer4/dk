"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, User, Mail, Phone, MapPin, Calendar, Users, Globe, MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

interface SchoolRegistrationDetailsProps {
  registration: SchoolRegistration | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SchoolRegistrationDetails({
  registration,
  isOpen,
  onClose
}: SchoolRegistrationDetailsProps) {
  if (!registration) return null;

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gray-50">
              <div className="flex items-center space-x-3">
                <Building2 className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{registration.name}</h2>
                  <p className="text-gray-600">School Registration Details</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(registration.status, registration.registrationStatus)}
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* School Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      School Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">School Name</label>
                        <p className="text-gray-900">{registration.name}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">Slug</label>
                        <p className="text-gray-900 font-mono text-sm">{registration.slug}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900 flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {registration.email}
                        </p>
                      </div>

                      {registration.phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Phone</label>
                          <p className="text-gray-900 flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {registration.phone}
                          </p>
                        </div>
                      )}

                      {registration.address && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Address</label>
                          <p className="text-gray-900 flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            {registration.address}
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium text-gray-500">Registration Date</label>
                        <p className="text-gray-900 flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {new Date(registration.createdAt).toLocaleDateString()} at {new Date(registration.createdAt).toLocaleTimeString()}
                        </p>
                      </div>

                      {registration.registrationData?.schoolType && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">School Type</label>
                          <p className="text-gray-900">{registration.registrationData.schoolType}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Admin Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Administrator Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {registration.registrationData ? (
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Admin Name</label>
                          <p className="text-gray-900">{registration.registrationData.adminName}</p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-500">Admin Email</label>
                          <p className="text-gray-900 flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {registration.registrationData.adminEmail}
                          </p>
                        </div>

                        {registration.registrationData.adminPhone && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Admin Phone</label>
                            <p className="text-gray-900 flex items-center">
                              <Phone className="w-4 h-4 mr-2 text-gray-400" />
                              {registration.registrationData.adminPhone}
                            </p>
                          </div>
                        )}

                        {registration.registrationData.expectedStudents && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Expected Students</label>
                            <p className="text-gray-900 flex items-center">
                              <Users className="w-4 h-4 mr-2 text-gray-400" />
                              {registration.registrationData.expectedStudents}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No admin information available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Additional Notes */}
                {registration.registrationData?.additionalNotes && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Additional Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {registration.registrationData.additionalNotes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Registration Status */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Registration Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">Status:</span>
                          {getStatusBadge(registration.status, registration.registrationStatus)}
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">Type:</span>
                          <Badge variant="outline">
                            {registration.isSelfRegistered ? "Self-Registered" : "Super Admin Created"}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-sm text-gray-500">
                        Submitted: {new Date(registration.registrationData?.submittedAt || registration.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-6 border-t bg-gray-50">
              <Button onClick={onClose}>
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}




