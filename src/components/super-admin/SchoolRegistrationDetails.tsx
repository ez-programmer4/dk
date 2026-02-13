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
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-2xl bg-white shadow-2xl border-l border-gray-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 opacity-10" />
              <div className="relative flex items-center justify-between p-8 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-600 rounded-xl blur opacity-20" />
                    <div className="relative bg-gradient-to-r from-gray-800 to-gray-600 p-3 rounded-xl">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                  </motion.div>
                  <div>
                    <motion.h2
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-bold text-gray-900 line-clamp-1"
                    >
                      {registration.name}
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-gray-600"
                    >
                      School Registration Details
                    </motion.p>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center space-x-3"
                >
                  {getStatusBadge(registration.status, registration.registrationStatus)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="hover:bg-gray-100 rounded-full w-10 h-10 p-0"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="p-8 space-y-8"
              >
                <div className="grid grid-cols-1 gap-8">
                {/* School Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <Building2 className="w-5 h-5 mr-2" />
                        School Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                          <label className="text-sm font-semibold text-blue-900 uppercase tracking-wide">School Name</label>
                          <p className="text-gray-900 font-medium mt-1">{registration.name}</p>
                        </div>

                        <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                          <label className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Slug</label>
                          <p className="text-gray-900 font-mono text-sm mt-1 font-medium">{registration.slug}</p>
                        </div>

                        <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                          <label className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Email</label>
                          <p className="text-gray-900 flex items-center mt-1 font-medium">
                            <Mail className="w-4 h-4 mr-3 text-blue-500" />
                            {registration.email}
                          </p>
                        </div>

                        {registration.phone && (
                          <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                            <label className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Phone</label>
                            <p className="text-gray-900 flex items-center mt-1 font-medium">
                              <Phone className="w-4 h-4 mr-3 text-blue-500" />
                              {registration.phone}
                            </p>
                          </div>
                        )}

                        {registration.address && (
                          <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                            <label className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Address</label>
                            <p className="text-gray-900 flex items-center mt-1 font-medium">
                              <MapPin className="w-4 h-4 mr-3 text-blue-500" />
                              {registration.address}
                            </p>
                          </div>
                        )}

                        <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                          <label className="text-sm font-semibold text-blue-900 uppercase tracking-wide">Registration Date</label>
                          <p className="text-gray-900 flex items-center mt-1 font-medium">
                            <Calendar className="w-4 h-4 mr-3 text-blue-500" />
                            {new Date(registration.createdAt).toLocaleDateString()} at {new Date(registration.createdAt).toLocaleTimeString()}
                          </p>
                        </div>

                        {registration.registrationData?.schoolType && (
                          <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                            <label className="text-sm font-semibold text-blue-900 uppercase tracking-wide">School Type</label>
                            <p className="text-gray-900 font-medium mt-1">{registration.registrationData.schoolType}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Admin Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100">
                    <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Administrator Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                      {registration.registrationData ? (
                        <div className="grid grid-cols-1 gap-4">
                          <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                            <label className="text-sm font-semibold text-green-900 uppercase tracking-wide">Admin Name</label>
                            <p className="text-gray-900 font-medium mt-1">{registration.registrationData.adminName}</p>
                          </div>

                          <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                            <label className="text-sm font-semibold text-green-900 uppercase tracking-wide">Admin Email</label>
                            <p className="text-gray-900 flex items-center mt-1 font-medium">
                              <Mail className="w-4 h-4 mr-3 text-green-500" />
                              {registration.registrationData.adminEmail}
                            </p>
                          </div>

                          {registration.registrationData.adminPhone && (
                            <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                              <label className="text-sm font-semibold text-green-900 uppercase tracking-wide">Admin Phone</label>
                              <p className="text-gray-900 flex items-center mt-1 font-medium">
                                <Phone className="w-4 h-4 mr-3 text-green-500" />
                                {registration.registrationData.adminPhone}
                              </p>
                            </div>
                          )}

                          {registration.registrationData.expectedStudents && (
                            <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                              <label className="text-sm font-semibold text-green-900 uppercase tracking-wide">Expected Students</label>
                              <p className="text-gray-900 flex items-center mt-1 font-medium">
                                <Users className="w-4 h-4 mr-3 text-green-500" />
                                {registration.registrationData.expectedStudents}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">No admin information available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Additional Notes */}
                {registration.registrationData?.additionalNotes && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100">
                      <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-t-lg">
                        <CardTitle className="flex items-center">
                          <MessageSquare className="w-5 h-5 mr-2" />
                          Additional Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {registration.registrationData.additionalNotes}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Registration Status */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                >
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-slate-100">
                    <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-600 text-white rounded-t-lg">
                      <CardTitle className="flex items-center">
                        <Globe className="w-5 h-5 mr-2" />
                        Registration Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-white/50">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Status:</span>
                            {getStatusBadge(registration.status, registration.registrationStatus)}
                          </div>
                          <div className="text-sm text-gray-600 font-medium">
                            {new Date(registration.registrationData?.submittedAt || registration.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="p-4 bg-white/70 rounded-lg border border-white/50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Type:</span>
                            <Badge variant="outline" className="border-gray-300 text-gray-700">
                              {registration.isSelfRegistered ? "Self-Registered" : "Super Admin Created"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              className="border-t border-gray-200 bg-gray-50 p-6"
            >
              <div className="flex items-center justify-end">
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-gray-800 to-gray-600 hover:from-gray-900 hover:to-gray-700 text-white px-8 py-2"
                >
                  Close Panel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}











