"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Users,
  BookOpen,
  Shield,
  Calendar,
  Banknote,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calculator,
  Crown,
  Key,
  Trash2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import SchoolCreationPanel from "@/components/super-admin/SchoolCreationPanel";
import PremiumFeaturesPanel from "@/components/super-admin/PremiumFeaturesPanel";
import PaymentCalculator from "@/components/super-admin/PaymentCalculator";
import SchoolDetailsPanel from "@/components/super-admin/SchoolDetailsPanel";
import SchoolEditPanel from "@/components/super-admin/SchoolEditPanel";
import Link from "next/link";

interface School {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  status: string;
  statusReason?: string;
  statusChangedAt: string;
  timezone: string;
  defaultCurrency: string;
  createdAt: string;
  isSelfRegistered?: boolean;
  registrationStatus?: string;
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
  };
  subscription?: {
    status: string;
    currentStudents: number;
    trialEndsAt?: string;
    subscribedAt?: string;
  };
}

const statusColors = {
  trial: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  suspended: "bg-red-100 text-red-800",
  expired: "bg-orange-100 text-orange-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const statusIcons = {
  trial: Clock,
  active: CheckCircle,
  inactive: Ban,
  suspended: AlertTriangle,
  expired: AlertTriangle,
  cancelled: Ban,
};

