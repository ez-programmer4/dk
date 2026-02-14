"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  BookOpen,
  Shield,
  Crown,
  Settings,
  Activity,
  BarChart3,
  FileText,
  Key,
  Trash2,
  Edit,
  Ban,
  Play,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Sparkles,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface SchoolDetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string | null;
  onSchoolUpdated?: () => void;
}

interface SchoolDetails {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  primaryColor: string;
  secondaryColor: string;
  status: string;
  statusReason?: string;
  statusChangedAt: string;
  statusChangedById?: string;
  timezone: string;
  defaultCurrency: string;
  defaultLanguage: string;
  createdAt: string;
  logoUrl?: string;
  features?: any;
  _count: {
    students: number;
    teachers: number;
    admins: number;
  };
  pricingTier?: {
    id: string;
    name: string;
    monthlyFee: number;
    currency: string;
    features: string[];
  };
  subscription?: {
    status: string;
    currentStudents: number;
    trialEndsAt?: string;
    subscribedAt?: string;
    nextBillingDate?: string;
  };
  admins: Array<{
    id: string;
    name: string;
    username?: string;
    email?: string;
    phoneno?: string;
    role?: string;
    createdAt: string;
  }>;
}

const statusColors = {
  trial: "bg-blue-100 text-blue-800 border-blue-200",
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  suspended: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-orange-100 text-orange-800 border-orange-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusIcons = {
  trial: Clock,
  active: CheckCircle,
  inactive: AlertTriangle,
  suspended: AlertTriangle,
  expired: AlertTriangle,
  cancelled: AlertTriangle,
};

export default function SchoolDetailsPanel({
  isOpen,
  onClose,
  schoolId,
  onSchoolUpdated,
}: SchoolDetailsPanelProps) {
  const [school, setSchool] = useState<SchoolDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && schoolId) {
      fetchSchoolDetails();
    }
  }, [isOpen, schoolId]);

  const fetchSchoolDetails = async () => {
    if (!schoolId) {
      console.error("No schoolId provided");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) {
        console.error("No authentication token found");
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/super-admin/schools/${schoolId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSchool(data.school);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        toast({
          title: "Error",
          description: errorData.error || `Failed to load school details (${response.status})`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Network error:", error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolAction = async (action: string, confirmMessage?: string) => {
    if (!school) return;

    if (confirmMessage) {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;
    }

    setActionLoading(action);
    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) return;

      const response = await fetch(`/api/super-admin/schools/${school.id}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `School ${action} completed successfully`,
        });
        fetchSchoolDetails();
        onSchoolUpdated?.();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || `Failed to ${action} school`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} school`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const StatusIcon = statusIcons[status as keyof typeof statusIcons] || Clock;
    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors]} flex items-center gap-1.5 px-3 py-1`}>
        <StatusIcon className="w-3.5 h-3.5" />
        <span className="font-medium capitalize">{status}</span>
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string = "ETB") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "ETB" ? "ETB" : currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AnimatePresence>
      {isOpen && school ? (
        <>
          {/* Enhanced Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gradient-to-br from-black/60 via-gray-900/50 to-black/60 backdrop-blur-md z-40"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
            onClick={onClose}
          />

          {/* Enhanced Side Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.4
            }}
            className="fixed top-0 right-0 h-full w-full max-w-5xl bg-white shadow-2xl z-50 overflow-y-auto border-l border-gray-200"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            {/* Enhanced Header with Glassmorphism */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="sticky top-0 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-xl border-b border-gray-200/50 px-8 py-6 flex items-center justify-between shadow-sm"
            >
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center space-x-6"
              >
                {/* Enhanced School Avatar */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl ring-4 ring-white"
                    style={{
                      background: `linear-gradient(135deg, ${school.primaryColor}, ${school.secondaryColor})`
                    }}
                  >
                    {school.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                    {getStatusBadge(school.status)}
                  </div>
                </motion.div>

                {/* Enhanced School Info */}
                <div className="flex-1 min-w-0">
                  <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-bold text-gray-900 mb-1 tracking-tight"
                  >
                    {school.name}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-gray-600 mb-3"
                  >
                    @{school.slug}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center space-x-6 text-sm text-gray-600"
                  >
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{school._count.students} Students</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{school._count.teachers} Teachers</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-4 h-4" />
                      <span>{school._count.admins} Admins</span>
                    </div>
                  </motion.div>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl hover:bg-gray-100 transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Enhanced Content Area */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex-1 px-8 py-8 space-y-8"
              >
                {/* Quick Stats Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm"
                  >
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Status</div>
                    <div className="text-lg font-bold text-gray-900 capitalize">{school.status}</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm"
                  >
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Created</div>
                    <div className="text-lg font-bold text-gray-900">
                    {new Date(school.createdAt).toLocaleDateString()}
                  </div>
                </motion.div>
                <motion.div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Currency</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">{school.defaultCurrency}</div>
                </motion.div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Timezone</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900 text-xs">{school.timezone}</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Content */}
            <div className="px-6 py-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Loading school details...</p>
                  {schoolId && (
                    <p className="text-xs text-gray-400 mt-2">School ID: {schoolId}</p>
                  )}
                </div>
              ) : !school ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load School</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Unable to load school details. Please try again.
                  </p>
                  <Button onClick={fetchSchoolDetails} variant="outline">
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center text-blue-900">
                        <Settings className="w-5 h-5 mr-2" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                          onClick={() => handleSchoolAction("edit")}
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </Button>

                        {school.status === "suspended" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-2 text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => handleSchoolAction("activate", "Are you sure you want to activate this school?")}
                            disabled={actionLoading === "activate"}
                          >
                            {actionLoading === "activate" ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            <span>Activate</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-2 text-red-700 border-red-300 hover:bg-red-50"
                            onClick={() => handleSchoolAction("suspend", "Are you sure you want to suspend this school?")}
                            disabled={actionLoading === "suspend"}
                          >
                            {actionLoading === "suspend" ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                            <span>Suspend</span>
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                          onClick={() => handleSchoolAction("reset-password")}
                        >
                          <Key className="w-4 h-4" />
                          <span>Reset Admin Password</span>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-2 text-red-700 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete School</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{school.name}"? This action cannot be undone and will permanently remove all school data, including students, teachers, and administrators.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleSchoolAction("delete")}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete School
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detailed Information Tabs */}
                  <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="subscription">Subscription</TabsTrigger>
                      <TabsTrigger value="admins">Administrators</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                      {/* Contact Information */}
                      <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                          <CardTitle className="flex items-center text-blue-900">
                            <Mail className="w-5 h-5 mr-2" />
                            Contact Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <label className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                                  <Mail className="w-4 h-4 mr-2 text-blue-600" />
                                  Primary Email
                                </label>
                                <p className="text-gray-900 font-medium">{school.email || "Not configured"}</p>
                                <p className="text-xs text-gray-500 mt-1">Used for official communications</p>
                              </div>

                              <div className="bg-gray-50 rounded-lg p-4">
                                <label className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                                  <Phone className="w-4 h-4 mr-2 text-green-600" />
                                  Contact Phone
                                </label>
                                <p className="text-gray-900 font-medium">{school.phone || "Not configured"}</p>
                                <p className="text-xs text-gray-500 mt-1">Primary contact number</p>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                              <label className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                                <MapPin className="w-4 h-4 mr-2 text-red-600" />
                                Physical Address
                              </label>
                              <p className="text-gray-900 font-medium whitespace-pre-line">
                                {school.address || "Not configured"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">Complete address for logistics and records</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* System Configuration */}
                      <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                          <CardTitle className="flex items-center text-purple-900">
                            <Settings className="w-5 h-5 mr-2" />
                            System Configuration
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                              <Globe className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                              <div className="text-sm font-semibold text-blue-900">Timezone</div>
                              <div className="text-xs text-blue-700 mt-1">{school.timezone}</div>
                              <div className="text-xs text-blue-600 mt-2">All schedules and reports</div>
                            </div>

                            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                              <div className="text-sm font-semibold text-green-900">Currency</div>
                              <div className="text-xs text-green-700 mt-1">{school.defaultCurrency}</div>
                              <div className="text-xs text-green-600 mt-2">Payments and pricing</div>
                            </div>

                            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                              <Settings className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                              <div className="text-sm font-semibold text-purple-900">Language</div>
                              <div className="text-xs text-purple-700 mt-1">{school.defaultLanguage.toUpperCase()}</div>
                              <div className="text-xs text-purple-600 mt-2">Interface language</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Branding Preview */}
                      <Card className="border-l-4 border-l-indigo-500">
                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                          <CardTitle className="flex items-center text-indigo-900">
                            <Palette className="w-5 h-5 mr-2" />
                            Brand Identity
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Primary Color</label>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
                                    style={{ backgroundColor: school.primaryColor }}
                                  />
                                  <span className="text-sm font-mono text-gray-600">{school.primaryColor}</span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Secondary Color</label>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
                                    style={{ backgroundColor: school.secondaryColor }}
                                  />
                                  <span className="text-sm font-mono text-gray-600">{school.secondaryColor}</span>
                                </div>
                              </div>
                            </div>

                            {/* Live Preview */}
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <div className="text-sm font-medium text-gray-700 mb-3">Live Preview</div>
                              <div className="flex items-center space-x-4">
                                <div
                                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                                  style={{ backgroundColor: school.primaryColor }}
                                >
                                  S
                                </div>
                                <div>
                                  <div
                                    className="text-lg font-semibold"
                                    style={{ color: school.primaryColor }}
                                  >
                                    {school.name}
                                  </div>
                                  <div
                                    className="text-sm"
                                    style={{ color: school.secondaryColor }}
                                  >
                                    Professional Learning Platform
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  style={{
                                    backgroundColor: school.primaryColor,
                                    borderColor: school.secondaryColor
                                  }}
                                  className="text-white hover:opacity-90 ml-auto"
                                >
                                  Get Started
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Statistics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-gray-900">{school._count.students}</p>
                                <p className="text-sm text-gray-600">Students</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-green-600" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-gray-900">{school._count.teachers}</p>
                                <p className="text-sm text-gray-600">Teachers</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Shield className="w-6 h-6 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-gray-900">{school._count.admins}</p>
                                <p className="text-sm text-gray-600">Admins</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="subscription" className="space-y-6">
                      {/* Current Plan */}
                      <Card className="border-l-4 border-l-yellow-500">
                        <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
                          <CardTitle className="flex items-center text-yellow-900">
                            <Crown className="w-5 h-5 mr-2" />
                            Current Plan & Pricing
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {school.pricingTier ? (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                                <div>
                                  <h3 className="text-xl font-bold text-yellow-900">{school.pricingTier.name}</h3>
                                  <p className="text-sm text-yellow-700">Professional Plan</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-yellow-900">
                                    {formatCurrency(school.pricingTier.monthlyFee, school.pricingTier.currency)}
                                  </div>
                                  <div className="text-sm text-yellow-700">per month</div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                  Included Features
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {school.pricingTier.features.map((feature: string) => (
                                    <div key={feature} className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                      <span className="text-sm text-green-800">
                                        {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Crown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg font-medium">No Active Plan</p>
                              <p className="text-sm text-gray-400">This school doesn't have an active pricing plan</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Subscription Status */}
                      <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                          <CardTitle className="flex items-center text-blue-900">
                            <Activity className="w-5 h-5 mr-2" />
                            Subscription Status
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {school.subscription ? (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                                  <div className="text-2xl font-bold text-blue-900 mb-1">
                                    {school.subscription.status === 'active' ? 'Active' :
                                     school.subscription.status === 'trial' ? 'Trial' :
                                     school.subscription.status}
                                  </div>
                                  <div className="text-xs text-blue-700">Status</div>
                                </div>

                                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                                  <div className="text-2xl font-bold text-green-900 mb-1">
                                    {school.subscription.currentStudents}
                                  </div>
                                  <div className="text-xs text-green-700">Active Students</div>
                                </div>

                                {school.subscription.trialEndsAt && (
                                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                                    <div className="text-lg font-bold text-orange-900 mb-1">
                                      {Math.max(0, Math.ceil((new Date(school.subscription.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                                    </div>
                                    <div className="text-xs text-orange-700">Trial Days Left</div>
                                  </div>
                                )}

                                {school.subscription.nextBillingDate && (
                                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                                    <div className="text-sm font-bold text-purple-900 mb-1">
                                      {new Date(school.subscription.nextBillingDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </div>
                                    <div className="text-xs text-purple-700">Next Billing</div>
                                  </div>
                                )}
                              </div>

                              {/* Subscription Timeline */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900">Subscription Timeline</h4>
                                <div className="space-y-2">
                                  {school.subscription.subscribedAt && (
                                    <div className="flex items-center space-x-3">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-sm text-gray-600">Subscribed on</span>
                                      <span className="text-sm font-medium text-gray-900">
                                        {new Date(school.subscription.subscribedAt).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  )}

                                  {school.subscription.trialEndsAt && (
                                    <div className="flex items-center space-x-3">
                                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                      <span className="text-sm text-gray-600">Trial ends on</span>
                                      <span className="text-sm font-medium text-gray-900">
                                        {new Date(school.subscription.trialEndsAt).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  )}

                                  {school.subscription.nextBillingDate && (
                                    <div className="flex items-center space-x-3">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      <span className="text-sm text-gray-600">Next billing on</span>
                                      <span className="text-sm font-medium text-gray-900">
                                        {new Date(school.subscription.nextBillingDate).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg font-medium">No Active Subscription</p>
                              <p className="text-sm text-gray-400">This school doesn't have an active subscription</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="admins" className="space-y-6">
                      {/* Admin Statistics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-xl font-bold text-blue-900">{school.admins.length}</p>
                                <p className="text-sm text-blue-700">Total Admins</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-xl font-bold text-green-900">
                                  {school.admins.length}
                                </p>
                                <p className="text-sm text-green-700">Active Admins</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-xl font-bold text-purple-900">1</p>
                                <p className="text-sm text-purple-700">Primary Admin</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Administrators List */}
                      <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                          <CardTitle className="flex items-center text-green-900">
                            <Shield className="w-5 h-5 mr-2" />
                            School Administrators
                          </CardTitle>
                          <p className="text-sm text-green-700">
                            Manage school administrators and their permissions
                          </p>
                        </CardHeader>
                        <CardContent>
                          {school.admins.length > 0 ? (
                            <div className="space-y-4">
                              {school.admins.map((admin, index) => (
                                <div key={admin.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                      <div className="relative">
                                        <Avatar className="w-12 h-12">
                                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-lg">
                                            {admin.name.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        {index === 0 && (
                                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                                            <Crown className="w-3 h-3 text-white" />
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <h3 className="text-lg font-semibold text-gray-900">{admin.name}</h3>
                                          {index === 0 && (
                                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Primary Admin</Badge>
                                          )}
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600">
                                          <div className="flex items-center space-x-2">
                                            <User className="w-4 h-4" />
                                            <span className="font-mono">@{admin.username || "No username"}</span>
                                          </div>

                                          {admin.email && (
                                            <div className="flex items-center space-x-2">
                                              <Mail className="w-4 h-4" />
                                              <span>{admin.email}</span>
                                            </div>
                                          )}

                                          {admin.phoneno && (
                                            <div className="flex items-center space-x-2">
                                              <Phone className="w-4 h-4" />
                                              <span>{admin.phoneno}</span>
                                            </div>
                                          )}

                                          <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>Joined {new Date(admin.createdAt).toLocaleDateString()}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex flex-col items-end space-y-2">
                                      <Badge variant="default" className="bg-green-100 text-green-800">
                                        Active
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {admin.role || "Administrator"}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Admin Actions */}
                                  <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center space-x-3">
                                      <Button variant="outline" size="sm" className="text-xs">
                                        <Eye className="w-3 h-3 mr-1" />
                                        View Profile
                                      </Button>
                                      <Button variant="outline" size="sm" className="text-xs">
                                        <Edit className="w-3 h-3 mr-1" />
                                        Edit Permissions
                                      </Button>
                                      <Button variant="outline" size="sm" className="text-xs text-red-600 hover:text-red-700">
                                        <Key className="w-3 h-3 mr-1" />
                                        Reset Password
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No Administrators</h3>
                              <p className="text-gray-500 mb-4">This school doesn't have any administrators assigned yet.</p>
                              <Button className="bg-blue-600 hover:bg-blue-700">
                                <User className="w-4 h-4 mr-2" />
                                Add Administrator
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="activity" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Activity className="w-5 h-5 mr-2" />
                            Recent Activity
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8 text-gray-500">
                            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>Activity tracking coming soon</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Detailed logs and analytics will be available here
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
