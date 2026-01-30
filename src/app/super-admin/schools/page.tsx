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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Management</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage all schools in the platform
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/super-admin/payments">
            <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
              <Banknote className="w-4 h-4 mr-2" />
              View All Payments
            </Button>
          </Link>
          <Button
            onClick={() => setIsPaymentCalculatorOpen(true)}
            variant="outline"
            disabled={selectedSchools.length === 0}
            className="border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Payments ({selectedSchools.length})
          </Button>
          <Button
            onClick={() => setIsPremiumPanelOpen(true)}
            variant="outline"
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            <Crown className="w-4 h-4 mr-2" />
            Premium Features
          </Button>
          <Button
            onClick={() => setIsCreationPanelOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create School
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schools.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schools</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schools.filter(s => s.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Schools</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schools.filter(s => s.status === "trial").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schools.reduce((acc, school) => acc + school._count.students, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Schools Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search schools by name, email, or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Schools Grid */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : schools.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No schools found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first school"
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.map((school) => (
                <motion.div
                  key={school.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedSchools.includes(school.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSchools(prev => [...prev, school.id]);
                              } else {
                                setSelectedSchools(prev => prev.filter(id => id !== school.id));
                              }
                            }}
                          />
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                              {school.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg truncate">{school.name}</CardTitle>
                            <p className="text-sm text-gray-600 truncate">@{school.slug}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
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
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(school.status)}
                          {getRegistrationBadge(school)}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(school.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Contact Info */}
                      <div className="space-y-1 text-sm text-gray-600">
                        {school.email && (
                          <div className="flex items-center">
                            <span className="truncate">{school.email}</span>
                          </div>
                        )}
                        {school.phone && (
                          <div className="flex items-center">
                            <span>{school.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="flex items-center justify-center mb-1">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {school._count.students}
                          </div>
                          <div className="text-xs text-gray-600">Students</div>
                        </div>
                        <div>
                          <div className="flex items-center justify-center mb-1">
                            <BookOpen className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {school._count.teachers}
                          </div>
                          <div className="text-xs text-gray-600">Teachers</div>
                        </div>
                        <div>
                          <div className="flex items-center justify-center mb-1">
                            <Shield className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            {school._count.admins}
                          </div>
                          <div className="text-xs text-gray-600">Admins</div>
                        </div>
                      </div>

                      {/* Subscription & Pricing */}
                      <div className="pt-3 border-t border-gray-100 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Subscription:</span>
                          <Badge variant="outline" className="text-xs">
                            {getSubscriptionStatus(school.subscription)}
                          </Badge>
                        </div>
                        {school.pricingTier && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Plan:</span>
                            <div className="text-right">
                              <div className="font-medium">{school.pricingTier.name}</div>
                              <div className="text-xs text-gray-500">
                                {formatCurrency(school.pricingTier.monthlyFee, school.pricingTier.currency)}/month
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
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
    </div>
  );
}