export default function SchoolsManagementPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreationPanelOpen, setIsCreationPanelOpen] = useState(false);
  const [isPremiumPanelOpen, setIsPremiumPanelOpen] = useState(false);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [isPaymentCalculatorOpen, setIsPaymentCalculatorOpen] = useState(false);
  const [selectedSchoolForDetails, setSelectedSchoolForDetails] = useState<string | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [selectedSchoolForEdit, setSelectedSchoolForEdit] = useState<string | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, [searchTerm, statusFilter]);

  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) return;

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/super-admin/schools?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools);
      }
    } catch (error) {
      console.error("Failed to fetch schools:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const StatusIcon = statusIcons[status as keyof typeof statusIcons] || Clock;
    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors]} flex items-center gap-1`}>
        <StatusIcon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSubscriptionStatus = (subscription?: School["subscription"]) => {
    if (!subscription) return "No Subscription";

    const now = new Date();
    const trialEnds = subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : null;

    if (subscription.status === "trial" && trialEnds && trialEnds > now) {
      const daysLeft = Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `Trial (${daysLeft} days left)`;
    }

    if (subscription.status === "active") {
      return "Active";
    }

    return subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1);
  };

  const getRegistrationBadge = (school: School) => {
    if (school.isSelfRegistered) {
      const status = school.registrationStatus || "pending";
      const colors = {
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
        pending: "bg-yellow-100 text-yellow-800",
      };

      return (
        <Badge className={`${colors[status as keyof typeof colors] || colors.pending} flex items-center gap-1 text-xs`}>
          <FileText className="w-3 h-3" />
          Self-Registered ({status})
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1 text-xs">
          <Crown className="w-3 h-3" />
          Super Admin
        </Badge>
      );
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "ETB" ? "ETB" : currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      {/* Header */}
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 p-8 text-white"
      >
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
            >
              School Management
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-gray-300 text-lg"
            >
              Monitor and manage all schools in the platform
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-wrap gap-3"
          >
            <Link href="/super-admin/payments">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm">
                <Banknote className="w-4 h-4 mr-2" />
                View All Payments
              </Button>
            </Link>
            <Button
              onClick={() => setIsPaymentCalculatorOpen(true)}
              variant="outline"
              disabled={selectedSchools.length === 0}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Payments ({selectedSchools.length})
            </Button>
            <Button
              onClick={() => setIsPremiumPanelOpen(true)}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm"
            >
              <Crown className="w-4 h-4 mr-2" />
              Premium Features
            </Button>
            <Button
              onClick={() => setIsCreationPanelOpen(true)}
              className="bg-gradient-to-r from-white to-gray-200 text-gray-900 hover:from-gray-100 hover:to-gray-300 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create School
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-blue-900">Total Schools</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 mb-1">{schools.length}</div>
              <p className="text-xs text-blue-700 font-medium">Registered schools</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-100">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-green-900">Active Schools</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 mb-1">
                {schools.filter(s => s.status === "active").length}
              </div>
              <p className="text-xs text-green-700 font-medium">Currently active</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-orange-100">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-amber-900">Trial Schools</CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900 mb-1">
                {schools.filter(s => s.status === "trial").length}
              </div>
              <p className="text-xs text-amber-700 font-medium">On trial period</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-violet-100">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-purple-900">Total Students</CardTitle>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 mb-1">
                {schools.reduce((acc, school) => acc + school._count.students, 0)}
              </div>
              <p className="text-xs text-purple-700 font-medium">Across all schools</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
              <Building2 className="w-6 h-6 mr-3 text-gray-600" />
              Schools Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="flex flex-col lg:flex-row gap-4 mb-8"
            >
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search schools by name, email, or slug..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-2 border-gray-200 focus:border-gray-400 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-300"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-56 h-12 border-2 border-gray-200 focus:border-gray-400 rounded-xl bg-white/50 backdrop-blur-sm">
                  <Filter className="w-5 h-5 mr-2 text-gray-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-gray-200 rounded-xl bg-white/95 backdrop-blur-sm">
                  <SelectItem value="all" className="hover:bg-gray-50">All Status</SelectItem>
                  <SelectItem value="trial" className="hover:bg-gray-50">Trial</SelectItem>
                  <SelectItem value="active" className="hover:bg-gray-50">Active</SelectItem>
                  <SelectItem value="inactive" className="hover:bg-gray-50">Inactive</SelectItem>
                  <SelectItem value="suspended" className="hover:bg-gray-50">Suspended</SelectItem>
                  <SelectItem value="expired" className="hover:bg-gray-50">Expired</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Schools Grid */}
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    className="animate-pulse"
                  >
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center space-y-2">
                            <div className="h-8 bg-gray-200 rounded mx-auto w-8"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                          </div>
                          <div className="text-center space-y-2">
                            <div className="h-8 bg-gray-200 rounded mx-auto w-8"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                          </div>
                          <div className="text-center space-y-2">
                            <div className="h-8 bg-gray-200 rounded mx-auto w-8"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : schools.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16"
              >
                <div className="relative mx-auto w-24 h-24 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full opacity-20"></div>
                  <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-full border-2 border-gray-300">
                    <Building2 className="w-12 h-12 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No schools found</h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search criteria or filters to find schools"
                    : "Get started by creating your first school in the platform"
                  }
                </p>
                {(!searchTerm && statusFilter === "all") && (
                  <Button
                    onClick={() => setIsCreationPanelOpen(true)}
                    className="mt-6 bg-gradient-to-r from-gray-800 to-gray-600 hover:from-gray-900 hover:to-gray-700 text-white"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First School
                  </Button>
                )}
              </motion.div>
            ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {schools.map((school, index) => (
                <motion.div
                  key={school.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  whileHover={{
                    y: -8,
                    scale: 1.02,
                    transition: { type: "spring", stiffness: 300, damping: 20 }
                  }}
                >
                  <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm">
                    {/* Gradient overlay for hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <CardHeader className="pb-4 relative">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Checkbox
                              checked={selectedSchools.includes(school.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSchools(prev => [...prev, school.id]);
                                } else {
                                  setSelectedSchools(prev => prev.filter(id => id !== school.id));
                                }
                              }}
                              className="border-2 border-gray-300 data-[state=checked]:bg-gray-800 data-[state=checked]:border-gray-800"
                            />
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="relative"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-600 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                            <Avatar className="w-12 h-12 relative border-2 border-white shadow-lg">
                              <AvatarFallback className="bg-gradient-to-br from-gray-800 to-gray-600 text-white font-bold text-lg">
                                {school.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </motion.div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-xl font-bold text-gray-900 truncate group-hover:text-gray-700 transition-colors duration-300">
                              {school.name}
                            </CardTitle>
                            <p className="text-sm text-gray-500 truncate font-medium">@{school.slug}</p>
                          </div>
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-gray-100 rounded-full w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                              >
                                <MoreHorizontal className="w-4 h-4 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSchoolForDetails(school.id);
                                setIsDetailsPanelOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                console.log("Edit clicked for school:", school.id, school.name);
                                console.log("Setting edit panel state...");
                                setSelectedSchoolForEdit(school.id);
                                setIsEditPanelOpen(true);
                                console.log("Edit panel should now be open");
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit School
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSchoolForDetails(school.id);
                                setIsDetailsPanelOpen(true);
                                // TODO: Focus on admin reset password section
                              }}
                            >
                              <Key className="w-4 h-4 mr-2" />
                              Reset Admin Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {school.status === "active" ? (
                              <DropdownMenuItem
                                className="text-orange-600"
                                onClick={() => {
                                  setSelectedSchoolForDetails(school.id);
                                  setIsDetailsPanelOpen(true);
                                  // TODO: Focus on suspend action
                                }}
                              >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Suspend School
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => {
                                  setSelectedSchoolForDetails(school.id);
                                  setIsDetailsPanelOpen(true);
                                  // TODO: Focus on activate action
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Activate School
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedSchoolForDetails(school.id);
                                setIsDetailsPanelOpen(true);
                                // TODO: Focus on delete action
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete School
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="flex items-center justify-between mt-4"
                      >
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(school.status)}
                          {getRegistrationBadge(school)}
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500 font-medium">
                            Created {new Date(school.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6 relative">
                      {/* Contact Info */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        className="space-y-2 text-sm"
                      >
                        {school.email && (
                          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-700 truncate font-medium">{school.email}</span>
                          </div>
                        )}
                        {school.phone && (
                          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-700 font-medium">{school.phone}</span>
                          </div>
                        )}
                      </motion.div>

                      {/* Stats */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                        className="grid grid-cols-3 gap-4"
                      >
                        <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200/50">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="flex items-center justify-center mb-2"
                          >
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                          </motion.div>
                          <div className="text-xl font-bold text-blue-900 mb-1">
                            {school._count.students}
                          </div>
                          <div className="text-xs text-blue-700 font-medium">Students</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200/50">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="flex items-center justify-center mb-2"
                          >
                            <div className="p-2 bg-green-500/10 rounded-lg">
                              <BookOpen className="w-5 h-5 text-green-600" />
                            </div>
                          </motion.div>
                          <div className="text-xl font-bold text-green-900 mb-1">
                            {school._count.teachers}
                          </div>
                          <div className="text-xs text-green-700 font-medium">Teachers</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200/50">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="flex items-center justify-center mb-2"
                          >
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                              <Shield className="w-5 h-5 text-purple-600" />
                            </div>
                          </motion.div>
                          <div className="text-xl font-bold text-purple-900 mb-1">
                            {school._count.admins}
                          </div>
                          <div className="text-xs text-purple-700 font-medium">Admins</div>
                        </div>
                      </motion.div>

                      {/* Subscription & Pricing */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                        className="pt-4 border-t border-gray-200/50 space-y-3"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 font-medium">Subscription:</span>
                          <Badge variant="outline" className="text-xs font-semibold border-gray-300 text-gray-700">
                            {getSubscriptionStatus(school.subscription)}
                          </Badge>
                        </div>
                        {school.pricingTier && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6, duration: 0.3 }}
                            className="flex items-center justify-between text-sm p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200/50"
                          >
                            <span className="text-gray-700 font-medium">Plan:</span>
                            <div className="text-right">
                              <div className="font-bold text-gray-900 text-base">{school.pricingTier.name}</div>
                              <div className="text-xs text-gray-600 font-medium">
                                {formatCurrency(school.pricingTier.monthlyFee, school.pricingTier.currency)}/month
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* School Creation Panel */}
      <SchoolCreationPanel
        isOpen={isCreationPanelOpen}
        onClose={() => setIsCreationPanelOpen(false)}
        onSuccess={() => {
          fetchSchools();
          setIsCreationPanelOpen(false);
        }}
      />

      {/* Premium Features Panel */}
      <PremiumFeaturesPanel
        isOpen={isPremiumPanelOpen}
        onClose={() => setIsPremiumPanelOpen(false)}
      />

      {/* Payment Calculator */}
      {isPaymentCalculatorOpen && (
        <PaymentCalculator
          selectedSchoolIds={selectedSchools}
          onClose={() => setIsPaymentCalculatorOpen(false)}
        />
      )}

      {/* School Details Panel */}
      <SchoolDetailsPanel
        isOpen={isDetailsPanelOpen}
        onClose={() => {
          setIsDetailsPanelOpen(false);
          setSelectedSchoolForDetails(null);
        }}
        schoolId={selectedSchoolForDetails}
        onSchoolUpdated={() => {
          fetchSchools(); // Refresh the schools list
        }}
      />

      {/* School Edit Panel */}
      <SchoolEditPanel
        isOpen={isEditPanelOpen}
        onClose={() => {
          setIsEditPanelOpen(false);
          setSelectedSchoolForEdit(null);
        }}
        schoolId={selectedSchoolForEdit}
        onSchoolUpdated={() => {
          fetchSchools(); // Refresh the schools list
        }}
      />
    </motion.div>
    </motion.div>
  );
}
